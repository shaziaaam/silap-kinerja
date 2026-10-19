<?php

namespace Tests\Feature;

use App\Jobs\UploadObservationPhoto;
use App\Models\Observation;
use App\Models\Schedule;
use App\Models\User;
use App\Services\GoogleDriveService;
use App\Services\PhotoStorage\PhotoStorageInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

/** In-memory stand-in for the Shared Drive. */
class FakeDrive extends GoogleDriveService
{
    public array $files = [];
    public array $uploads = [];
    public bool $down = false;

    public function __construct()
    {
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function uploadPhoto(string $fileContents, string $fileName, string $mimeType = 'image/webp', array $folderPath = []): ?array
    {
        if ($this->down) {
            return null;
        }
        $id = 'drv' . (count($this->files) + 1);
        $this->files[$id] = $fileContents;
        $this->uploads[] = ['name' => $fileName, 'folder' => $folderPath];

        return ['id' => $id, 'name' => $fileName, 'web_view_link' => "https://drive.google.com/file/d/{$id}/view", 'web_content_link' => null];
    }

    public function getFileContent(string $fileId): ?string
    {
        return $this->files[$fileId] ?? null;
    }

    public function deleteFile(string $fileId): bool
    {
        unset($this->files[$fileId]);
        return true;
    }
}

class PhotoStorageAndDriveUploadTest extends TestCase
{
    use RefreshDatabase;

    protected User $pengamat;
    protected User $lain;
    protected Schedule $slot07;
    protected FakeDrive $drive;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Storage::fake('public');

        $buat = fn (string $nip, string $email) => User::create([
            'nama' => "Pengamat $nip", 'email' => $email, 'role' => 'pengamat', 'nip' => $nip,
            'password' => bcrypt('password'), 'must_change_password' => false,
        ]);
        $this->pengamat = $buat('199501012020121001', 'a@bmkg.go.id');
        $this->lain = $buat('199601012020121002', 'b@bmkg.go.id');

        $this->slot07 = Schedule::create(['jam_utc' => '00:00:00', 'jam_wib' => '07:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'is_mandatory_photo' => true]);

        $this->drive = new FakeDrive();
        $this->app->instance(GoogleDriveService::class, $this->drive);
    }

    protected function pakaiDrive(): void
    {
        config(['silap.photo_disk' => 'drive']);
        $this->app->forgetInstance(PhotoStorageInterface::class);
    }

    protected function kirimFoto(string $isi = 'FOTO-WEBP')
    {
        return $this->actingAs($this->pengamat)->post(route('observations.store'), [
            'schedule_id' => $this->slot07->id,
            'tanggal' => '2026-10-09',
            'status_pengamatan' => 'lengkap',
            'foto' => 'data:image/webp;base64,' . base64_encode($isi),
            'foto_sumber' => 'kamera',
        ]);
    }

    public function test_photo_is_kept_private_in_dated_folder_and_served_only_to_allowed_users(): void
    {
        $this->kirimFoto()->assertSessionHasNoErrors();
        $obs = Observation::firstOrFail();

        $this->assertMatchesRegularExpression('#^foto_observasi/2026/10/09/obs_.+\.webp$#', $obs->photo_ref);
        Storage::disk('local')->assertExists($obs->photo_ref);
        $this->assertSame([], Storage::disk('public')->allFiles(), 'photos must not be on the public disk');
        $this->assertSame(route('observations.photo', $obs->id), $obs->foto_url);

        $this->actingAs($this->pengamat)->get(route('observations.photo', $obs))
            ->assertOk()->assertSee('FOTO-WEBP', false);
        $this->actingAs($this->lain)->get(route('observations.photo', $obs))->assertForbidden();
    }

    public function test_unreadable_photo_in_mandatory_slot_is_rejected(): void
    {
        $this->actingAs($this->pengamat)->post(route('observations.store'), [
            'schedule_id' => $this->slot07->id, 'tanggal' => '2026-10-09', 'status_pengamatan' => 'lengkap',
            'foto' => 'data:image/webp;base64,@@@bukan-base64@@@',
        ])->assertSessionHasErrors('foto');

        $this->assertSame(0, Observation::count());
    }

    public function test_drive_mode_queues_upload_and_job_moves_photo_to_dated_drive_folder(): void
    {
        $this->pakaiDrive();
        Queue::fake();

        $this->kirimFoto()->assertSessionHasNoErrors();
        $obs = Observation::firstOrFail();
        $localRef = $obs->photo_ref;

        Queue::assertPushed(UploadObservationPhoto::class, fn ($job) => $job->observationId === $obs->id && $job->localRef === $localRef);
        Storage::disk('local')->assertExists($localRef); // safe on the server until uploaded

        (new UploadObservationPhoto($obs->id, $localRef))->handle();
        $obs->refresh();

        $this->assertSame('drv1', $obs->photo_ref);
        $this->assertSame('drv1', $obs->foto_gdrive_id);
        $this->assertSame(['2026', '10', '09'], $this->drive->uploads[0]['folder']);
        Storage::disk('local')->assertMissing($localRef); // temporary copy removed

        // Still viewable, streamed from Drive through the server
        $this->actingAs($this->pengamat)->get(route('observations.photo', $obs))
            ->assertOk()->assertSee('FOTO-WEBP', false);
    }

    public function test_failed_upload_throws_for_retry_and_photo_stays_viewable_on_server(): void
    {
        $this->pakaiDrive();
        Queue::fake();
        $this->drive->down = true;

        $this->kirimFoto()->assertSessionHasNoErrors();
        $obs = Observation::firstOrFail();

        try {
            (new UploadObservationPhoto($obs->id, $obs->photo_ref))->handle();
            $this->fail('A failed upload must throw so the queue retries it.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('gagal', $e->getMessage());
        }

        $obs->refresh();
        $this->assertNull($obs->foto_gdrive_id);
        Storage::disk('local')->assertExists($obs->photo_ref);
        $this->actingAs($this->pengamat)->get(route('observations.photo', $obs))->assertOk();

        $job = new UploadObservationPhoto($obs->id, $obs->photo_ref);
        $this->assertSame(8, $job->tries);
        $this->assertSame([60, 300, 900, 1800, 3600], $job->backoff());
    }

    public function test_stale_job_does_nothing_when_photo_was_replaced(): void
    {
        $this->pakaiDrive();
        Queue::fake();

        $this->kirimFoto()->assertSessionHasNoErrors();
        $obs = Observation::firstOrFail();

        (new UploadObservationPhoto($obs->id, 'foto_observasi/2026/10/09/lama.webp'))->handle();

        $this->assertSame([], $this->drive->uploads);
        $this->assertNull($obs->fresh()->foto_gdrive_id);
    }

    public function test_hourly_command_requeues_photos_still_on_the_server(): void
    {
        $this->pakaiDrive();
        Queue::fake();
        $this->kirimFoto()->assertSessionHasNoErrors();
        Queue::fake(); // forget the dispatch from store

        $this->artisan('silap:unggah-foto-tertunda')->assertSuccessful();

        Queue::assertPushed(UploadObservationPhoto::class, 1);
    }
}

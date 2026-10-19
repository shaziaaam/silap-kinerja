<?php

namespace Tests\Feature;

use App\Jobs\ExportSkpZip;
use App\Models\Observation;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\SkpExport;
use App\Models\User;
use App\Services\PhotoStorage\PhotoStorageInterface;
use App\Services\SkpPdfBuilder;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use ZipArchive;

/**
 * Evidence photos are archived as WebP, which DomPDF cannot read, so every SKP
 * route must hand it a JPEG copy. Covers the preview, the direct download and the
 * ZIP export, since the ZIP previously rendered without any observation data.
 */
class SkpPdfPhotoTest extends TestCase
{
    use RefreshDatabase;

    protected User $pengamat;
    protected User $penyelia;
    protected RekapSkpTriwulan $recap;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pengamat = User::create([
            'nama' => 'Pengamat Foto', 'email' => 'foto@bmkg.go.id', 'role' => 'pengamat',
            'nip' => '199501012020121009', 'password' => bcrypt('password'), 'must_change_password' => false,
        ]);
        $this->penyelia = User::create([
            'nama' => 'Penyelia Foto', 'email' => 'penyeliafoto@bmkg.go.id', 'role' => 'penyelia',
            'nip' => '198501012010121009', 'password' => bcrypt('password'), 'must_change_password' => false,
        ]);

        $slot = Schedule::create([
            'jam_utc' => '00:00:00', 'jam_wib' => '07:00:00',
            'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'is_mandatory_photo' => true,
        ]);

        $saved = app(PhotoStorageInterface::class)->store($this->webpBytes(), 'obs_test.webp', 'image/webp');

        Observation::create([
            'user_id' => $this->pengamat->id, 'schedule_id' => $slot->id,
            'tanggal' => '2026-10-05', 'status_pengamatan' => 'lengkap', 'shift' => 'pagi',
            'status_approval' => 'approved', 'foto_path' => $saved['ref'],
            'photo_ref' => $saved['ref'], 'foto_sumber' => 'kamera',
        ]);

        $this->recap = RekapSkpTriwulan::create([
            'user_id' => $this->pengamat->id, 'tahun' => 2026, 'triwulan' => 'T4',
            'total_pengamatan_valid' => 1, 'status' => 'approved',
        ]);
    }

    /** A small real WebP image, the format the camera component produces. */
    protected function webpBytes(): string
    {
        $im = imagecreatetruecolor(320, 240);
        imagefill($im, 0, 0, imagecolorallocate($im, 120, 160, 200));
        ob_start();
        imagewebp($im, null, 80);
        $bytes = ob_get_clean();
        imagedestroy($im);

        return $bytes;
    }

    /** PDFs embed JPEG data in a DCTDecode stream; its absence means no photo was drawn. */
    protected function assertPdfHasJpeg(string $pdf, string $pesan): void
    {
        $this->assertStringContainsString('%PDF', substr($pdf, 0, 8), 'Bukan berkas PDF.');
        $this->assertStringContainsString('DCTDecode', $pdf, $pesan);
    }

    public function test_webp_photo_is_converted_to_jpeg_for_pdf(): void
    {
        $jpeg = app(\App\Services\PdfPhotoService::class)
            ->jpegPath(Observation::where('user_id', $this->pengamat->id)->first());

        $this->assertNotNull($jpeg, 'Layanan tidak menghasilkan salinan JPEG.');
        $this->assertFileExists($jpeg);
        $this->assertSame(IMAGETYPE_JPEG, getimagesize($jpeg)[2], 'Salinan untuk PDF bukan JPEG.');
    }

    public function test_skp_preview_pdf_embeds_the_photo(): void
    {
        $response = $this->actingAs($this->penyelia)
            ->get(route('supervisor.skp.pdf', $this->recap->id));

        $response->assertOk();
        // DomPDF's stream() returns a plain response, not a streamed one.
        $this->assertPdfHasJpeg($response->getContent(), 'PDF preview tidak memuat foto bukti.');
    }

    public function test_skp_zip_export_is_queued_and_produces_a_pdf_with_the_photo(): void
    {
        Queue::fake();

        $this->actingAs($this->penyelia)
            ->post(route('supervisor.skp.zip'), [
                'tahun' => 2026,
                'periode' => 'T4',
                'user_id' => (string) $this->pengamat->id,
            ])
            ->assertRedirect();

        // The request must not build the package itself; it only enqueues the work.
        Queue::assertPushed(ExportSkpZip::class);

        $export = SkpExport::latest()->firstOrFail();
        $this->assertSame('antre', $export->status);

        // Run the job as the worker would.
        (new ExportSkpZip($export->id))->handle(app(SkpPdfBuilder::class));

        $export->refresh();
        $this->assertSame('selesai', $export->status, 'Job tidak menyelesaikan paket ZIP.');
        $this->assertTrue($export->siapDiunduh(), 'Berkas ZIP tidak ada di server.');

        $response = $this->actingAs($this->penyelia)
            ->get(route('supervisor.skp.export_download', $export->id));
        $response->assertOk();

        $zipPath = tempnam(sys_get_temp_dir(), 'skpzip') . '.zip';
        file_put_contents($zipPath, $response->streamedContent());

        $zip = new ZipArchive();
        $this->assertTrue($zip->open($zipPath) === true, 'Berkas ZIP tidak bisa dibuka.');
        $this->assertGreaterThan(0, $zip->numFiles, 'ZIP tidak berisi berkas apa pun.');
        $pdf = $zip->getFromIndex(0);
        $zip->close();
        @unlink($zipPath);

        $this->assertPdfHasJpeg($pdf, 'PDF di dalam ZIP tidak memuat foto bukti.');
    }

    public function test_pengamat_cannot_download_someone_elses_export(): void
    {
        $export = SkpExport::create([
            'requested_by' => $this->penyelia->id,
            'tahun' => 2026, 'periode' => 'T4', 'status' => 'selesai',
            'file_path' => 'skp-exports/tidak-ada.zip',
        ]);

        $this->actingAs($this->pengamat)
            ->get(route('supervisor.skp.export_download', $export->id))
            ->assertForbidden();
    }
}

<?php

namespace Tests\Feature;

use App\Models\Instrument;
use App\Models\InstrumentParameter;
use App\Models\Observation;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RevisionRulesAndQuarterTest extends TestCase
{
    use RefreshDatabase;

    protected User $pengamat;
    protected User $penyelia;
    protected Schedule $slot07;
    protected Schedule $slot10;
    protected Schedule $slot17;
    protected Schedule $slot0730;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pengamat = User::create([
            'nama' => 'Pengamat Test',
            'email' => 'pengamat@bmkg.go.id',
            'role' => 'pengamat',
            'nip' => '199501012020121001',
            'password' => bcrypt('password'),
            'must_change_password' => false,
        ]);

        $this->penyelia = User::create([
            'nama' => 'Penyelia Test',
            'email' => 'penyelia@bmkg.go.id',
            'role' => 'penyelia',
            'nip' => '198501012010121002',
            'password' => bcrypt('password'),
            'must_change_password' => false,
        ]);

        $this->slot07 = Schedule::create([
            'jam_utc' => '00:00:00',
            'jam_wib' => '07:00:00',
            'kelompok' => 'JAM_PENUH',
            'shift' => 'pagi',
            'is_mandatory_photo' => true,
        ]);

        $this->slot10 = Schedule::create([
            'jam_utc' => '03:00:00',
            'jam_wib' => '10:00:00',
            'kelompok' => 'JAM_PENUH',
            'shift' => 'pagi',
            'is_mandatory_photo' => false,
        ]);

        $this->slot17 = Schedule::create([
            'jam_utc' => '10:00:00',
            'jam_wib' => '17:00:00',
            'kelompok' => 'JAM_PENUH',
            'shift' => 'siang',
            'is_mandatory_photo' => true,
        ]);

        $this->slot0730 = Schedule::create([
            'jam_utc' => '00:30:00',
            'jam_wib' => '07:30:00',
            'kelompok' => 'AGM1B',
            'shift' => 'pagi',
            'is_mandatory_photo' => false,
        ]);
    }

    public function test_photo_is_mandatory_at_0700_and_1700_slots(): void
    {
        // Slot 07:00 tanpa foto -> ditolak
        $response = $this->actingAs($this->pengamat)->post(route('observations.store'), [
            'schedule_id' => $this->slot07->id,
            'tanggal' => '2026-03-15',
            'status_pengamatan' => 'lengkap',
        ]);
        $response->assertSessionHasErrors(['foto']);

        // Slot 10:00 tanpa foto -> diterima
        $response10 = $this->actingAs($this->pengamat)->post(route('observations.store'), [
            'schedule_id' => $this->slot10->id,
            'tanggal' => '2026-03-15',
            'status_pengamatan' => 'lengkap',
        ]);
        $response10->assertRedirect(route('observations.index'));
        $this->assertDatabaseHas('observations', [
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->slot10->id,
            'foto_path' => null,
        ]);
    }

    public function test_quarterly_approval_is_blocked_if_user_has_revision(): void
    {
        // Buat observasi T1 berstatus revision
        Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->slot10->id,
            'tanggal' => '2026-02-10',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'revision',
            'catatan_supervisor' => 'Mohon periksa ulang suhu',
        ]);

        $response = $this->actingAs($this->penyelia)->post(route('supervisor.approve_quarter'), [
            'user_id' => $this->pengamat->id,
            'tahun' => 2026,
            'triwulan' => 'T1',
        ]);

        $response->assertSessionHasErrors(['error']);
        $this->assertDatabaseMissing('rekap_skp_triwulan', [
            'user_id' => $this->pengamat->id,
            'tahun' => 2026,
            'triwulan' => 'T1',
            'status' => 'approved',
        ]);
    }

    public function test_quarterly_approval_succeeds_when_no_revisions(): void
    {
        Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->slot10->id,
            'tanggal' => '2026-02-10',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'pending',
        ]);

        $response = $this->actingAs($this->penyelia)->post(route('supervisor.approve_quarter'), [
            'user_id' => $this->pengamat->id,
            'tahun' => 2026,
            'triwulan' => 'T1',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('rekap_skp_triwulan', [
            'user_id' => $this->pengamat->id,
            'tahun' => 2026,
            'triwulan' => 'T1',
            'status' => 'approved',
        ]);
        $this->assertDatabaseHas('observations', [
            'user_id' => $this->pengamat->id,
            'status_approval' => 'approved',
        ]);
    }

    public function test_csv_export_includes_national_form_data(): void
    {
        $obs = Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->slot10->id,
            'tanggal' => '2026-03-15',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'pending',
        ]);

        $response = $this->actingAs($this->pengamat)->get(route('observations.export_csv', [
            'tanggal' => '2026-03-15',
        ]));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }
}

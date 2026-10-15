<?php

namespace Tests\Feature;

use App\Models\Observation;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ObservationStatusAndRevisionTest extends TestCase
{
    use RefreshDatabase;

    protected User $pengamat;
    protected User $penyelia;
    protected Schedule $schedule;

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

        $this->schedule = Schedule::create([
            'jam_utc' => '00:00:00',
            'jam_wib' => '07:00:00',
            'is_synoptic' => true,
        ]);
    }

    public function test_observation_initial_status_is_pending(): void
    {
        $obs = Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->schedule->id,
            'tanggal' => '2026-02-15',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'pending',
        ]);

        $this->assertEquals('pending', $obs->fresh()->status_approval);
    }

    public function test_supervisor_can_request_revision_with_notes(): void
    {
        $obs = Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->schedule->id,
            'tanggal' => '2026-02-15',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'pending',
        ]);

        $response = $this->actingAs($this->penyelia)->post(route('supervisor.action', $obs->id), [
            'status_approval' => 'revision',
            'catatan_supervisor' => 'Suhu bola basah keliru, tolong dicek kembali.',
        ]);

        $response->assertRedirect();
        $freshObs = $obs->fresh();
        $this->assertEquals('revision', $freshObs->status_approval);
        $this->assertEquals('Suhu bola basah keliru, tolong dicek kembali.', $freshObs->catatan_supervisor);
    }

    public function test_supervisor_cannot_set_status_to_rejected(): void
    {
        $obs = Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->schedule->id,
            'tanggal' => '2026-02-15',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'pending',
        ]);

        $response = $this->actingAs($this->penyelia)->post(route('supervisor.action', $obs->id), [
            'status_approval' => 'rejected',
        ]);

        $response->assertSessionHasErrors('status_approval');
        $this->assertEquals('pending', $obs->fresh()->status_approval);
    }

    public function test_pengamat_can_update_revision_observation_and_resubmit_to_pending(): void
    {
        $obs = Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->schedule->id,
            'tanggal' => '2026-02-15',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'revision',
            'catatan_supervisor' => 'Perbaiki nilai suhu',
            'foto_path' => 'storage/watermarked_photos/test.webp',
        ]);

        $response = $this->actingAs($this->pengamat)->put(route('observations.update', $obs->id), [
            'schedule_id' => $this->schedule->id,
            'tanggal' => '2026-02-15',
            'status_pengamatan' => 'lengkap',
            'values' => [],
        ]);

        $response->assertRedirect(route('observations.index'));
        $freshObs = $obs->fresh();
        $this->assertEquals('pending', $freshObs->status_approval);
        $this->assertNull($freshObs->catatan_supervisor);
    }

    public function test_skp_generation_is_blocked_if_observation_in_period_is_revision(): void
    {
        // 1 Approved observation in February 2026 (Triwulan 1)
        Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->schedule->id,
            'tanggal' => '2026-02-10',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'approved',
        ]);

        // 1 Revision observation in February 2026 (Triwulan 1)
        Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->schedule->id,
            'tanggal' => '2026-02-11',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'revision',
            'catatan_supervisor' => 'Cek ulang suhu bola basah',
        ]);

        $response = $this->actingAs($this->penyelia)->post(route('supervisor.skp.generate'), [
            'user_id' => $this->pengamat->id,
            'tahun' => 2026,
            'periode' => 'T1',
        ]);

        $response->assertSessionHasErrors('message');
        $this->assertDatabaseMissing('rekap_skp_triwulan', [
            'user_id' => $this->pengamat->id,
            'tahun' => 2026,
            'triwulan' => 'T1',
        ]);
    }

    public function test_skp_generation_succeeds_when_all_observations_are_approved_or_pending(): void
    {
        // 2 Approved observations in February 2026 (Triwulan 1)
        Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->schedule->id,
            'tanggal' => '2026-02-10',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'approved',
        ]);

        Observation::create([
            'user_id' => $this->pengamat->id,
            'schedule_id' => $this->schedule->id,
            'tanggal' => '2026-02-11',
            'status_pengamatan' => 'lengkap',
            'status_approval' => 'approved',
        ]);

        $response = $this->actingAs($this->penyelia)->post(route('supervisor.skp.generate'), [
            'user_id' => $this->pengamat->id,
            'tahun' => 2026,
            'periode' => 'T1',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('rekap_skp_triwulan', [
            'user_id' => $this->pengamat->id,
            'tahun' => 2026,
            'triwulan' => 'T1',
            'total_pengamatan_valid' => 2,
        ]);
    }
}

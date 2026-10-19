<?php

namespace Tests\Feature;

use App\Models\Observation;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuarterLockAndRolesTest extends TestCase
{
    use RefreshDatabase;

    protected User $pengamat;
    protected User $penyelia;
    protected User $admin;
    protected Schedule $slot;

    protected function setUp(): void
    {
        parent::setUp();

        $buat = fn (string $role, string $nip) => User::create([
            'nama' => ucfirst($role) . ' Test', 'email' => "$role@bmkg.go.id", 'role' => $role,
            'nip' => $nip, 'password' => bcrypt('password'), 'must_change_password' => false,
        ]);
        $this->pengamat = $buat('pengamat', '199501012020121001');
        $this->penyelia = $buat('penyelia', '198501012010121002');
        $this->admin = $buat('admin', '198001012005011003');

        $this->slot = Schedule::create(['jam_utc' => '03:00:00', 'jam_wib' => '10:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'is_mandatory_photo' => false]);
    }

    protected function observasi(string $tanggal, string $status = 'pending'): Observation
    {
        return Observation::create([
            'user_id' => $this->pengamat->id, 'schedule_id' => $this->slot->id, 'tanggal' => $tanggal,
            'status_pengamatan' => 'lengkap', 'shift' => 'pagi', 'status_approval' => $status,
        ]);
    }

    protected function accT3(): void
    {
        $this->actingAs($this->penyelia)->post(route('supervisor.approve_quarter'), [
            'user_id' => $this->pengamat->id, 'tahun' => 2026, 'triwulan' => 'T3',
        ])->assertSessionHasNoErrors();
    }

    public function test_observer_cannot_approve_own_quarter_or_use_admin_pages(): void
    {
        $this->observasi('2026-08-10');

        $this->actingAs($this->pengamat)->post(route('supervisor.approve_quarter'), [
            'user_id' => $this->pengamat->id, 'tahun' => 2026, 'triwulan' => 'T3',
        ])->assertForbidden();
        $this->actingAs($this->pengamat)->post(route('supervisor.approve_all'), ['tahun' => 2026, 'triwulan' => 'T3'])->assertForbidden();
        $this->actingAs($this->pengamat)->get(route('supervisor.queue'))->assertForbidden();
        $this->actingAs($this->pengamat)->post(route('admin.users.store'), [
            'nama' => 'Penyusup', 'nip' => '1', 'role' => 'admin', 'password' => 'password123',
        ])->assertForbidden();
        $this->actingAs($this->pengamat)->get(route('admin.instruments.index'))->assertForbidden();

        $this->assertSame('pending', Observation::first()->status_approval);
        $this->assertSame(3, User::count());
    }

    public function test_only_supervisor_approves_and_only_admin_unlocks(): void
    {
        $this->observasi('2026-08-10');

        $this->actingAs($this->admin)->post(route('supervisor.approve_quarter'), [
            'user_id' => $this->pengamat->id, 'tahun' => 2026, 'triwulan' => 'T3',
        ])->assertForbidden();
        $this->actingAs($this->admin)->get(route('supervisor.queue'))->assertOk();

        $this->accT3();

        $this->actingAs($this->penyelia)->post(route('admin.unlock_quarter'), [
            'user_id' => $this->pengamat->id, 'tahun' => 2026, 'triwulan' => 'T3', 'alasan' => 'Salah input TBK',
        ])->assertForbidden();
        $this->assertSame('approved', Observation::first()->status_approval);
    }

    public function test_approved_quarter_is_locked_for_every_role(): void
    {
        $obs = $this->observasi('2026-08-10');
        $this->accT3();

        // The observer is sent back (locked); supervisor and admin never edit observations
        $this->actingAs($this->pengamat)->get(route('observations.edit', $obs))->assertRedirect(route('observations.index'));
        foreach ([$this->penyelia, $this->admin] as $user) {
            $this->actingAs($user)->get(route('observations.edit', $obs))->assertForbidden();
        }
        $this->actingAs($this->penyelia)->post(route('supervisor.action', $obs), [
            'status_approval' => 'revision', 'catatan_supervisor' => 'Coba ubah',
        ])->assertSessionHasErrors('error');

        $this->assertSame('approved', $obs->fresh()->status_approval);
    }

    public function test_admin_unlock_reopens_quarter_and_records_who_and_why(): void
    {
        $this->observasi('2026-07-05');
        $this->observasi('2026-09-30');
        $lain = $this->observasi('2026-10-01'); // T4, must not be touched
        $this->accT3();
        $lain->update(['status_approval' => 'approved']);

        $this->actingAs($this->admin)->post(route('admin.unlock_quarter'), [
            'user_id' => $this->pengamat->id, 'tahun' => 2026, 'triwulan' => 'T3', 'alasan' => '',
        ])->assertSessionHasErrors('alasan');

        $this->actingAs($this->admin)->post(route('admin.unlock_quarter'), [
            'user_id' => $this->pengamat->id, 'tahun' => 2026, 'triwulan' => 'T3',
            'alasan' => 'Salah input TBK tanggal 5 Juli, diminta pengamat',
        ])->assertSessionHasNoErrors();

        // Includes the quarter's last day (30 September)
        $this->assertSame(2, Observation::where('tanggal', '<', '2026-10-01')->where('status_approval', 'pending')->count());
        $this->assertSame('approved', $lain->fresh()->status_approval);

        $recap = RekapSkpTriwulan::where('user_id', $this->pengamat->id)->where('triwulan', 'T3')->first();
        $this->assertSame('pending', $recap->status);
        $this->assertNull($recap->approved_at);
        $this->assertSame($this->admin->id, $recap->dibuka_oleh);
        $this->assertNotNull($recap->dibuka_at);
        $this->assertSame('Salah input TBK tanggal 5 Juli, diminta pengamat', $recap->alasan_buka);

        // Now editable again, then re-approvable by the supervisor
        $obs = Observation::whereDate('tanggal', '2026-07-05')->first();
        $this->actingAs($this->pengamat)->get(route('observations.edit', $obs))->assertOk();
        $this->accT3();
        $this->assertSame('approved', $recap->fresh()->status);
    }

    public function test_supervisor_cannot_approve_single_observation_and_revision_needs_a_note(): void
    {
        $obs = $this->observasi('2026-08-10');

        $this->actingAs($this->penyelia)->post(route('supervisor.action', $obs), ['status_approval' => 'approved'])
            ->assertSessionHasErrors('status_approval');
        $this->actingAs($this->penyelia)->post(route('supervisor.action', $obs), ['status_approval' => 'revision'])
            ->assertSessionHasErrors('catatan_supervisor');

        $this->assertSame('pending', $obs->fresh()->status_approval);
    }

    public function test_approve_all_reports_skipped_observers_with_revisions(): void
    {
        $lain = User::create([
            'nama' => 'Pengamat Dua', 'email' => 'dua@bmkg.go.id', 'role' => 'pengamat',
            'nip' => '199601012020121004', 'password' => bcrypt('password'), 'must_change_password' => false,
        ]);
        $this->observasi('2026-08-10');
        Observation::create([
            'user_id' => $lain->id, 'schedule_id' => $this->slot->id, 'tanggal' => '2026-08-11',
            'status_pengamatan' => 'lengkap', 'shift' => 'pagi', 'status_approval' => 'revision',
        ]);

        $this->actingAs($this->penyelia)->post(route('supervisor.approve_all'), ['tahun' => 2026, 'triwulan' => 'T3'])
            ->assertSessionHas('message', 'Persetujuan massal triwulan selesai: 1 pegawai di-ACC. Dilewati karena masih ada revisi: Pengamat Dua.');
    }
}

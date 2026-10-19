<?php

namespace Tests\Feature;

use App\Models\InstrumentParameter;
use App\Models\Observation;
use App\Models\ObservationValue;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\InstrumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $pengamat;
    protected User $penyelia;
    protected User $admin;
    /** @var array<string, Schedule> */
    protected array $slot = [];

    protected function setUp(): void
    {
        parent::setUp();
        // Fixed "now": Friday 9 October 2026, 10:15 WIB (shift pagi, T4)
        Carbon::setTestNow(Carbon::create(2026, 10, 9, 10, 15, 0, 'Asia/Jakarta'));
        $this->seed(InstrumentSeeder::class);

        $buat = fn (string $nama, string $role, string $nip, bool $ganti = false) => User::create([
            'nama' => $nama, 'email' => strtolower(str_replace(' ', '', $nama)) . '@bmkg.go.id', 'role' => $role,
            'nip' => $nip, 'password' => bcrypt('password'), 'must_change_password' => $ganti,
        ]);
        $this->pengamat = $buat('Edy Susanto', 'pengamat', '199001012015031001');
        $buat('Muryanti', 'pengamat', '199101012015032002', true);
        $this->penyelia = $buat('Richardus Teguh', 'penyelia', '198501012010121002');
        $this->admin = $buat('Admin Silap', 'admin', '198001012005011003');

        // The real timetable: 16 full hours + 3 AGM 1-B slots
        foreach (range(7, 22) as $j) {
            $jam = sprintf('%02d:00', $j);
            $this->slot[$jam] = Schedule::create(['jam_utc' => sprintf('%02d:00:00', $j - 7), 'jam_wib' => "$jam:00", 'kelompok' => 'JAM_PENUH',
                'shift' => $j < 15 ? 'pagi' : 'siang', 'is_mandatory_photo' => in_array($j, [7, 17], true)]);
        }
        foreach (['07:30' => 'pagi', '13:30' => 'pagi', '17:30' => 'siang'] as $jam => $shift) {
            $this->slot[$jam] = Schedule::create(['jam_utc' => '00:30:00', 'jam_wib' => "$jam:00", 'kelompok' => 'AGM1B', 'shift' => $shift, 'is_mandatory_photo' => false]);
        }
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    protected function obs(string $jam, string $tanggal = '2026-10-09', array $atribut = [], array $nilai = []): Observation
    {
        $o = Observation::create($atribut + [
            'user_id' => $this->pengamat->id, 'schedule_id' => $this->slot[$jam]->id, 'tanggal' => $tanggal,
            'status_pengamatan' => 'lengkap', 'shift' => $this->slot[$jam]->shift, 'status_approval' => 'pending',
        ]);
        foreach ($nilai as $kode => $v) {
            ObservationValue::create(['observation_id' => $o->id, 'parameter_id' => InstrumentParameter::where('kode', $kode)->value('id'), 'nilai_manual' => $v]);
        }
        return $o;
    }

    public function test_observer_dashboard_lists_all_19_slots_revisions_shift_summary_and_quarter(): void
    {
        $this->obs('07:00', '2026-10-09', ['photo_ref' => 'foto_observasi/2026/10/09/a.webp', 'foto_path' => 'foto_observasi/2026/10/09/a.webp'],
            ['jumlah_awan_okta' => '3', 'curah_hujan_ombrometer' => '0']);
        $this->obs('07:30', '2026-10-09', [], ['suhu_bola_kering' => '27.6']);
        $this->obs('08:00', '2026-10-08', ['status_approval' => 'revision', 'catatan_supervisor' => 'TBB salah ketik']);

        $this->actingAs($this->pengamat)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->has('slotHariIni', 19)
                ->where('kelengkapanHariIni.jamPenuh', ['terisi' => 1, 'total' => 16])
                ->where('kelengkapanHariIni.agm1b', ['terisi' => 1, 'total' => 3])
                ->where('slotBerikutnya.jam', '08:00')       // earliest due, still empty
                ->has('perluDiperbaiki', 1)
                ->where('perluDiperbaiki.0.catatan', 'TBB salah ketik')
                ->where('shiftSekarang', 'pagi')
                ->where('ringkasanShift.suhu_rata', '27.6')
                ->where('ringkasanShift.keadaan_cuaca', 'Cerah Berawan')
                ->where('triwulanSaya.jumlahObservasi', 3)
                ->where('triwulanSaya.revisi', 1)
                ->where('triwulanSaya.statusAcc', 'pending')
                ->where('triwulanSaya.recapId', null));
    }

    public function test_supervisor_dashboard_shows_quarter_status_calendar_and_missing_photos(): void
    {
        $this->obs('07:00', '2026-10-08'); // saved without photo
        $this->obs('08:00', '2026-10-08');
        RekapSkpTriwulan::create(['user_id' => $this->pengamat->id, 'tahun' => 2026, 'triwulan' => 'T4', 'status' => 'pending', 'total_pengamatan_valid' => 0]);

        $this->actingAs($this->penyelia)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('statusTriwulan', 2)
                ->where('statusTriwulan.0.pegawai.nama', 'Edy Susanto')
                ->where('statusTriwulan.0.siapAcc', true)
                ->where('kalender.totalJamPenuh', 16)
                ->where('kalender.totalAgm1b', 3)
                ->where('kalender.hari.7.jamPenuh', 2)          // 8 October
                ->where('shiftTanpaFoto', fn ($list) => collect($list)->contains(fn ($f) => $f['tanggal'] === '2026-10-08' && $f['jam'] === '07:00' && str_contains($f['keterangan'], 'tanpa foto'))
                    && collect($list)->contains(fn ($f) => $f['tanggal'] === '2026-10-08' && $f['jam'] === '17:00' && $f['keterangan'] === 'Slot belum diisi')
                    && !collect($list)->contains(fn ($f) => $f['tanggal'] === '2026-10-09' && $f['jam'] === '17:00')));  // not due yet
    }

    public function test_admin_dashboard_shows_system_health(): void
    {
        RekapSkpTriwulan::create(['user_id' => $this->pengamat->id, 'tahun' => 2026, 'triwulan' => 'T3', 'status' => 'pending',
            'total_pengamatan_valid' => 0, 'dibuka_oleh' => $this->admin->id, 'dibuka_at' => now(), 'alasan_buka' => 'Salah input TBK']);

        $this->actingAs($this->admin)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('sistem.driveAktif', false)
                ->where('sistem.jobGagal', 0)
                ->has('akunBelumGantiPassword', 1)
                ->where('akunBelumGantiPassword.0.nama', 'Muryanti')
                ->where('riwayatBukaKunci.0.alasan', 'Salah input TBK')
                ->where('riwayatBukaKunci.0.oleh', 'Admin Silap')
                ->has('konfigurasi.parameterNonaktif'));
    }
}

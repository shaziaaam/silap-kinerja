<?php

namespace Tests\Feature;

use App\Jobs\ExportSkpZip;
use App\Models\InstrumentParameter;
use App\Models\Observation;
use App\Models\ObservationValue;
use App\Models\ParameterOption;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\Setting;
use App\Models\SkpExport;
use App\Models\User;
use App\Services\ShiftReportImageService;
use App\Services\SkpPdfBuilder;
use Database\Seeders\InstrumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ReportAccessAndInputRulesTest extends TestCase
{
    use RefreshDatabase;

    protected User $pengamat;
    protected User $pengamatLain;
    protected User $penyelia;
    protected User $admin;
    /** @var array<string, Schedule> */
    protected array $slot = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(InstrumentSeeder::class);

        $buat = fn (string $nama, string $role, string $nip) => User::create([
            'nama' => $nama, 'email' => strtolower(str_replace(' ', '', $nama)) . '@bmkg.go.id', 'role' => $role,
            'nip' => $nip, 'password' => bcrypt('password'), 'must_change_password' => false,
        ]);
        $this->pengamat = $buat('Edy Susanto', 'pengamat', '199001012015031001');
        $this->pengamatLain = $buat('Muryanti', 'pengamat', '199101012015032002');
        $this->penyelia = $buat('Richardus Teguh', 'penyelia', '198501012010121002');
        $this->admin = $buat('Admin Silap', 'admin', '198001012005011003');

        foreach (['07:00' => ['JAM_PENUH', 'pagi'], '07:30' => ['AGM1B', 'pagi'], '08:00' => ['JAM_PENUH', 'pagi'], '13:30' => ['AGM1B', 'pagi']] as $jam => [$kelompok, $shift]) {
            $this->slot[$jam] = Schedule::create([
                'jam_utc' => sprintf('%02d:%s:00', (int) substr($jam, 0, 2) - 7, substr($jam, 3, 2)),
                'jam_wib' => "$jam:00", 'kelompok' => $kelompok, 'shift' => $shift, 'is_mandatory_photo' => $jam === '07:00',
            ]);
        }
    }

    protected function obs(User $u, string $jam, string $tanggal = '2026-10-09', array $nilai = [], string $status = 'approved'): Observation
    {
        $o = Observation::create([
            'user_id' => $u->id, 'schedule_id' => $this->slot[$jam]->id, 'tanggal' => $tanggal,
            'status_pengamatan' => 'lengkap', 'shift' => 'pagi', 'status_approval' => $status,
        ]);
        foreach ($nilai as $kode => $v) {
            ObservationValue::create(['observation_id' => $o->id, 'parameter_id' => InstrumentParameter::where('kode', $kode)->value('id'), 'nilai_manual' => $v]);
        }
        return $o;
    }

    protected function accT4(User $u): RekapSkpTriwulan
    {
        return RekapSkpTriwulan::create([
            'user_id' => $u->id, 'tahun' => 2026, 'triwulan' => 'T4', 'status' => 'approved',
            'approved_by' => $this->penyelia->id, 'approved_at' => now(), 'total_pengamatan_valid' => 1,
        ]);
    }

    protected function kirim(User $u, string $jam, string $tanggal = '2026-10-09')
    {
        return $this->actingAs($u)->post(route('observations.store'), [
            'schedule_id' => $this->slot[$jam]->id, 'tanggal' => $tanggal, 'status_pengamatan' => 'lengkap',
            'values' => [InstrumentParameter::where('kode', 'jumlah_awan_okta')->value('id') => ['manual' => '3']],
        ]);
    }

    // ---- Downloads ----------------------------------------------------------------

    public function test_observer_downloads_only_own_reports(): void
    {
        $milikLain = $this->obs($this->pengamatLain, '08:00');
        $recapLain = $this->accT4($this->pengamatLain);

        $this->actingAs($this->pengamat)->get(route('observations.pdf', $milikLain))->assertForbidden();
        $this->actingAs($this->pengamat)->get(route('supervisor.skp.pdf', $recapLain))->assertForbidden();
        $this->actingAs($this->pengamat)->get(route('supervisor.skp.pdf-direct', [
            'user_id' => $this->pengamatLain->id, 'tahun' => 2026, 'periode' => 'T4',
        ]))->assertForbidden();
    }

    public function test_observer_cannot_create_or_download_zip(): void
    {
        $export = SkpExport::create(['requested_by' => $this->penyelia->id, 'tahun' => 2026, 'periode' => 'T4', 'status' => 'selesai']);

        $this->actingAs($this->pengamat)->post(route('supervisor.skp.zip'), ['tahun' => 2026, 'periode' => 'T4'])->assertForbidden();
        $this->actingAs($this->pengamat)->get(route('supervisor.skp.export_download', $export))->assertForbidden();
        $this->actingAs($this->pengamat)->post(route('supervisor.skp.generate'), ['user_id' => 'all', 'tahun' => 2026, 'periode' => 'T4'])->assertForbidden();
    }

    public function test_quarter_report_requires_acc(): void
    {
        $this->obs($this->pengamat, '08:00');

        $this->actingAs($this->pengamat)->get(route('supervisor.skp.pdf-direct', [
            'user_id' => $this->pengamat->id, 'tahun' => 2026, 'periode' => 'T4',
        ]))->assertSessionHasErrors('message');
    }

    public function test_zip_always_covers_every_approved_employee(): void
    {
        Queue::fake();
        $this->obs($this->pengamat, '08:00');
        $this->obs($this->pengamatLain, '07:30');
        $this->accT4($this->pengamat);
        $this->accT4($this->pengamatLain);
        RekapSkpTriwulan::create(['user_id' => $this->admin->id, 'tahun' => 2026, 'triwulan' => 'T4', 'status' => 'pending', 'total_pengamatan_valid' => 0]);

        $this->actingAs($this->admin)->post(route('supervisor.skp.zip'), ['tahun' => 2026, 'periode' => 'T4', 'user_id' => $this->pengamat->id])
            ->assertSessionHas('message', fn ($m) => str_contains($m, '2 pegawai'));

        $this->assertNull(SkpExport::first()->target_user_id);
        Queue::assertPushed(ExportSkpZip::class);
    }

    public function test_removed_outputs_are_gone(): void
    {
        $this->assertFalse(\Route::has('reports.monthly.index'));
        $this->assertFalse(\Route::has('reports.monthly.pdf'));
        $this->assertFalse(\Route::has('observations.export_csv'));
    }

    // ---- Input rules --------------------------------------------------------------

    public function test_only_observers_input_observations(): void
    {
        foreach ([$this->penyelia, $this->admin] as $u) {
            $this->actingAs($u)->get(route('observations.create'))->assertForbidden();
            $this->kirim($u, '08:00')->assertForbidden();
        }
        $this->kirim($this->pengamat, '08:00')->assertSessionHasNoErrors();
    }

    public function test_slot_can_be_filled_once_per_station_and_not_in_the_future(): void
    {
        $this->kirim($this->pengamat, '08:00')->assertSessionHasNoErrors();
        $this->kirim($this->pengamatLain, '08:00')->assertSessionHasErrors('schedule_id');
        $this->kirim($this->pengamat, '08:00', now('Asia/Jakarta')->addDay()->toDateString())->assertSessionHasErrors('tanggal');

        // Moving another observation onto a taken slot is refused as well
        $lain = $this->obs($this->pengamat, '07:30', '2026-10-09', [], 'pending');
        $this->actingAs($this->pengamat)->put(route('observations.update', $lain), [
            'schedule_id' => $this->slot['08:00']->id, 'tanggal' => '2026-10-09', 'status_pengamatan' => 'lengkap', 'values' => [],
        ])->assertSessionHasErrors('schedule_id');

        $this->assertSame(2, Observation::count());
    }

    public function test_create_form_knows_todays_filled_slots(): void
    {
        $this->obs($this->pengamatLain, '08:00', now('Asia/Jakarta')->toDateString(), [], 'pending');

        $this->actingAs($this->pengamat)->get(route('observations.create'))
            ->assertInertia(fn ($page) => $page
                ->where('hariIni', now('Asia/Jakarta')->toDateString())
                ->where('slotTerisi', [$this->slot['08:00']->id]));
    }

    // ---- Kelola Alat > Pilihan -----------------------------------------------------

    public function test_admin_manages_dropdown_choices(): void
    {
        $this->actingAs($this->admin)->post(route('admin.instruments.options.store'), ['parameter_kode' => 'keadaan_tanah', 'nilai' => 'Tergenang'])
            ->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post(route('admin.instruments.options.store'), ['parameter_kode' => 'keadaan_tanah', 'nilai' => 'Tergenang'])
            ->assertSessionHasErrors('nilai');
        $this->actingAs($this->admin)->post(route('admin.instruments.options.store'), ['parameter_kode' => 'suhu_bola_kering', 'nilai' => 'X'])
            ->assertSessionHasErrors('parameter_kode');

        $opsi = ParameterOption::where('parameter_kode', 'keadaan_tanah')->where('nilai', 'Tergenang')->firstOrFail();
        $this->actingAs($this->admin)->put(route('admin.instruments.options.update', $opsi), ['nilai' => 'Tergenang Air', 'urutan' => 5])
            ->assertSessionHasNoErrors();
        $this->assertSame('Tergenang Air', $opsi->fresh()->nilai);

        $this->actingAs($this->pengamat)->delete(route('admin.instruments.options.destroy', $opsi))->assertForbidden();
        $this->actingAs($this->admin)->delete(route('admin.instruments.options.destroy', $opsi))->assertSessionHasNoErrors();
        $this->assertNull($opsi->fresh());
    }

    // ---- Rain day and SKP content -------------------------------------------------

    public function test_rain_is_summed_from_the_configured_first_slot(): void
    {
        $o7 = $this->obs($this->pengamat, '07:00', '2026-10-09', ['curah_hujan_ombrometer' => '2.0']);
        $this->obs($this->pengamat, '08:00', '2026-10-09', ['curah_hujan_ombrometer' => '0.5']);
        $svc = app(ShiftReportImageService::class);

        $this->assertSame('2.5', $svc->dataShift($o7, 'pagi')['hujan']); // default: from 07.00

        Setting::set('hujan_slot_awal', 8);
        $this->assertSame('0.5', $svc->dataShift($o7, 'pagi')['hujan']);
    }

    public function test_skp_pdf_data_is_cover_plus_one_attachment_per_shift(): void
    {
        $o7 = $this->obs($this->pengamat, '07:00', '2026-10-09', ['jumlah_awan_okta' => '3']);
        $o7->update(['photo_ref' => 'foto_observasi/2026/10/09/x.webp', 'foto_path' => 'foto_observasi/2026/10/09/x.webp']);
        $this->obs($this->pengamat, '07:30', '2026-10-09', ['suhu_bola_kering' => '27.6', 'suhu_bola_basah' => '26.0']);
        $this->obs($this->pengamat, '08:00', '2026-12-31', ['jumlah_awan_okta' => '5']); // last day of T4
        $recap = $this->accT4($this->pengamat);

        $data = app(SkpPdfBuilder::class)->dataFor($recap);

        $this->assertSame('Triwulan IV (01 Oktober 2026 s/d 31 Desember 2026)', $data['periodeData']);
        $this->assertCount(3, $data['approvedObservations']);      // includes 31 December
        $this->assertCount(1, $data['lampiran']);                  // one sheet per shift with a photo
        $this->assertSame('pagi', $data['lampiran'][0]['shift']);
        $this->assertSame('07:00', $data['lampiran'][0]['jam']);
        $this->assertFileExists($data['lampiran'][0]['gambarShift']);
        $this->assertArrayNotHasKey('entri', $data);               // no long per-entry table any more
    }
}

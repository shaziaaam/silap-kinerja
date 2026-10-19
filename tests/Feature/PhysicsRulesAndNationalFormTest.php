<?php

namespace Tests\Feature;

use App\Models\InstrumentParameter;
use App\Models\Observation;
use App\Models\ObservationValue;
use App\Models\Schedule;
use App\Models\User;
use App\Services\ObservationRules;
use App\Services\ShiftReportImageService;
use Database\Seeders\InstrumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhysicsRulesAndNationalFormTest extends TestCase
{
    use RefreshDatabase;

    protected User $pengamat;
    /** @var array<string, Schedule> */
    protected array $slot = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(InstrumentSeeder::class);

        $this->pengamat = User::create([
            'nama' => 'Edy Susanto',
            'email' => 'edy@bmkg.go.id',
            'role' => 'pengamat',
            'nip' => '199001012015031001',
            'password' => bcrypt('password'),
            'must_change_password' => false,
        ]);

        foreach (['07:00' => 'JAM_PENUH', '07:30' => 'AGM1B', '08:00' => 'JAM_PENUH', '13:30' => 'AGM1B'] as $jam => $kelompok) {
            $this->slot[$jam] = Schedule::create([
                'jam_utc' => sprintf('%02d:%s:00', (int) substr($jam, 0, 2) - 7, substr($jam, 3, 2)),
                'jam_wib' => "$jam:00",
                'kelompok' => $kelompok,
                'shift' => 'pagi',
                'is_mandatory_photo' => $jam === '07:00',
            ]);
        }
    }

    protected function id(string $kode): int
    {
        return InstrumentParameter::where('kode', $kode)->value('id');
    }

    protected function manual(Observation $obs, string $kode): ?string
    {
        return $obs->getValue($kode)?->nilai_manual;
    }

    /** @param array<string, array{0: ?string, 1?: ?string}> $nilai */
    protected function kirim(string $jam, array $nilai)
    {
        $values = [];
        foreach ($nilai as $kode => $v) {
            $values[$this->id($kode)] = ['manual' => $v[0], 'aws' => $v[1] ?? null];
        }

        return $this->actingAs($this->pengamat)->post(route('observations.store'), [
            'schedule_id' => $this->slot[$jam]->id,
            'tanggal' => '2026-10-09',
            'status_pengamatan' => 'lengkap',
            'values' => $values,
            'foto' => $jam === '07:00' ? 'data:image/webp;base64,' . base64_encode('x') : null,
        ]);
    }

    /** Numbers from the BMKGSoft v2 FDIH screenshot (07.30 WS, 9/10/2026). */
    protected function dataLayarNasional(): array
    {
        return [
            'suhu_bola_kering' => ['27.6'], 'suhu_bola_basah' => ['26.0'], 'rh_sangkar' => [null, '88'],
            'counter_angin_sebelum' => ['9999'], 'kecepatan_angin_10m' => ['0'],
            'tinggi_air_sebelum' => ['15'], 'tinggi_air_dibaca' => ['31.5'], 'suhu_air_maks' => ['9999'],
            'suhu_air_min' => ['9999'], 'ch_diukur_openpan' => ['18'],
            'piche_sebelum' => ['24.2'], 'piche_sekarang' => ['31.5'],
            'assman_tbk_5cm' => ['26.8'], 'assman_tbb_5cm' => ['26.2'],
            'suhu_tanah_rumput_0cm' => ['28.8'], 'suhu_tanah_gundul_0cm' => ['28.0'],
            'keadaan_tanah' => ['Basah'], 'keadaan_hujan' => ['Ringan'],
            // Deliberately wrong client-side results: the server must recompute them.
            'selisih_tinggi_air' => ['99'], 'penguapan_openpan' => ['99'], 'penguapan_piche' => ['99'],
        ];
    }

    public function test_national_screenshot_numbers_pass_and_formulas_are_recomputed_server_side(): void
    {
        $this->kirim('07:30', $this->dataLayarNasional())->assertSessionHasNoErrors();

        $obs = Observation::firstOrFail();
        $this->assertSame('-16.5', $this->manual($obs, 'selisih_tinggi_air'));
        $this->assertSame('1.5', $this->manual($obs, 'penguapan_openpan'));
        $this->assertSame('7.3', $this->manual($obs, 'penguapan_piche'));
        // 9999 = not measured, stored as NULL (no row)
        $this->assertNull(ObservationValue::where('observation_id', $obs->id)->where('parameter_id', $this->id('suhu_air_maks'))->first());
    }

    public function test_wet_bulb_higher_than_dry_bulb_is_rejected(): void
    {
        $this->kirim('07:30', ['suhu_bola_kering' => ['25.0'], 'suhu_bola_basah' => ['26.0']])
            ->assertSessionHasErrors('values.suhu_bola_basah');

        $this->kirim('07:30', ['assman_tbk_50cm' => ['26.0'], 'assman_tbb_50cm' => ['26.4']])
            ->assertSessionHasErrors('values.assman_tbb_50cm');

        $this->assertSame(0, Observation::count());
    }

    public function test_out_of_range_values_are_rejected(): void
    {
        $this->kirim('08:00', [
            'arah_angin_derajat' => ['400'],
            'jumlah_awan_okta' => ['9'],
            'lama_penyinaran_jam' => ['1.4'],
            'curah_hujan_ombrometer' => ['-1'],
        ])->assertSessionHasErrors([
            'values.arah_angin_derajat.manual',
            'values.jumlah_awan_okta.manual',
            'values.lama_penyinaran_jam.manual',
            'values.curah_hujan_ombrometer.manual',
        ]);

        // AWS values have their own bounds (RH 0-100, direction 0-360)
        $this->kirim('08:00', ['arah_angin_derajat' => ['270', '361']])
            ->assertSessionHasErrors('values.arah_angin_derajat.aws');

        $this->kirim('08:00', ['jumlah_awan_okta' => ['4.5']])
            ->assertSessionHasErrors('values.jumlah_awan_okta.manual');

        $this->kirim('08:00', ['arah_angin_derajat' => ['360'], 'jumlah_awan_okta' => ['0']])
            ->assertSessionHasNoErrors();
    }

    public function test_cumulative_readings_cannot_go_below_previous_and_evaporation_cannot_be_negative(): void
    {
        $this->kirim('07:30', ['piche_sebelum' => ['30.0'], 'piche_sekarang' => ['28.0']])
            ->assertSessionHasErrors('values.piche_sekarang');

        $this->kirim('07:30', ['counter_angin_sebelum' => ['500'], 'counter_angin_dibaca' => ['480']])
            ->assertSessionHasErrors('values.counter_angin_dibaca');

        // Open pan level may rise (rain), but the resulting evaporation may not be negative
        $this->kirim('07:30', ['tinggi_air_sebelum' => ['10'], 'tinggi_air_dibaca' => ['30'], 'ch_diukur_openpan' => ['5']])
            ->assertSessionHasErrors('values.penguapan_openpan');

        $this->kirim('07:30', ['tinggi_air_sebelum' => ['15'], 'tinggi_air_dibaca' => ['31.5'], 'ch_diukur_openpan' => ['18']])
            ->assertSessionHasNoErrors();
    }

    public function test_previous_fields_are_prefilled_from_last_reading_of_their_source(): void
    {
        $this->kirim('07:30', ['counter_angin_dibaca' => ['1204'], 'tinggi_air_dibaca' => ['31.5'], 'piche_sekarang' => ['31.5']])
            ->assertSessionHasNoErrors();
        // A later hourly slot without these readings must not hide them
        $this->kirim('08:00', ['jumlah_awan_okta' => ['3']])->assertSessionHasNoErrors();

        $sebelum = app(ObservationRules::class)->nilaiSebelum();

        $this->assertSame('1204', $sebelum['counter_angin_sebelum']);
        $this->assertSame('31.5', $sebelum['tinggi_air_sebelum']);
        $this->assertSame('31.5', $sebelum['piche_sebelum']);
    }

    public function test_gunn_bellani_intensity_uses_calibration_coefficient(): void
    {
        $this->kirim('07:00', ['gunn_bellani_kemarin' => ['12.0'], 'gunn_bellani_skala' => ['14.5']])
            ->assertSessionHasNoErrors();

        // (14.5 - 12.0) x 20.8
        $this->assertSame('52.0', $this->manual(Observation::firstOrFail(), 'gunn_bellani_intensitas'));
    }

    public function test_slot_pdf_renders_in_national_form_layout(): void
    {
        $this->kirim('07:30', $this->dataLayarNasional())->assertSessionHasNoErrors();
        $obs = Observation::firstOrFail();

        $this->actingAs($this->pengamat)
            ->get(route('observations.pdf', $obs))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_shift_image_aggregates_the_whole_shift(): void
    {
        $this->kirim('07:00', [
            'jumlah_awan_okta' => ['3'], 'curah_hujan_ombrometer' => ['0'], 'lama_penyinaran_jam' => ['0.2'],
            'tekanan_udara_barograf' => ['1010.2'], 'suhu_udara_maks' => [null, '30.1'], 'suhu_udara_min' => [null, '24.9'],
        ])->assertSessionHasNoErrors();
        $this->kirim('07:30', ['suhu_bola_kering' => ['27.6'], 'suhu_bola_basah' => ['26.0'], 'rh_sangkar' => [null, '88']])->assertSessionHasNoErrors();
        $this->kirim('08:00', [
            'jumlah_awan_okta' => ['5'], 'curah_hujan_ombrometer' => ['0'], 'lama_penyinaran_jam' => ['0.8'],
            'arah_angin_derajat' => ['270'], 'kecepatan_angin_jam' => ['3.5'], 'suhu_udara_maks' => [null, '31.5'],
        ])->assertSessionHasNoErrors();
        $this->kirim('13:30', ['suhu_bola_kering' => ['31.4'], 'suhu_bola_basah' => ['26.1'], 'rh_sangkar' => [null, '65']])->assertSessionHasNoErrors();

        $obs07 = Observation::where('schedule_id', $this->slot['07:00']->id)->firstOrFail();
        $data = app(ShiftReportImageService::class)->dataShift($obs07, 'pagi');

        $this->assertSame('29.5', $data['suhu_rata']);      // (27.6 + 31.4) / 2
        $this->assertSame('31.5', $data['suhu_maks']);      // highest AWS TA_Max
        $this->assertSame('24.9', $data['suhu_min']);
        $this->assertSame('77', $data['kelembaban']);       // (88 + 65) / 2
        $this->assertSame('1010.2', $data['tekanan']);
        $this->assertSame('5', $data['awan']);              // latest hour
        $this->assertSame('0', $data['hujan']);
        $this->assertSame('1.0', $data['penyinaran']);      // 0.2 + 0.8
        $this->assertSame('7', $data['angin_knot']);        // 3.5 m/s
        $this->assertSame('Barat', $data['arah_angin']);
        $this->assertSame('Berawan', $data['keadaan_cuaca']);
    }

    public function test_weather_condition_follows_bmkg_rain_intensity_and_wmo_cloud_classes(): void
    {
        $svc = app(ShiftReportImageService::class);

        // Cloud amount, WMO classes FEW 1-2 / SCT 3-4 / BKN 5-7 / OVC 8
        $this->assertSame('Cerah', $svc->keadaanCuaca(0, null));
        $this->assertSame('Cerah', $svc->keadaanCuaca(2, 0));
        $this->assertSame('Cerah Berawan', $svc->keadaanCuaca(3, 0));
        $this->assertSame('Cerah Berawan', $svc->keadaanCuaca(4, 0));
        $this->assertSame('Berawan', $svc->keadaanCuaca(5, 0));
        $this->assertSame('Berawan', $svc->keadaanCuaca(7, 0));
        $this->assertSame('Berawan Tebal', $svc->keadaanCuaca(8, 0));

        // BMKG rain intensity (mm/jam): ringan 0,1-5,0; sedang 5,0-10,0; lebat 10,0-20; sangat lebat >20
        $this->assertSame('Berawan Tebal', $svc->keadaanCuaca(8, 0.05));
        $this->assertSame('Hujan Ringan', $svc->keadaanCuaca(8, 0.1));
        $this->assertSame('Hujan Ringan', $svc->keadaanCuaca(8, 5.0));
        $this->assertSame('Hujan Sedang', $svc->keadaanCuaca(8, 5.1));
        $this->assertSame('Hujan Sedang', $svc->keadaanCuaca(8, 10.0));
        $this->assertSame('Hujan Lebat', $svc->keadaanCuaca(8, 20.0));
        $this->assertSame('Hujan Sangat Lebat', $svc->keadaanCuaca(8, 20.1));
    }
}

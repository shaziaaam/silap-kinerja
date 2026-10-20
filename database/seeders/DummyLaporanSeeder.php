<?php

namespace Database\Seeders;

use App\Models\InstrumentParameter;
use App\Models\Observation;
use App\Models\ObservationValue;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\User;
use App\Services\ObservationRules;
use App\Services\PhotoStorage\PhotoStorageInterface;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * Data dummy untuk melihat hasil laporan (PDF per slot dan PDF triwulan SKP).
 * Tiap pengamat mendapat 4 observasi per triwulan: 2 pagi (07.00) dan 2 siang (17.00),
 * semuanya sudah di-ACC penyelia. Hanya untuk development, tidak dipanggil DatabaseSeeder.
 *
 *   php artisan db:seed --class=DummyLaporanSeeder   (aman diulang)
 */
class DummyLaporanSeeder extends Seeder
{
    public function run(): void
    {
        $tahun = (int) now('Asia/Jakarta')->format('Y');
        $penyelia = User::where('role', 'penyelia')->firstOrFail();
        $pengamat = User::where('role', 'pengamat')->orderBy('nip')->get();
        $slots = [
            'pagi' => Schedule::where('jam_wib', '07:00:00')->firstOrFail(),
            'siang' => Schedule::where('jam_wib', '17:00:00')->firstOrFail(),
        ];
        $params = InstrumentParameter::all();
        $rules = app(ObservationRules::class);
        $storage = app(PhotoStorageInterface::class);

        // Tiap tanggal hanya boleh diisi satu pengamat per slot, jadi tanggal digeser per pengamat.
        $bulanTriwulan = ['T1' => [2, 3], 'T2' => [5, 6], 'T3' => [8, 9], 'T4' => [10, 10]];

        foreach ($pengamat as $i => $user) {
            foreach ($bulanTriwulan as $triwulan => $bulan) {
                $tanggal = [
                    Carbon::create($tahun, $bulan[0], 2 + $i),
                    Carbon::create($tahun, $bulan[1], $bulan[0] === $bulan[1] ? 9 + $i : 2 + $i),
                ];

                foreach ($tanggal as $n => $tgl) {
                    foreach ($slots as $shift => $schedule) {
                        if (Observation::whereDate('tanggal', $tgl)->where('schedule_id', $schedule->id)->exists()) {
                            continue;
                        }

                        $jam = substr($schedule->jam_wib, 0, 5);
                        $values = $rules->hitungUlang($this->nilai($params, $jam, $i + $n), $params);
                        if ($rules->periksa($values, $params)) {
                            $this->command?->warn("Nilai dummy {$user->nip} {$tgl->toDateString()} {$jam} tidak lolos aturan fisika, dilewati.");
                            continue;
                        }

                        $ref = $storage->store(
                            $this->foto($user->nama, $tgl, $jam),
                            $tgl->format('Y/m/d') . '/dummy_' . $user->nip . '_' . str_replace(':', '', $jam) . '.webp'
                        )['ref'];

                        $obs = Observation::create([
                            'user_id' => $user->id,
                            'schedule_id' => $schedule->id,
                            'tanggal' => $tgl->toDateString(),
                            'status_pengamatan' => 'lengkap',
                            'shift' => $shift,
                            'foto_path' => $ref,
                            'photo_ref' => $ref,
                            'photo_slot' => $jam,
                            'foto_sumber' => 'kamera',
                            'status_approval' => 'approved',
                            'approved_by' => $penyelia->id,
                        ]);

                        foreach ($values as $paramId => $v) {
                            if (($v['manual'] ?? null) !== null || ($v['aws'] ?? null) !== null) {
                                ObservationValue::create([
                                    'observation_id' => $obs->id,
                                    'parameter_id' => $paramId,
                                    'nilai_manual' => $v['manual'] ?? null,
                                    'nilai_aws' => $v['aws'] ?? null,
                                ]);
                            }
                        }
                    }
                }

                RekapSkpTriwulan::updateOrCreate(
                    ['user_id' => $user->id, 'tahun' => $tahun, 'triwulan' => $triwulan],
                    [
                        'status' => 'approved',
                        'approved_by' => $penyelia->id,
                        'approved_at' => now(),
                        'catatan' => 'Disetujui Penyelia (data dummy)',
                        'total_pengamatan_valid' => Observation::where('user_id', $user->id)
                            ->where('status_approval', 'approved')
                            ->where('tanggal', '>=', Carbon::create($tahun, ($bulan[0] - 1) - (($bulan[0] - 1) % 3) + 1, 1)->toDateString())
                            ->where('tanggal', '<', Carbon::create($tahun, ($bulan[0] - 1) - (($bulan[0] - 1) % 3) + 1, 1)->addMonths(3)->toDateString())
                            ->count(),
                        'tanggal_generate' => now(),
                    ]
                );
            }
        }
    }

    /** Nilai wajar untuk field yang dibaca di slot ini (jam penuh, plus harian pada 07.00). */
    protected function nilai($params, string $jam, int $variasi): array
    {
        $kelompok = ['JAM_PENUH'];
        if ($jam === '07:00') {
            $kelompok[] = 'HARIAN_0700';
        }

        $pagi = $jam === '07:00';
        $v = $variasi % 4;
        $isi = [
            'jumlah_awan_okta' => 3 + $v,
            'jarak_pandang_km' => 8 + $v,
            'arah_angin_derajat' => 90 + $v * 45,
            'kecepatan_angin_jam' => 4 + $v,
            'curah_hujan_ombrometer' => $pagi ? 0 : [0, 1.5, 0, 4.2][$v],
            'lama_penyinaran_jam' => $pagi ? 0.2 : 0,
            'suhu_udara_maks' => $pagi ? 30.4 + $v / 2 : 32.8 + $v / 2,
            'suhu_udara_min' => $pagi ? 24.1 : 27.3,
            'tekanan_udara_barograf' => 1008 + $v,
            'suhu_udara_termograf' => 25.5 + $v / 2,
            'hellmann_pias' => 0,
            'gunn_bellani_kemarin' => 120,
            'gunn_bellani_skala' => 160 + $v * 5,
        ];

        $values = [];
        foreach ($params as $p) {
            if (!array_intersect($kelompok, (array) $p->jadwal_baca) || !array_key_exists($p->kode, $isi)) {
                continue;
            }
            $key = $p->sumber === 'aws' ? 'aws' : 'manual';
            $values[$p->id] = [$key => (string) $isi[$p->kode]];
        }

        return $values;
    }

    /** Foto dummy (gradasi langit + keterangan), disimpan sebagai WebP seperti foto asli. */
    protected function foto(string $nama, Carbon $tgl, string $jam): string
    {
        $img = imagecreatetruecolor(800, 600);
        for ($y = 0; $y < 600; $y++) {
            $t = $y / 600;
            imagefilledrectangle($img, 0, $y, 800, $y + 1, imagecolorallocate($img, (int) (110 + 100 * $t), (int) (170 + 50 * $t), (int) (230 - 40 * $t)));
        }
        imagefilledrectangle($img, 0, 440, 800, 600, imagecolorallocate($img, 70, 130, 70));
        $putih = imagecolorallocate($img, 255, 255, 255);
        imagestring($img, 5, 20, 20, 'FOTO DUMMY - ' . $nama, $putih);
        imagestring($img, 5, 20, 45, $tgl->format('d/m/Y') . ' ' . $jam . ' WIB', $putih);

        ob_start();
        imagewebp($img, null, 80);

        return ob_get_clean();
    }
}

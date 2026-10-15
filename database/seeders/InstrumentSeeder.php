<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Instrument;
use App\Models\InstrumentParameter;
use App\Models\ParameterOption;
use App\Models\Setting;

class InstrumentSeeder extends Seeder
{
    public function run(): void
    {
        Setting::set('jam_mulai', '7');
        Setting::set('jam_selesai', '22');

        // Seed parameter_options (dropdown form nasional)
        ParameterOption::updateOrCreate(
            ['parameter_kode' => 'keadaan_tanah', 'nilai' => 'Basah'],
            ['label' => 'Basah', 'urutan' => 1]
        );
        ParameterOption::updateOrCreate(
            ['parameter_kode' => 'keadaan_tanah', 'nilai' => 'Kering'],
            ['label' => 'Kering', 'urutan' => 2]
        );
        ParameterOption::updateOrCreate(
            ['parameter_kode' => 'keadaan_tanah', 'nilai' => 'Lembab'],
            ['label' => 'Lembab', 'urutan' => 3]
        );

        ParameterOption::updateOrCreate(
            ['parameter_kode' => 'keadaan_hujan', 'nilai' => 'Ringan'],
            ['label' => 'Ringan', 'urutan' => 1]
        );
        ParameterOption::updateOrCreate(
            ['parameter_kode' => 'keadaan_hujan', 'nilai' => 'Sedang'],
            ['label' => 'Sedang', 'urutan' => 2]
        );
        ParameterOption::updateOrCreate(
            ['parameter_kode' => 'keadaan_hujan', 'nilai' => 'Lebat'],
            ['label' => 'Lebat', 'urutan' => 3]
        );
        ParameterOption::updateOrCreate(
            ['parameter_kode' => 'keadaan_hujan', 'nilai' => 'Tidak Ada Hujan'],
            ['label' => 'Tidak Ada Hujan', 'urutan' => 4]
        );

        // -------------------------------------------------------------
        // KARTU 1-7: INSTRUMEN TAB FDIH (Jadwal AGM1B: 07.30, 13.30, 17.30)
        // -------------------------------------------------------------

        // 1. Psikrometer Sangkar 1,2 m (Kartu 1)
        $instSangkar = Instrument::updateOrCreate(
            ['nama' => 'Psikrometer Sangkar 1,2 m'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 1]
        );

        // 2. Angin (Kartu 2)
        $instAngin = Instrument::updateOrCreate(
            ['nama' => 'Anemometer & Wind Vane'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 2]
        );

        // 3. OP Penguapan (Kartu 3)
        $instOpenPan = Instrument::updateOrCreate(
            ['nama' => 'Open Pan Evaporimeter (OP Penguapan)'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 3]
        );

        // 4. Psikrometer Assman (Kartu 4)
        $instAssman = Instrument::updateOrCreate(
            ['nama' => 'Psikrometer Assman (Bertingkat)'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 4]
        );

        // 5. Piche Penguapan (Kartu 5)
        $instPiche = Instrument::updateOrCreate(
            ['nama' => 'Piche Evaporimeter'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 5]
        );

        // 6. Pengamatan Kualitatif (Kartu 6)
        $instKualitatif = Instrument::updateOrCreate(
            ['nama' => 'Pengamatan Kualitatif (Tanah & Hujan)'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 6]
        );

        // 7. Suhu Tanah (Kartu 7)
        $instTanah = Instrument::updateOrCreate(
            ['nama' => 'Termometer Tanah (Gundul & Berumput)'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 7]
        );

        // -------------------------------------------------------------
        // KARTU 8: ALAT DI LUAR TAB FDIH (JAM_PENUH & HARIAN_0700)
        // -------------------------------------------------------------
        $instLuar = Instrument::updateOrCreate(
            ['nama' => 'Pengamatan Luar FDIH & Harian'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 8]
        );

        $params = [
            // KARTU 1: Psikrometer Sangkar 1,2 m (Jadwal AGM1B)
            [
                'instrument_id' => $instSangkar->id,
                'kode' => 'suhu_bola_kering',
                'label' => 'TBK (Suhu Bola Kering)',
                'satuan' => '°C',
                'kartu' => 1,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => 'TA_meas',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 10,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instSangkar->id,
                'kode' => 'suhu_bola_basah',
                'label' => 'TBB (Suhu Bola Basah)',
                'satuan' => '°C',
                'kartu' => 1,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => null,
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 20,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instSangkar->id,
                'kode' => 'rh_sangkar',
                'label' => 'RH (Kelembapan Relatif Sangkar)',
                'satuan' => '%',
                'kartu' => 1,
                'sifat' => 'dihitung_nasional',
                'tipe_input' => 'number',
                'kode_aws' => 'RH_meas',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 30,
                'is_active' => true,
            ],

            // KARTU 2: Angin (Jadwal AGM1B)
            [
                'instrument_id' => $instAngin->id,
                'kode' => 'counter_angin_sebelum',
                'label' => 'Counter Sebelum (0,5 m)',
                'satuan' => 'km',
                'kartu' => 2,
                'sifat' => 'sebelum',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 40,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instAngin->id,
                'kode' => 'counter_angin_dibaca',
                'label' => 'Counter Dibaca (0,5 m)',
                'satuan' => 'km',
                'kartu' => 2,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 50,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instAngin->id,
                'kode' => 'counter_angin_rata',
                'label' => 'Counter Rata (0,5 m)',
                'satuan' => 'km/jam',
                'kartu' => 2,
                'sifat' => 'dihitung_nasional',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 60,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instAngin->id,
                'kode' => 'kecepatan_angin_10m',
                'label' => 'Kecepatan saat Pengamatan (10 m)',
                'satuan' => 'm/s (knot)',
                'kartu' => 2,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => 'WS_meas',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 70,
                'is_active' => true,
            ],

            // KARTU 3: OP Penguapan (Jadwal AGM1B)
            [
                'instrument_id' => $instOpenPan->id,
                'kode' => 'tinggi_air_sebelum',
                'label' => 'Tinggi Air Sebelum',
                'satuan' => 'mm',
                'kartu' => 3,
                'sifat' => 'sebelum',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 80,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instOpenPan->id,
                'kode' => 'tinggi_air_dibaca',
                'label' => 'Tinggi Air Dibaca',
                'satuan' => 'mm',
                'kartu' => 3,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 90,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instOpenPan->id,
                'kode' => 'selisih_tinggi_air',
                'label' => 'Selisih Tinggi Air (Sebelum - Dibaca)',
                'satuan' => 'mm',
                'kartu' => 3,
                'sifat' => 'dihitung_app',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 100,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instOpenPan->id,
                'kode' => 'suhu_air_maks',
                'label' => 'T Air Maks',
                'satuan' => '°C',
                'kartu' => 3,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 110,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instOpenPan->id,
                'kode' => 'suhu_air_min',
                'label' => 'T Air Min',
                'satuan' => '°C',
                'kartu' => 3,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 120,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instOpenPan->id,
                'kode' => 'suhu_air_rata',
                'label' => 'T Rata Air',
                'satuan' => '°C',
                'kartu' => 3,
                'sifat' => 'dihitung_nasional',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 130,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instOpenPan->id,
                'kode' => 'ch_diukur_openpan',
                'label' => 'CH Diukur (Penakar Hujan)',
                'satuan' => 'mm',
                'kartu' => 3,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 140,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instOpenPan->id,
                'kode' => 'penguapan_openpan',
                'label' => 'Penguapan Open Pan (Selisih + CH)',
                'satuan' => 'mm',
                'kartu' => 3,
                'sifat' => 'dihitung_app',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 150,
                'is_active' => true,
            ],

            // KARTU 4: Psikrometer Assman (Tinggi 5, 10, 20, 50, 100, 150, 200 cm)
            ...array_merge(...array_map(function ($h, $idx) use ($instAssman) {
                return [
                    [
                        'instrument_id' => $instAssman->id,
                        'kode' => "assman_tbk_{$h}cm",
                        'label' => "Assman {$h} cm - TBK",
                        'satuan' => '°C',
                        'kartu' => 4,
                        'sifat' => 'input',
                        'tipe_input' => 'number',
                        'jadwal_baca' => ['AGM1B'],
                        'urutan' => 160 + ($idx * 3),
                        'is_active' => true,
                    ],
                    [
                        'instrument_id' => $instAssman->id,
                        'kode' => "assman_tbb_{$h}cm",
                        'label' => "Assman {$h} cm - TBB",
                        'satuan' => '°C',
                        'kartu' => 4,
                        'sifat' => 'input',
                        'tipe_input' => 'number',
                        'jadwal_baca' => ['AGM1B'],
                        'urutan' => 161 + ($idx * 3),
                        'is_active' => true,
                    ],
                    [
                        'instrument_id' => $instAssman->id,
                        'kode' => "assman_rh_{$h}cm",
                        'label' => "Assman {$h} cm - RH",
                        'satuan' => '%',
                        'kartu' => 4,
                        'sifat' => 'dihitung_nasional',
                        'tipe_input' => 'number',
                        'jadwal_baca' => ['AGM1B'],
                        'urutan' => 162 + ($idx * 3),
                        'is_active' => true,
                    ],
                ];
            }, [5, 10, 20, 50, 100, 150, 200], array_keys([5, 10, 20, 50, 100, 150, 200]))),

            // KARTU 5: Piche Penguapan (Jadwal AGM1B)
            [
                'instrument_id' => $instPiche->id,
                'kode' => 'piche_sebelum',
                'label' => 'Pembacaan Piche Sebelum',
                'satuan' => 'cm³',
                'kartu' => 5,
                'sifat' => 'sebelum',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 200,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instPiche->id,
                'kode' => 'piche_sekarang',
                'label' => 'Pembacaan Piche Sekarang',
                'satuan' => 'cm³',
                'kartu' => 5,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 210,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instPiche->id,
                'kode' => 'penguapan_piche',
                'label' => 'Penguapan Piche (Sekarang - Sebelum)',
                'satuan' => 'cm³',
                'kartu' => 5,
                'sifat' => 'dihitung_app',
                'tipe_input' => 'number',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 220,
                'is_active' => true,
            ],

            // KARTU 6: Kualitatif (Jadwal AGM1B)
            [
                'instrument_id' => $instKualitatif->id,
                'kode' => 'keadaan_tanah',
                'label' => 'Keadaan Tanah',
                'satuan' => null,
                'kartu' => 6,
                'sifat' => 'input',
                'tipe_input' => 'select',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 230,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instKualitatif->id,
                'kode' => 'keadaan_hujan',
                'label' => 'Keadaan Hujan',
                'satuan' => null,
                'kartu' => 6,
                'sifat' => 'input',
                'tipe_input' => 'select',
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 240,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instKualitatif->id,
                'kode' => 'keterangan_agm1b',
                'label' => 'Keterangan AGM 1-B',
                'satuan' => null,
                'kartu' => 6,
                'sifat' => 'input',
                'tipe_input' => 'text',
                'opsional' => true,
                'jadwal_baca' => ['AGM1B'],
                'urutan' => 250,
                'is_active' => true,
            ],

            // KARTU 7: Suhu Tanah (0, 2, 5, 10, 20, 50, 100 cm)
            ...array_merge(...array_map(function ($d, $idx) use ($instTanah) {
                $is2cm = ($d === 2);
                return [
                    [
                        'instrument_id' => $instTanah->id,
                        'kode' => "suhu_tanah_rumput_{$d}cm",
                        'label' => "Suhu Tanah Berumput ({$d} cm)",
                        'satuan' => '°C',
                        'kartu' => 7,
                        'sifat' => 'input',
                        'tipe_input' => 'number',
                        'jadwal_baca' => ['AGM1B'],
                        'urutan' => 260 + ($idx * 2),
                        'is_active' => !$is2cm, // Baris 2 cm nonaktif (cetak 9999)
                    ],
                    [
                        'instrument_id' => $instTanah->id,
                        'kode' => "suhu_tanah_gundul_{$d}cm",
                        'label' => "Suhu Tanah Gundul ({$d} cm)",
                        'satuan' => '°C',
                        'kartu' => 7,
                        'sifat' => 'input',
                        'tipe_input' => 'number',
                        'jadwal_baca' => ['AGM1B'],
                        'urutan' => 261 + ($idx * 2),
                        'is_active' => !$is2cm, // Baris 2 cm nonaktif (cetak 9999)
                    ],
                ];
            }, [0, 2, 5, 10, 20, 50, 100], array_keys([0, 2, 5, 10, 20, 50, 100]))),

            // KARTU 8: Alat Luar Tab FDIH (JAM_PENUH & HARIAN_0700)
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'jumlah_awan_okta',
                'label' => 'Jumlah Awan (Okta)',
                'satuan' => 'okta (0-8)',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'integer',
                'batas_min' => 0,
                'batas_max' => 8,
                'jadwal_baca' => ['JAM_PENUH'],
                'urutan' => 300,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'jarak_pandang_km',
                'label' => 'Penglihatan Mendatar (Jarak Pandang)',
                'satuan' => 'km',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'jadwal_baca' => ['JAM_PENUH'],
                'urutan' => 310,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'arah_angin_derajat',
                'label' => 'Arah Angin',
                'satuan' => '°',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => 'WD_meas',
                'jadwal_baca' => ['JAM_PENUH'],
                'urutan' => 320,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'kecepatan_angin_jam',
                'label' => 'Kecepatan Angin (m/s & knot)',
                'satuan' => 'm/s',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => 'WS_meas',
                'jadwal_baca' => ['JAM_PENUH'],
                'urutan' => 330,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'curah_hujan_ombrometer',
                'label' => 'Curah Hujan (Ombrometer)',
                'satuan' => 'mm',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => 'rainHourly',
                'jadwal_baca' => ['JAM_PENUH'],
                'urutan' => 340,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'lama_penyinaran_jam',
                'label' => 'Campbell-Stokes (Lama Penyinaran)',
                'satuan' => 'jam (0,0 - 1,0)',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'batas_min' => 0,
                'batas_max' => 1,
                'jadwal_baca' => ['JAM_PENUH'],
                'urutan' => 350,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'gunn_bellani_skala',
                'label' => 'Gunn-Bellani (Pembacaan Skala Buret)',
                'satuan' => 'skala',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => 'SR_Max',
                'koefisien' => 20.8,
                'jadwal_baca' => ['HARIAN_0700'],
                'urutan' => 360,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'tekanan_udara_barograf',
                'label' => 'Microbarograf (Tekanan Udara Baca Pias)',
                'satuan' => 'mbar',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => 'PA_QFE',
                'jadwal_baca' => ['HARIAN_0700'],
                'urutan' => 370,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'suhu_udara_termograf',
                'label' => 'Termograf (Suhu Udara Baca Pias)',
                'satuan' => '°C',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => 'TA_meas',
                'jadwal_baca' => ['HARIAN_0700'],
                'urutan' => 380,
                'is_active' => true,
            ],
            [
                'instrument_id' => $instLuar->id,
                'kode' => 'hellmann_pias',
                'label' => 'Penakar Hujan Hellmann (Pias)',
                'satuan' => 'pias',
                'kartu' => 8,
                'sifat' => 'input',
                'tipe_input' => 'number',
                'kode_aws' => 'rainHourly',
                'jadwal_baca' => ['HARIAN_0700'],
                'urutan' => 390,
                'is_active' => false, // Nonaktif sesuai spesifikasi
            ],
        ];

        foreach ($params as $p) {
            InstrumentParameter::updateOrCreate(
                ['kode' => $p['kode']],
                $p
            );
        }
    }
}

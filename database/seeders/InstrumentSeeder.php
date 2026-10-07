<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Instrument;
use App\Models\InstrumentParameter;
use App\Models\Setting;

class InstrumentSeeder extends Seeder
{
    public function run(): void
    {
        Setting::set('jam_mulai', '7');
        Setting::set('jam_selesai', '22');
        Setting::set('hujan_slot_awal', '8');

        $tigaKali = [7, 13, 17];
        $harianJam = [7];
        $hanyaJam17 = [17];

        // 1. Pengamatan Visual & Angin Manual
        $visual = Instrument::updateOrCreate(
            ['nama' => 'Pengamatan Visual & Angin Manual'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 10]
        );

        // 2. Sangkar Meteorologi
        $sangkar = Instrument::updateOrCreate(
            ['nama' => 'Sangkar Meteorologi'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 20]
        );

        // 3. Penakar Hujan Ombrometer
        $ombrometer = Instrument::updateOrCreate(
            ['nama' => 'Penakar Hujan Ombrometer'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 30]
        );

        // 4. Open Pan & Gunn-Bellani
        $openpan = Instrument::updateOrCreate(
            ['nama' => 'Open Pan & Gunn-Bellani (Penguapan)'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 40]
        );

        // 5. Campbell-Stokes
        $campbell = Instrument::updateOrCreate(
            ['nama' => 'Campbell-Stokes (Penyinaran Matahari)'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 50]
        );

        // 6. Termometer Tanah
        $tanah = Instrument::updateOrCreate(
            ['nama' => 'Termometer Tanah (Gundul & Berumput)'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 60]
        );

        // 7. Pias Termograf & Microbarograf
        $pias = Instrument::updateOrCreate(
            ['nama' => 'Pias Termograf & Microbarograf'],
            ['kategori' => 'taman_alat', 'is_active' => true, 'urutan_form' => 70]
        );

        // 8. Sensor AWS & Monitor Display YOUNG
        $aws = Instrument::updateOrCreate(
            ['nama' => 'Sensor AWS & Monitor Display YOUNG'],
            ['kategori' => 'aws', 'is_active' => true, 'urutan_form' => 80]
        );

        $params = [
            // 1. Visual & Angin Manual
            ['instrument_id' => $visual->id, 'kode' => 'keadaan_cuaca', 'label' => 'Keadaan Cuaca', 'satuan' => null, 'tipe_input' => 'select', 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 1],
            ['instrument_id' => $visual->id, 'kode' => 'jumlah_awan_okta', 'label' => 'Jumlah Awan', 'satuan' => 'okta (0-8)', 'tipe_input' => 'integer', 'batas_min' => 0, 'batas_max' => 8, 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 2],
            ['instrument_id' => $visual->id, 'kode' => 'jenis_awan', 'label' => 'Jenis Awan', 'satuan' => null, 'tipe_input' => 'select', 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 3],
            ['instrument_id' => $visual->id, 'kode' => 'jarak_pandang_km', 'label' => 'Penglihatan Mendatar', 'satuan' => 'km', 'tipe_input' => 'number', 'batas_min' => 0, 'batas_max' => 50, 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 4],
            ['instrument_id' => $visual->id, 'kode' => 'fenomena_khusus', 'label' => 'Fenomena Khusus', 'satuan' => null, 'tipe_input' => 'multicheck', 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 5],
            ['instrument_id' => $visual->id, 'kode' => 'arah_angin_manual', 'label' => 'Arah Angin (Manual)', 'satuan' => '°', 'tipe_input' => 'number', 'batas_min' => 0, 'batas_max' => 360, 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 9],
            ['instrument_id' => $visual->id, 'kode' => 'kecepatan_angin_manual', 'label' => 'Kecepatan Angin (Manual)', 'satuan' => 'knot', 'tipe_input' => 'number', 'batas_min' => 0, 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 10],

            // 2. Sangkar Meteorologi
            ['instrument_id' => $sangkar->id, 'kode' => 'suhu_bola_kering', 'label' => 'Suhu Bola Kering', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'keduanya', 'jadwal_baca' => null, 'urutan' => 6],
            ['instrument_id' => $sangkar->id, 'kode' => 'suhu_bola_basah', 'label' => 'Suhu Bola Basah', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 7],
            ['instrument_id' => $sangkar->id, 'kode' => 'penguapan_piche', 'label' => 'Piche Evaporimeter', 'satuan' => 'mm', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 8],

            // 3. Ombrometer
            ['instrument_id' => $ombrometer->id, 'kode' => 'ombrometer_hujan_24jam', 'label' => 'Hujan 24 Jam Terakhir (Ombrometer)', 'satuan' => 'mm', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $harianJam, 'urutan' => 11],

            // 4. Open Pan & Gunn Bellani
            ['instrument_id' => $openpan->id, 'kode' => 'penguapan_open_pan', 'label' => 'Open Pan (Penguapan Panci)', 'satuan' => 'mm', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 12],
            ['instrument_id' => $openpan->id, 'kode' => 'gunn_bellani', 'label' => 'Gunn-Bellani (Bacaan Buret)', 'satuan' => 'ml', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $harianJam, 'urutan' => 13],

            // 5. Penyinaran Campbell Stokes
            ['instrument_id' => $campbell->id, 'kode' => 'lama_penyinaran_jam', 'label' => 'Campbell-Stokes (Lama Penyinaran)', 'satuan' => 'jam', 'tipe_input' => 'number', 'batas_min' => 0, 'batas_max' => 1, 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 14],

            // 6. Termometer Tanah
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_gundul_0cm', 'label' => 'Suhu Tanah Gundul (0 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 15],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_gundul_5cm', 'label' => 'Suhu Tanah Gundul (5 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 16],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_gundul_10cm', 'label' => 'Suhu Tanah Gundul (10 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 17],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_gundul_20cm', 'label' => 'Suhu Tanah Gundul (20 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 18],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_gundul_50cm', 'label' => 'Suhu Tanah Gundul (50 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $hanyaJam17, 'urutan' => 19],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_gundul_100cm', 'label' => 'Suhu Tanah Gundul (100 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $hanyaJam17, 'urutan' => 20],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_rumput_0cm', 'label' => 'Suhu Tanah Berumput (0 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 21],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_rumput_5cm', 'label' => 'Suhu Tanah Berumput (5 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 22],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_rumput_10cm', 'label' => 'Suhu Tanah Berumput (10 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 23],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_rumput_20cm', 'label' => 'Suhu Tanah Berumput (20 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $tigaKali, 'urutan' => 24],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_rumput_50cm', 'label' => 'Suhu Tanah Berumput (50 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $hanyaJam17, 'urutan' => 25],
            ['instrument_id' => $tanah->id, 'kode' => 'suhu_tanah_rumput_100cm', 'label' => 'Suhu Tanah Berumput (100 cm)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => $hanyaJam17, 'urutan' => 26],

            // 7. Pias
            ['instrument_id' => $pias->id, 'kode' => 'termograf_c', 'label' => 'Termograf', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 27],
            ['instrument_id' => $pias->id, 'kode' => 'microbarograf_hpa', 'label' => 'Microbarograf', 'satuan' => 'hPa', 'tipe_input' => 'number', 'sumber' => 'manual', 'jadwal_baca' => null, 'urutan' => 28],

            // 8. AWS & Display YOUNG
            ['instrument_id' => $aws->id, 'kode' => 'suhu_udara_aws', 'label' => 'Suhu Udara (AWS)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 29],
            ['instrument_id' => $aws->id, 'kode' => 'suhu_maksimum', 'label' => 'Suhu Maksimum (TA_Max)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 30],
            ['instrument_id' => $aws->id, 'kode' => 'suhu_minimum', 'label' => 'Suhu Minimum (TA_Min)', 'satuan' => '°C', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 31],
            ['instrument_id' => $aws->id, 'kode' => 'kelembapan_udara', 'label' => 'Kelembapan Udara (RH_meas)', 'satuan' => '%', 'tipe_input' => 'number', 'batas_min' => 0, 'batas_max' => 100, 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 32],
            ['instrument_id' => $aws->id, 'kode' => 'curah_hujan_jam', 'label' => 'Curah hujan 1 jam terakhir', 'satuan' => 'mm', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 33],
            ['instrument_id' => $aws->id, 'kode' => 'radiasi_matahari_max', 'label' => 'Radiasi Matahari Maks (SR_Max)', 'satuan' => 'W/m²', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 34],
            ['instrument_id' => $aws->id, 'kode' => 'kecepatan_angin_sesaat', 'label' => 'Kecepatan Angin Sesaat (WS-INS)', 'satuan' => 'knot', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 35],
            ['instrument_id' => $aws->id, 'kode' => 'kecepatan_angin_rata', 'label' => 'Kecepatan Angin Rata-rata (WS-AVG)', 'satuan' => 'knot', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 36],
            ['instrument_id' => $aws->id, 'kode' => 'kecepatan_angin_max', 'label' => 'Kecepatan Angin Maksimum (WS-MAX)', 'satuan' => 'knot', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 37],
            ['instrument_id' => $aws->id, 'kode' => 'kecepatan_angin_ms', 'label' => 'Kecepatan Angin AWS (WS_meas)', 'satuan' => 'm/s', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 38],
            ['instrument_id' => $aws->id, 'kode' => 'arah_angin_sesaat', 'label' => 'Arah Angin Sesaat (WD-INS)', 'satuan' => '°', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 39],
            ['instrument_id' => $aws->id, 'kode' => 'arah_angin_rata', 'label' => 'Arah Angin Rata-rata (WD-AVG)', 'satuan' => '°', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 40],
            ['instrument_id' => $aws->id, 'kode' => 'arah_angin_sdv', 'label' => 'Deviasi Standar Arah Angin (WD-SDV)', 'satuan' => '°', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 41],
            ['instrument_id' => $aws->id, 'kode' => 'tekanan_qfe', 'label' => 'Tekanan Udara QFE', 'satuan' => 'mbar', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 42],
            ['instrument_id' => $aws->id, 'kode' => 'tekanan_qff', 'label' => 'Tekanan Udara QFF', 'satuan' => 'mbar', 'tipe_input' => 'number', 'sumber' => 'aws', 'jadwal_baca' => null, 'urutan' => 43],
        ];

        foreach ($params as $p) {
            InstrumentParameter::updateOrCreate(
                ['kode' => $p['kode']],
                array_merge($p, [
                    'satuan' => $p['satuan'] ?? null,
                    'batas_min' => $p['batas_min'] ?? null,
                    'batas_max' => $p['batas_max'] ?? null,
                ])
            );
        }
    }
}

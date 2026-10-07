<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PhenologyPlant;
use App\Models\PhenologyPhase;

class PhenologySeeder extends Seeder
{
    public function run(): void
    {
        // Master Tanaman
        $plants = [
            'Jambu Biji',
            'Jambu Air',
            'Kelengkeng',
            'Mangga',
        ];

        foreach ($plants as $p) {
            PhenologyPlant::updateOrCreate(['nama' => $p], ['is_active' => true]);
        }

        // Master Fase (Lampiran VIII, Golongan B dan C)
        $phases = [
            ['kode' => 'perontokan_daun', 'nama' => 'Perontokan Daun (bila ada)', 'urutan' => 10],
            ['kode' => 'pertumbuhan_daun_baru', 'nama' => 'Pertumbuhan Daun Baru', 'urutan' => 20],
            ['kode' => 'pembentukan_kuncup_bunga', 'nama' => 'Pembentukan Kuncup Bunga', 'urutan' => 30],
            ['kode' => 'pembungaan', 'nama' => 'Pembungaan', 'urutan' => 40],
            ['kode' => 'pembentukan_buah_muda', 'nama' => 'Pembentukan Buah Muda', 'urutan' => 50],
            ['kode' => 'pemasakan_dan_panen', 'nama' => 'Pemasakan dan Panen', 'urutan' => 60],
        ];

        foreach ($phases as $ph) {
            PhenologyPhase::updateOrCreate(
                ['kode' => $ph['kode']],
                ['nama' => $ph['nama'], 'urutan' => $ph['urutan'], 'is_active' => true]
            );
        }
    }
}

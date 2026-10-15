<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Jam Operasional & Shift Pengamatan
    |--------------------------------------------------------------------------
    | Stasiun Klimatologi Jawa Tengah beroperasi setiap hari (Senin-Minggu)
    | mulai pukul 07.00 sampai 22.00 WIB.
    */
    'jam_mulai' => 7,
    'jam_selesai' => 22,

    'shifts' => [
        'pagi' => [
            'label' => 'Shift Pagi',
            'jam_mulai' => '07:00',
            'jam_selesai' => '15:00',
            'foto_slot' => '07:00',
        ],
        'siang' => [
            'label' => 'Shift Siang',
            'jam_mulai' => '15:00',
            'jam_selesai' => '22:00',
            'foto_slot' => '17:00',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Slot Foto Bukti Wajib
    |--------------------------------------------------------------------------
    | Foto HANYA 2 kali sehari: slot 07.00 WIB dan 17.00 WIB.
    | Jam/slot lain TIDAK ADA field foto bukti pengamatan.
    */
    'foto_slots' => ['07:00', '17:00'],
    'foto_slots_full' => ['07:00:00', '17:00:00'],

    /*
    |--------------------------------------------------------------------------
    | Kelompok Jadwal Baca Parameter
    |--------------------------------------------------------------------------
    | - AGM1B: 07.30, 13.30, 17.30 (Kartu 1-7 Tab FDIH BMKGSoft)
    | - JAM_PENUH: tiap jam 07.00 - 22.00 (16 slot)
    | - HARIAN_0700: hanya slot 07.00 WIB
    */
    'kelompok_jadwal' => [
        'AGM1B' => ['07:30', '13:30', '17:30'],
        'JAM_PENUH' => [
            '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
            '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
            '19:00', '20:00', '21:00', '22:00',
        ],
        'HARIAN_0700' => ['07:00'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Koefisien Kalibrasi Alat
    |--------------------------------------------------------------------------
    */
    'gunn_bellani_koefisien_default' => 20.8, // kal/cm2 sesuai peraturan BMKG

    /*
    |--------------------------------------------------------------------------
    | Storage Foto Bukti (PhotoStorage)
    |--------------------------------------------------------------------------
    | local = disk lokal (default development)
    | drive = Google Workspace Shared Drive via Service Account
    */
    'photo_disk' => env('PHOTO_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Watermark Statis
    |--------------------------------------------------------------------------
    */
    'lokasi_statis' => 'Taman Alat, Stasiun Klimatologi Jawa Tengah',
    'stasiun_id' => '96835',
];

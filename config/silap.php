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
    | Aturan Fisika Pengamatan
    |--------------------------------------------------------------------------
    | Dipakai bersama oleh backend (App\Services\ObservationRules) dan form
    | input (dikirim sebagai props), supaya pesan dan aturannya selalu sama.
    | Batas nilai manual per parameter ada di kolom batas_min/batas_max
    | (bisa diubah di Kelola Alat); batas nilai AWS ada di 'batas_aws'.
    */
    'aturan_fisika' => [
        // [kode_bawah, kode_atas, pesan]: nilai kode_bawah tidak boleh > kode_atas
        'tidak_lebih_dari' => array_merge(
            [
                ['suhu_bola_basah', 'suhu_bola_kering', 'Suhu bola basah (TBB) tidak boleh lebih tinggi dari suhu bola kering (TBK) pada psikrometer sangkar.'],
            ],
            array_map(fn ($h) => [
                "assman_tbb_{$h}cm", "assman_tbk_{$h}cm",
                "Suhu bola basah (TBB) Assman {$h} cm tidak boleh lebih tinggi dari suhu bola kering (TBK) {$h} cm.",
            ], [5, 10, 20, 50, 100, 150, 200]),
            [
                ['suhu_air_min', 'suhu_air_maks', 'T Air Min tidak boleh lebih tinggi dari T Air Maks.'],
                ['suhu_udara_min', 'suhu_udara_maks', 'Suhu udara minimum AWS (TA_Min) tidak boleh lebih tinggi dari suhu maksimum AWS (TA_Max).'],
            ]
        ),

        // Field "Sebelum" => field bacaan yang menjadi sumbernya. Field "Sebelum" diisi
        // dari bacaan terakhir sumbernya, dan bacaan sekarang tidak boleh lebih kecil
        // darinya (counter, buret, dan tabung Piche hanya bertambah sampai direset).
        'sebelum' => [
            'counter_angin_sebelum' => 'counter_angin_dibaca',
            'tinggi_air_sebelum' => 'tinggi_air_dibaca',
            'piche_sebelum' => 'piche_sekarang',
            'gunn_bellani_kemarin' => 'gunn_bellani_skala',
        ],
        // Sumber yang memang boleh lebih kecil dari "Sebelum" (tinggi air open pan
        // naik-turun karena hujan dan penguapan).
        'sebelum_boleh_turun' => ['tinggi_air_dibaca'],

        // Hasil hitung yang secara fisika tidak mungkin negatif
        'tidak_negatif' => [
            'penguapan_openpan' => 'Penguapan open pan tidak mungkin negatif. Periksa Tinggi Air Dibaca dan CH Diukur.',
        ],
    ],

    // Batas wajar nilai yang dibaca dari monitor AWS (CR1000X), per kolom AWS
    'batas_aws' => [
        'TA_meas' => [0, 50],
        'TA_Min' => [0, 50],
        'TA_Max' => [0, 50],
        'RH_meas' => [0, 100],
        'WS_meas' => [0, 75],
        'WD_meas' => [0, 360],
        'PA_QFE' => [900, 1100],
        'PA_QFF' => [900, 1100],
        'rainHourly' => [0, 300],
        'RainDaily' => [0, 1000],
        'SR_Max' => [0, 1500],
    ],

    // Keadaan cuaca di gambar laporan shift diturunkan dari jumlah awan (okta)
    // dan curah hujan jam terakhir, memakai istilah prakiraan BMKG.
    'keadaan_cuaca' => [
        // [okta_maks, label]: label pertama yang okta_maks-nya >= okta terpakai.
        // BMKG tidak menerbitkan ambang okta untuk istilah ini; dipakai kelas jumlah
        // awan WMO (WMO-No. 49 Vol. II, Code Table D-8): FEW 1-2, SCT 3-4, BKN 5-7, OVC 8.
        'awan' => [[2, 'Cerah'], [4, 'Cerah Berawan'], [7, 'Berawan'], [8, 'Berawan Tebal']],
        // Kriteria intensitas hujan BMKG: ringan 0,1-5,0; sedang 5,0-10,0;
        // lebat 10,0-20; sangat lebat >20 mm/jam. Nilai batas masuk kelas yang
        // lebih rendah (tabel BMKG di kajian STMKG: sedang 5,1-10,0).
        'hujan_min' => 0.1, // di bawah ini dianggap tidak hujan
        // [mm_per_jam_maks, label]: label pertama yang batas atasnya >= hujan; null = tanpa batas
        'hujan' => [[5.0, 'Hujan Ringan'], [10.0, 'Hujan Sedang'], [20.0, 'Hujan Lebat'], [null, 'Hujan Sangat Lebat']],
    ],

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

    /*
    |--------------------------------------------------------------------------
    | Lebar Maksimum Foto di PDF
    |--------------------------------------------------------------------------
    | Arsip di Drive tetap resolusi penuh (2560px). Salinan JPEG untuk DomPDF
    | diperkecil ke angka ini karena kotak foto di A4 tidak memerlukan lebih;
    | menaikkannya membengkakkan ukuran berkas, waktu render, dan memori.
    */
    'pdf_foto_lebar_maks' => (int) env('PDF_FOTO_LEBAR_MAKS', 1600),

    /*
    |--------------------------------------------------------------------------
    | Gambar Laporan Kondisi Cuaca per Shift (GD + FreeType)
    |--------------------------------------------------------------------------
    | Template kosong desain B (4488 x 5610 px) diisi di koordinat tetap.
    | Semua angka diukur dari contoh terisi di resources/templates/laporan-shift/contoh/
    | (contoh_pagi.png adalah acuan). Koordinat dalam piksel template; "baseline"
    | adalah garis dasar teks, "pusat_x" titik tengah horizontal kelompok teks.
    | Ukuran font adalah ukuran GD (imagettftext), sudah dikalibrasi ke contoh.
    */
    'laporan_shift' => [
        // Relatif terhadap resources/
        'template' => [
            'pagi' => 'templates/laporan-shift/template_pagi.png',
            'siang' => 'templates/laporan-shift/template_siang.png',
        ],

        'warna' => [
            'nilai' => '#323A4A',  // angka, nama observer, tanggal
            'label' => '#9296A0',  // label, satuan, titik pemisah
            'aksen' => [
                'pagi' => '#547EBA',  // jam di header shift pagi
                'siang' => '#D87606', // jam di header shift siang
            ],
        ],

        // Header: "Senin, 05 Oktober 2026  ·  07.00 WIB"
        'header' => [
            'pusat_x' => 2244,
            'baseline' => 1219,
            'ukuran_tanggal' => 76.7, // SemiBold
            'ukuran_jam' => 76.4,     // Medium, warna aksen
            'jeda' => 87,             // jarak tinta tanggal -> titik -> jam
            'titik_radius' => 6,
            'titik_y' => 1183,
        ],

        // "Observer  Nama" dicetak ulang berdua agar tetap di tengah
        'observer' => [
            'pusat_x' => 2244,
            'baseline' => 1455,
            'hapus_label' => [1610, 1385, 1972, 1470], // label "Observer" bawaan template
            'ukuran_label' => 56.2, // Regular
            'ukuran_nama' => 63.1,  // SemiBold
            'jeda' => 71,
        ],

        // Kartu angka: nilai (SemiBold) + satuan (Regular), dicetak di tengah kartu.
        // Satuan bawaan template dihapus lalu dicetak ulang mengikuti lebar angka.
        // "data" dihitung dari semua observasi dalam shift (ShiftReportImageService::dataShift):
        //   suhu_rata  rata-rata TBK sangkar; suhu_maks/min dari AWS TA_Max/TA_Min
        //   (cadangan: TBK tertinggi/terendah); kelembaban rata-rata RH AWS; tekanan
        //   microbarograf hari itu; penguapan open pan terakhir; awan dan angin jam
        //   terakhir; hujan dan penyinaran dijumlah selama shift.
        'kartu' => [
            'ukuran_nilai' => 118.8,
            'ukuran_satuan' => 55.8,
            'jeda_satuan' => 50,
            'lebar_hapus' => 560, // setengah lebar area yang dibersihkan, dari pusat_x
            'hapus_atas' => 150,  // dari baseline ke atas
            'hapus_bawah' => 30,  // dari baseline ke bawah (ekor huruf "j")
            'isian' => [
                ['data' => 'suhu_rata',  'satuan' => '°C',    'pusat_x' => 872,  'baseline' => 2273],
                ['data' => 'suhu_maks',  'satuan' => '°C',    'pusat_x' => 2245, 'baseline' => 2273],
                ['data' => 'suhu_min',   'satuan' => '°C',    'pusat_x' => 3618, 'baseline' => 2273],
                ['data' => 'kelembaban', 'satuan' => '%',     'pusat_x' => 872,  'baseline' => 3146],
                ['data' => 'tekanan',    'satuan' => 'mb',    'pusat_x' => 2245, 'baseline' => 3146],
                ['data' => 'penguapan',  'satuan' => 'mm',    'pusat_x' => 3620, 'baseline' => 3146],
                ['data' => 'awan',       'satuan' => 'oktas', 'pusat_x' => 872,  'baseline' => 4020],
                ['data' => 'hujan',      'satuan' => 'mm',    'pusat_x' => 2245, 'baseline' => 4020],
                ['data' => 'penyinaran', 'satuan' => 'jam',   'pusat_x' => 3617, 'baseline' => 4020],
                ['data' => 'angin_knot', 'satuan' => 'knots', 'pusat_x' => 871,  'baseline' => 4894],
            ],
        ],

        // Label kartu angin diganti "Angin dari <arah>"
        'angin_label' => [
            'pusat_x' => 871,
            'baseline' => 5021,
            'ukuran' => 51.0, // Regular
            'hapus' => [560, 4960, 1180, 5050], // label "Arah & Kec. Angin" bawaan template
        ],

        // Ikon kartu "Keadaan Cuaca" mengikuti keadaannya. Ikon diambil dari kartu lain
        // di template yang sama (gaya identik), lalu disalin ke lingkaran kartu cuaca.
        'ikon_cuaca' => [
            'tujuan' => [2931, 4545],  // pusat lingkaran ikon kartu Keadaan Cuaca
            'setengah_sisi' => 160,    // lingkaran berdiameter ~303 px
            'sumber' => [
                'matahari' => [3617, 3671], // kartu Penyinaran
                'awan' => [871, 3671],      // kartu Perawanan
                'hujan' => [2244, 3671],    // kartu Curah Hujan
            ],
            // Keadaan => ikon; null = ikon bawaan template (matahari + awan).
            // Label berawalan "Hujan" memakai ikon 'hujan'.
            'peta' => [
                'Cerah' => 'matahari',
                'Cerah Berawan' => null,
                'Berawan' => 'awan',
                'Berawan Tebal' => 'awan_gelap', // ikon awan dengan warna awan digelapkan
            ],
            'faktor_gelap' => 0.72,
        ],

        // Kartu lebar "Keadaan Cuaca"
        'cuaca' => [
            'pusat_x' => 2930,
            'baseline' => 4895,
            'ukuran' => 129.0, // SemiBold
            'lebar_hapus' => 860,
            'hapus_atas' => 150,
            'hapus_bawah' => 40,
        ],

        // "ID Dokumen  LKC-20261005-P" dicetak ulang berdua agar tetap di tengah
        'dokumen' => [
            'pusat_x' => 2245,
            'baseline' => 5263,
            'hapus_label' => [1712, 5200, 2137, 5275],
            'ukuran_label' => 51.0, // Regular
            'ukuran_nilai' => 53.5, // Medium
            'jeda' => 59,
        ],

        // Nilai setelah label "Waktu input" dan "Laporan dibuat" (label tetap dari template)
        'waktu' => [
            'input_x' => 1228,
            'dibuat_x' => 2879,
            'baseline' => 5433,
            'ukuran' => 53.4, // Medium
        ],
    ],

    'stasiun_id' => '96835',

    /*
    |--------------------------------------------------------------------------
    | Geotag Foto Bukti
    |--------------------------------------------------------------------------
    | Panel geotag dibakar ke foto saat capture: peta, koordinat, dan waktu.
    | OSM mengirim header CORS sehingga tile-nya boleh digambar ke canvas.
    | Matikan lewat GEOTAG_PETA=false bila jaringan lapangan tidak memadai;
    | panel teks tetap tampil tanpa peta.
    */
    'geotag' => [
        'peta_aktif' => env('GEOTAG_PETA', true),
        'tile_url' => env('GEOTAG_TILE_URL', 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
        'zoom' => (int) env('GEOTAG_ZOOM', 16),
        'atribusi' => '© OpenStreetMap',
        // Alamat dari koordinat (reverse geocoding OpenStreetMap Nominatim), seperti kamera
        // geotag umumnya. Koordinat dikirim dari browser ke layanan ini; matikan dengan
        // GEOTAG_ALAMAT=false atau arahkan ke server Nominatim sendiri.
        'alamat_aktif' => env('GEOTAG_ALAMAT', true),
        'alamat_url' => env('GEOTAG_ALAMAT_URL', 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=id&lat={lat}&lon={lng}'),
    ],
];

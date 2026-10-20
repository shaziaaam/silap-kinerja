# SILAP-Kinerja — Requirement & Keputusan Desain (Final)

> Dokumen ini menggabungkan SRS resmi dari mentor dengan seluruh hasil diskusi dan konfirmasi lanjutan. Kalau ada bagian yang bertentangan dengan SRS resmi, dokumen **ini yang berlaku**, karena mencerminkan keputusan terakhir yang sudah dikonsultasikan ke mentor.
>
> Acuan tertinggi adalah catatan revisi 9 Oktober 2026 (`revisi-silap-kinerja.md`, lihat `AGENTS.md`). Bila dokumen ini bertentangan dengan catatan revisi, catatan revisi yang berlaku.

## 1. Ringkasan Proyek

- **Nama:** SILAP-Kinerja (Sistem Integrasi Laporan Pengamatan dan Bukti Dukung SKP)
- **Konteks:** proyek magang di Stasiun Klimatologi Jawa Tengah, bagian pengamatan dan pelaporan.
- **Tujuan:** mengganti web lama (yang cuma berisi dropdown jenis laporan, dropdown observer, dan upload CSV) dengan sistem yang mencatat observasi cuaca per parameter, memvalidasinya, dan otomatis menghasilkan lampiran bukti dukung SKP triwulanan.

## 2. Aktor & Peran

| Aktor | Jumlah | Hak akses utama |
|---|---|---|
| **Pengamat** | 7 orang | Login, input observasi per parameter, ambil foto wajib pada slot 07.00 dan 17.00 WIB, unduh PDF per slot dan PDF triwulan miliknya sendiri, lihat riwayat pribadi |
| **Penyelia** | 1 orang (Richardus Teguh Prayitno) — verifikator tunggal, tidak ada approver cadangan | Lihat antrean validasi, kembalikan observasi dengan catatan revisi, ACC per pegawai per triwulan, generate & unduh rekap SKP |
| **Admin** | sistem/mentor | Kelola Pengguna dan Kelola Alat (grup menu Pengaturan), reset password, **satu-satunya yang boleh membuka kunci triwulan** yang sudah di-ACC (alasan wajib, tercatat) |

Hak akses di atas ditegakkan di server lewat middleware `role` (`app/Http/Middleware/EnsureRole.php`), bukan hanya dengan menyembunyikan menu.

Nama pengamat (Achmad Sulistyo E.P, Edy Susanto, Eko Taufiq Suharmanto, Joko Cahyono, Muryanti, Nursamsiah, S.Si., M.Si., Shandy Al Mughozali) diambil dari situs resmi BMKG Stasiun Klimatologi Semarang. NIP tidak tersedia di sana — diisi data dummy sementara sampai data asli didapat dari bagian administrasi.

## 3. Stack & Infrastruktur

- **Backend:** Laravel (database, autentikasi, generate PDF)
- **Frontend:** Inertia.js + React (dipilih karena sudah terbiasa pakai React; alternatif Vue tidak dipakai)
- **Database:** MySQL 8 di produksi, SQLite untuk development dan tes — bukan Google Spreadsheet seperti rencana awal AppSheet
- **Generate PDF:** DomPDF (`barryvdh/laravel-dompdf`) dari Blade view di `resources/views/pdf/`; foto WebP dikonversi ke JPEG saat render
- **Gambar laporan per shift:** template PNG desain B diisi dengan GD (FreeType) dan font Poppins, tanpa Chromium
- **Queue:** driver `database` (tanpa Redis), dijalankan supervisor/systemd; cron `php artisan schedule:run` tiap menit
- **Hosting:** server internal BMKG Jateng (stasiun punya divisi IT sendiri untuk maintain aplikasi setelah magang selesai — ini sudah didiskusikan dan jadi alasan resmi pindah dari rencana low-code AppSheet ke full-code)
- **Masa uji coba:** pakai ngrok untuk expose server lokal sementara — sudah diizinkan mentor

## 4. Skema Autentikasi

- Login pakai **NIP atau email + password** dalam satu kolom isian. Bukan SSO. Percobaan login dibatasi (5 kali per menit).
- Fitur registrasi publik **dimatikan**.
- Akun pegawai (pengamat, penyelia, admin) dibuat lewat seeder database atau menu Kelola Pengguna oleh admin.
- Password default (mis. `BmkgJateng2026!`), dengan flag `must_change_password = true` yang memaksa ganti password saat login pertama kali.

## 5. Arsitektur Data

Entitas utama (diagram lama di `docs/diagram/erd.png` sudah tidak memuat tabel parameter):

- **users** — id, nama, nip, email, role (pengamat/penyelia/admin), password, must_change_password
- **schedules** — id, jam_utc, jam_wib, kelompok (`JAM_PENUH`/`AGM1B`), shift (pagi/siang), is_mandatory_photo. 19 slot per hari, 7 hari seminggu
- **instruments** dan **instrument_parameters** — master alat dan parameter yang dikelola lewat Kelola Alat: kode, label, satuan, kartu (1–8), urutan, tipe_input, sifat (input / sebelum / dihitung_app / dihitung_nasional), sumber (manual / aws / keduanya), jadwal_baca, batas_min/batas_max, kode_aws, koefisien, aktif. Daftar lengkap di `parameter-pengamatan.md`
- **parameter_options** — isi dropdown Keadaan Tanah dan Keadaan Hujan
- **observations** — id, user_id, schedule_id, tanggal, shift, status_pengamatan, alasan_batal, foto (photo_ref, photo_slot, foto_sumber, foto_gdrive_id), status_approval (pending/revision/approved), catatan_supervisor, approved_by
- **observation_values** — satu baris per parameter per observasi: nilai_manual dan nilai_aws (9999 disimpan NULL)
- **rekap_skp_triwulan** — user_id, tahun, triwulan, status, approved_by, approved_at, catatan, total_pengamatan_valid, serta jejak buka kunci (dibuka_oleh, dibuka_at, alasan_buka)
- **skp_exports**, **jobs**, **failed_jobs** — antrean ekspor ZIP SKP dan upload foto

Catatan: tabel `aws_data` terpisah yang ada di SRS resmi **tidak dibuat** — lihat bagian 10.

## 6. Aturan Bisnis & Keputusan Final (9 Oktober 2026)

- **Foto Kegiatan:** Wajib hanya pada 2 slot per hari: **07.00 WIB** (shift pagi) dan **17.00 WIB** (shift siang). Slot jam lain tanpa field foto. Aturan lama jam sinoptik UTC 00/03/06/09/12/15 dibatalkan.
- **Persetujuan (Approval):** Penyelia meng-ACC **hanya per triwulan** per pegawai. Aksi per entri observasi hanya untuk mengembalikan dengan catatan revisi (tidak ada ACC per entri). ACC triwulan diblokir jika pegawai masih memiliki observasi berstatus revisi (`revision`). Setelah ACC, data terkunci untuk semua peran; hanya admin yang dapat membuka kunci satu triwulan (dengan alasan tercatat), lalu penyelia meng-ACC ulang.
- **Validasi Fisika:** dicek di form dan di server (`App\Services\ObservationRules`, aturan di `config/silap.php` bagian `aturan_fisika`):
  - Suhu bola basah ≤ suhu bola kering (sangkar dan tiap ketinggian Assman); suhu minimum ≤ suhu maksimum (air open pan, AWS).
  - Batas wajar per parameter (misal arah angin 0–360°, okta 0–8 bilangan bulat, RH 0–100 %, Campbell-Stokes 0–1 jam per jam, curah hujan ≥ 0), juga untuk nilai AWS.
  - Counter angin, Piche, dan Gunn-Bellani tidak boleh lebih kecil dari pembacaan sebelumnya (kecuali field Sebelum diubah karena reset/isi ulang); penguapan open pan tidak boleh negatif.
  - Field dihitung app (Selisih, Penguapan open pan, Penguapan Piche, intensitas Gunn-Bellani) selalu dihitung ulang di server.
- **Penyimpanan Foto:** `PhotoStorageInterface` (`PHOTO_DISK=local` saat development, `drive` saat produksi). Foto disimpan dulu di disk privat server (`storage/app/private/foto_observasi/tahun/bulan/tanggal`), lalu job `UploadObservationPhoto` memindahkannya ke Shared Drive dengan struktur folder yang sama dan mencoba ulang bila gagal; perintah terjadwal `silap:unggah-foto-tertunda` (tiap jam) mengantrekan ulang foto yang masih tertunda. Foto tidak punya URL publik, selalu dibuka lewat rute yang memeriksa hak akses.
- **Laporan:** Luaran laporan hanya dua, keduanya PDF: (1) laporan per jam/slot pengamatan dan (2) laporan per triwulan (bukti dukung SKP). Laporan bulanan dan export CSV ditiadakan (keputusan 17 Oktober 2026). Total curah hujan harian hanya tampil di halaman (dashboard), dihitung mulai slot 07.00. Pengamat hanya dapat mengunduh PDF per jam dan PDF triwulan miliknya sendiri; penyelia dan admin dapat mengunduh PDF semua pegawai per orang, atau paket ZIP berisi PDF triwulan semua pegawai (ZIP hanya untuk penyelia dan admin). Laporan triwulan tersedia setelah triwulan di-ACC. PDF per slot meniru tata letak tab FDIH BMKGSoft v2 (dengan nomor urut ketik) dan bisa diunduh tanpa menunggu ACC. PDF triwulan memuat kop BMKG, ringkasan performa, tabel dua baris per entri, tanda tangan pegawai dan penyelia, serta lampiran per shift (gambar laporan kondisi cuaca + foto kegiatan); hanya data Approved.
- **Format Form Nasional:** Kartu 1–7 (tab FDIH) aktif pada slot AGM1B (07.30, 13.30, 17.30 WIB). Kartu 8 aktif pada jam penuh (16 slot) dan harian 07.00 WIB.
- **Nilai 9999:** Data tidak diukur atau dinonaktifkan (seperti suhu tanah 2 cm) disimpan NULL di database, dicetak `9999` di PDF.
- **Foto & Geotag:** Foto diambil langsung dengan kamera dan diberi geotag seperti kamera geotag pada umumnya (gaya "GPS Map Camera"): panel di bawah foto berisi peta kecil dengan penanda lokasi, nama tempat (kota, provinsi, negara), alamat singkat (jalan, kelurahan, kota, provinsi, kode pos) dari reverse geocoding OpenStreetMap, Lat, Long, Plus Code, serta tanggal dan jam (GMT +07:00). Tanpa label lokasi statis. Bila GPS perangkat tidak tersedia, watermark menulis "Lokasi GPS tidak tersedia" (tidak ada koordinat cadangan). Keadaan darurat (kamera tidak bisa dipakai, sinyal buruk): foto boleh diunggah dari galeri. Geotag dan waktu pada watermark adalah lokasi dan waktu saat diunggah, bukan saat dipotret; foto ditandai "foto darurat dari galeri" dan jumlahnya tampil di antrean penyelia. Bila lokasi unggah tidak tersedia, watermark menulis "lokasi unggah tidak tersedia" (tidak memakai koordinat stasiun).
- **Dihapus dari Scope:** Modul Fenologi dihapus total, kelembapan tanah dihapus, peringatan baterai AWS dibatalkan, SSO di luar scope.
- **NIP asli 7 pegawai** — masih dummy, perlu diminta ke bagian administrasi.

## 7. Riwayat Perubahan Dokumen

- 17 Oktober 2026: disesuaikan dengan catatan revisi dan kode saat ini (login NIP/email, peran admin, model data parameter, DomPDF, validasi fisika, kunci dan buka kunci triwulan, penyimpanan foto privat + antrean Drive). Sebutan "jam sinoptik" diganti slot foto 07.00/17.00.

- 17 Oktober 2026: watermark foto memakai geotagging (koordinat GPS perangkat + peta kecil) di samping label lokasi statis; unggah galeri diizinkan untuk keadaan darurat dengan geotag lokasi saat diunggah. Menggantikan keputusan sebelumnya (label lokasi statis tanpa koordinat, kamera tanpa galeri).
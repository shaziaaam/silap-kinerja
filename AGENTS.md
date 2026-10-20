# SILAP-Kinerja — Project Instructions

Aplikasi web pencatatan observasi cuaca & bukti dukung SKP untuk Stasiun Klimatologi Jawa Tengah (BMKG).

**Baca dokumen acuan utama sebelum mengerjakan tugas apa pun di proyek ini:**
- `D:\revisi silap-kerja\revisi-silap-kinerja.md` (Catatan Revisi versi bersih, acuan tertinggi)
- `D:\revisi silap-kerja\tugas-revisi-silap-kinerja.md` (Daftar Tugas Revisi)
- Foto layar form nasional BMKGSoft v2 (tab FDIH) di folder yang sama, acuan tata letak PDF per slot
- `docs/prd.md` dan `docs/parameter-pengamatan.md`

## Stack

- Backend: Laravel (PHP 8.3+)
- Frontend: Inertia.js + React — **bukan** Vue, **bukan** Next.js terpisah
- Database: MySQL 8 (produksi) / SQLite (development & testing)
- Generate PDF: Blade view di `resources/views/pdf/` via DomPDF (WebP dikonversi ke JPEG saat render)
- Gambar Laporan: Template GD + FreeType (Desain B, tanpa Chromium)
- Auth: NIP atau email + password, registrasi publik dimatikan, akun dibuat lewat seeder / Kelola Pengguna
- Queue: driver `database`; cron `schedule:run` menjalankan `silap:unggah-foto-tertunda` tiap jam

## Konvensi proyek (jangan menyimpang tanpa alasan)

- **Foto:** Hanya 2 kali sehari pada slot **07.00 WIB** (shift pagi) dan **17.00 WIB** (shift siang). Slot jam lain tanpa field foto.
- **Approval:** Penyelia meng-ACC **hanya per triwulan** per pegawai. Aksi per entri observasi hanya untuk mengembalikan dengan catatan revisi. ACC triwulan diblokir jika pegawai masih memiliki observasi berstatus revisi (`revision`). Setelah ACC data terkunci untuk semua peran; hanya admin yang membuka kunci (alasan wajib, tercatat di `rekap_skp_triwulan`).
- **Hak akses:** ditegakkan di server dengan middleware `role` di `routes/web.php` (`role:penyelia`, `role:admin`, ...). Menyembunyikan menu di Sidebar saja tidak cukup.
- **Validasi fisika & rumus:** satu sumber aturan di `config/silap.php` (`aturan_fisika`, `batas_aws`), dijalankan server oleh `App\Services\ObservationRules` dan dicerminkan form oleh `resources/js/lib/observationRules.js`. Field dihitung app selalu dihitung ulang di server. Ubah keduanya bersamaan.
- **Penyimpanan Foto:** `PhotoStorageInterface` (`PHOTO_DISK=local` untuk development, `drive` ke Shared Drive instansi via Service Account). Foto selalu masuk disk privat dulu (`foto_observasi/tahun/bulan/tanggal`), lalu job `UploadObservationPhoto` memindahkannya ke Drive. Jangan menautkan foto langsung; selalu lewat rute `observations.photo`.
- **Tanggal:** hindari `MONTH()`/`QUARTER()` dan `whereBetween` inklusif pada kolom `tanggal` (SQLite menyimpan `Y-m-d 00:00:00`); pakai rentang setengah-terbuka `>= awal` dan `< awal berikutnya`, atau `whereDate`.
- **Form Nasional FDIH:** Kartu 1–7 (AGM1B: 07.30, 13.30, 17.30 WIB). Kartu 8 (jam penuh 07.00–22.00 dan harian 07.00 WIB). Field yang tampil ditentukan `jadwal_baca` tiap parameter (sama di form dan PDF), jadi jadwal bisa diubah di Kelola Alat tanpa mengubah kode. Nilai 9999 dicetak untuk data tidak diukur / nonaktif. PDF per slot meniru tata letak layar FDIH.
- **Laporan:** hanya PDF per slot dan PDF triwulan (SKP). Laporan bulanan dan CSV ditiadakan. Pengamat hanya PDF miliknya; penyelia/admin PDF semua pegawai dan ZIP semua pegawai.
- **Input observasi:** hanya pengamat (`role:pengamat`), satu observasi per slot per tanggal untuk seluruh stasiun, tanggal tidak boleh melewati hari ini.
- **Dihapus:** Modul Fenologi dihapus total, kelembapan tanah dihapus, peringatan baterai AWS dibatalkan.
- **Geotag foto:** gaya kamera geotag umum, tanpa label lokasi statis: peta kecil, nama tempat + alamat (reverse geocoding, `config/silap.php` → `geotag`), Lat, Long, Plus Code (dihitung offline), tanggal-jam GMT +07:00. Tanpa koordinat cadangan; GPS mati ditulis "Lokasi GPS tidak tersedia". Galeri hanya untuk keadaan darurat: lokasi dan waktu saat diunggah, ditandai "Foto dari galeri" (`foto_sumber = galeri`). Kode di `resources/js/Components/WatermarkCamera.jsx`.

## Build & test

- `composer install`
- `npm install`
- `php artisan migrate:fresh --seed` (setelah mengubah parameter: `php artisan db:seed --class=InstrumentSeeder`, aman diulang)
- `npm run build` / `npm run dev`
- `php artisan test`
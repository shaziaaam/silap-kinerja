# SILAP-Kinerja — Project Instructions

Aplikasi web pencatatan observasi cuaca & bukti dukung SKP untuk Stasiun Klimatologi Jawa Tengah (BMKG).

**Baca dokumen acuan utama sebelum mengerjakan tugas apa pun di proyek ini:**
- `D:\surat pengantar\revisi-silap-kinerja.md` (Catatan Revisi versi bersih)
- `D:\surat pengantar\tugas-revisi-silap-kinerja.md` (Daftar Tugas Revisi)
- `docs/srs.md` dan `docs/parameter-pengamatan.md`

## Stack

- Backend: Laravel (PHP 8.3+)
- Frontend: Inertia.js + React — **bukan** Vue, **bukan** Next.js terpisah
- Database: MySQL 8 (produksi) / SQLite (development & testing)
- Generate PDF: Blade view di `resources/views/pdf/` via DomPDF (WebP dikonversi ke JPEG saat render)
- Gambar Laporan: Template GD + FreeType (Desain B, tanpa Chromium)
- Auth: NIP atau email + password, registrasi publik dimatikan, akun dibuat lewat seeder

## Konvensi proyek (jangan menyimpang tanpa alasan)

- **Foto:** Hanya 2 kali sehari pada slot **07.00 WIB** (shift pagi) dan **17.00 WIB** (shift siang). Slot jam lain tanpa field foto.
- **Approval:** Penyelia meng-ACC **hanya per triwulan** per pegawai. Aksi revisi per entri observasi dipertahankan sebagai jalur pengecualian. ACC triwulan diblokir jika pegawai masih memiliki observasi berstatus revisi (`revision`).
- **Penyimpanan Foto:** `PhotoStorageInterface` (driver `local` untuk development, `drive` ke Google Workspace Shared Drive instansi via Service Account).
- **Form Nasional FDIH:** Kartu 1–7 (AGM1B: 07.30, 13.30, 17.30 WIB). Kartu 8 (jam penuh 07.00–22.00 dan harian 07.00 WIB). Nilai 9999 dicetak untuk data tidak diukur / nonaktif.
- **Dihapus:** Modul Fenologi dihapus total, kelembapan tanah dihapus, peringatan baterai AWS dibatalkan, GPS dihapus.
- Watermark foto: timestamp realtime + label lokasi statis ("Taman Alat, Stasiun Klimatologi Jawa Tengah"), dibakar ke gambar saat capture.

## Build & test

- `composer install`
- `npm install`
- `php artisan migrate:fresh --seed`
- `npm run build` / `npm run dev`
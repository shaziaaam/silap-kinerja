# SILAP-Kinerja — Project Instructions

Aplikasi web pencatatan observasi cuaca & bukti dukung SKP untuk Stasiun Klimatologi Jawa Tengah (BMKG).

**Baca `docs/srs.md` dan `docs/parameter-pengamatan.md` sebelum mengerjakan tugas apa pun di proyek ini.** Kedua file itu berisi requirement lengkap dan daftar parameter — jangan berasumsi di luar yang tertulis di sana.

## Stack

- Backend: Laravel (PHP 8.2+)
- Frontend: Inertia.js + React — **bukan** Vue, **bukan** Next.js terpisah
- Database: relasional (MySQL/PostgreSQL/SQLite) — bukan Google Spreadsheet
- Generate PDF: Blade view di `resources/views/pdf/`
- Auth: NIP + password, registrasi publik dimatikan, akun dibuat lewat seeder

## Konvensi proyek (jangan menyimpang tanpa alasan)

- Keterangan sumber (`manual` / `otomatis`) **dihapus** dari aplikasi. Setiap parameter dicatat nilainya secara langsung.
- Parameter numerik disesuaikan secara presisi dengan tampilan monitor **AWS** (`images/aws.jpeg`) dan monitor **Wind YOUNG Model 26800** (`images/winds.jpeg`).
- Field `batt_volt` **tidak dimasukkan** ke aplikasi.
- **Jangan** tambahkan field lokasi/GPS di `observations` — lokasi pengamatan selalu tetap (taman alat), sudah sengaja dihilangkan.
- Halaman React ada di `resources/js/Pages/`, mengikuti routing Inertia standar Breeze.
- 3 role: `pengamat`, `penyelia`, dan admin.
- Watermark foto: timestamp realtime + label lokasi statis ("Taman Alat, Stasiun Klimatologi Jawa Tengah"), dibakar ke gambar saat capture — bukan field terpisah di database.

## Build & test

- `composer install`
- `npm install`
- `php artisan migrate:fresh --seed`
- `npm run build` / `npm run dev`
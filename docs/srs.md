# SILAP-Kinerja — Requirement & Keputusan Desain (Final)

> Dokumen ini menggabungkan SRS resmi dari mentor dengan seluruh hasil diskusi dan konfirmasi lanjutan. Kalau ada bagian yang bertentangan dengan SRS resmi, dokumen **ini yang berlaku**, karena mencerminkan keputusan terakhir yang sudah dikonsultasikan ke mentor. Bagian 10 mencatat secara eksplisit di mana dokumen ini menyimpang dari SRS resmi, supaya jejaknya tidak hilang.

## 1. Ringkasan Proyek

- **Nama:** SILAP-Kinerja (Sistem Integrasi Laporan Pengamatan dan Bukti Dukung SKP)
- **Konteks:** proyek magang di Stasiun Klimatologi Jawa Tengah, bagian pengamatan dan pelaporan.
- **Tujuan:** mengganti web lama (yang cuma berisi dropdown jenis laporan, dropdown observer, dan upload CSV) dengan sistem yang mencatat observasi cuaca per parameter, memvalidasinya, dan otomatis menghasilkan lampiran bukti dukung SKP triwulanan.

## 2. Aktor & Peran

| Aktor | Jumlah | Hak akses utama |
|---|---|---|
| **Pengamat** | 6 orang | Login, input observasi per parameter, ambil foto wajib di jam sinoptik, lihat riwayat pribadi |
| **Penyelia** | 1 orang (Richardus Teguh Prayitno) — verifikator tunggal, tidak ada approver cadangan | Lihat dashboard antrean validasi, approve/reject/beri catatan revisi, generate & unduh rekap SKP |
| **Admin** | sistem/mentor | Seed akun awal 7 pegawai ke database, reset password |

Nama pengamat (Achmad Sulistyo E.P, Edy Susanto, Eko Taufiq Suharmanto, Joko Cahyono, Muryanti, Shandy Al Mughozali) diambil dari situs resmi BMKG Stasiun Klimatologi Semarang. NIP tidak tersedia di sana — diisi data dummy sementara sampai data asli didapat dari bagian administrasi.

## 3. Stack & Infrastruktur

- **Backend:** Laravel (database, autentikasi, generate PDF)
- **Frontend:** Inertia.js + React (dipilih karena sudah terbiasa pakai React; alternatif Vue tidak dipakai)
- **Database:** relasional (MySQL/PostgreSQL) — bukan Google Spreadsheet seperti rencana awal AppSheet
- **Generate PDF:** disarankan `spatie/laravel-pdf` (render dari Blade view, bukan mekanisme merge-tag AppSheet/Google Docs)
- **Hosting:** server internal BMKG Jateng (stasiun punya divisi IT sendiri untuk maintain aplikasi setelah magang selesai — ini sudah didiskusikan dan jadi alasan resmi pindah dari rencana low-code AppSheet ke full-code)
- **Masa uji coba:** pakai ngrok untuk expose server lokal sementara — sudah diizinkan mentor

## 4. Skema Autentikasi

- Login pakai **NIP + password**, bukan email.
- Fitur registrasi publik **dimatikan**.
- 7 akun pegawai (6 Pengamat + 1 Penyelia) dibuat langsung oleh Admin/sistem lewat seeder database.
- Password default (mis. `BmkgJateng2026!`), dengan flag `must_change_password = true` yang memaksa ganti password saat login pertama kali.

## 5. Arsitektur Data

4 entitas utama — lihat `erd.png` untuk diagram lengkap:

- **users** — id, nama, nip, role (pengamat/penyelia), password_hash, must_change_password
- **schedules** — id, jam_utc, jam_wib (derived)
- **observations** — id, user_id (FK), approved_by (FK), schedule_id (FK), tanggal, status_pengamatan, alasan_batal, lalu **setiap parameter cuaca disimpan sebagai pasangan kolom `nilai` + `sumber` (manual/otomatis)** — lihat `parameter-pengamatan.md` untuk daftar lengkap 15 parameter — ditutup dengan foto_path, status_approval, catatan_supervisor, created_at
- **rekap_skp_triwulan** — id, user_id (FK), tahun, triwulan, total_pengamatan_valid, file_pdf_path, tanggal_generate

Catatan: tabel `aws_data` terpisah yang ada di SRS resmi **tidak dibuat** — lihat bagian 10.

## 6. Aturan Bisnis & Keputusan Final (9 Oktober 2026)

- **Foto Kegiatan:** Wajib hanya pada 2 slot per hari: **07.00 WIB** (shift pagi) dan **17.00 WIB** (shift siang). Slot jam lain tanpa field foto. Aturan lama jam sinoptik UTC 00/03/06/09/12/15 dibatalkan.
- **Persetujuan (Approval):** Penyelia meng-ACC **hanya per triwulan** per pegawai. Aksi revisi per entri observasi dipertahankan sebagai jalur pengecualian. ACC triwulan diblokir jika pegawai masih memiliki observasi berstatus revisi (`revision`).
- **Validasi Fisika:** Suhu bola basah harus ≤ suhu bola kering (pada sangkar dan tiap ketinggian Assman); Suhu minimum ≤ suhu maksimum.
- **Penyimpanan Foto:** Disimpan ke Google Drive via `PhotoStorageInterface` (driver `local` saat development, `drive` ke Shared Drive saat produksi).
- **Format Form Nasional:** Kartu 1–7 (tab FDIH) aktif pada slot AGM1B (07.30, 13.30, 17.30 WIB). Kartu 8 aktif pada jam penuh (16 slot) dan harian 07.00 WIB.
- **Nilai 9999:** Data tidak diukur atau dinonaktifkan (seperti suhu tanah 2 cm) disimpan NULL di database, dicetak `9999` di PDF dan CSV.
- **Dihapus dari Scope:** Modul Fenologi dihapus total, kelembapan tanah dihapus, peringatan baterai AWS dibatalkan, GPS dihapus, SSO di luar scope. Watermark memakai teks lokasi statis "Taman Alat, Stasiun Klimatologi Jawa Tengah".
- **NIP asli 7 pegawai** — masih dummy, perlu diminta ke bagian administrasi.

## 12. Riwayat Perubahan Dokumen

- Watermark foto: dikonfirmasi menampilkan timestamp realtime + label lokasi statis (teks tetap "Taman Alat, Stasiun Klimatologi Jawa Tengah", bukan koordinat live), dibakar ke gambar. Sebelumnya berstatus terbuka, ditutup karena interpretasi ini diajukan dan tidak dibantah.
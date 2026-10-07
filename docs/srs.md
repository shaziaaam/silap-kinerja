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

## 6. Aturan Bisnis

- Kamera wajib hanya di jam sinoptik UTC 00/03/06/09/12/15.
- Validasi fisika: suhu bola basah harus ≤ suhu bola kering.
- Pengamat **bebas memilih sumber data (manual atau otomatis AWS) per parameter, kapan saja** — bukan hanya saat force majeure/status "Tidak Dilakukan" seperti di SRS resmi. Data AWS dibaca langsung dari monitor alat oleh pengamat (tidak ada integrasi API/webhook otomatis untuk versi ini).
- Sistem hanya menyimpan **satu nilai per parameter** (yang dipilih pengamat), bukan menyimpan nilai manual dan AWS sekaligus.
- Lokasi GPS **tidak dipakai** — pengamatan selalu di lokasi tetap (taman alat), jadi tidak perlu field koordinat atau tracking lokasi live.
- Watermark pada foto tetap dipakai sesuai brief awal: timestamp realtime dibakar ke foto (bukan sekadar keterangan terpisah). **Masih perlu konfirmasi ulang** apakah watermark juga perlu menampilkan label lokasi statis (teks tetap, bukan koordinat live) — lihat bagian 11.
- Rekap SKP hanya menarik data dengan `status_approval = Approved`.

## 7. Modul Input Observasi (Pengamat)

- Form per parameter, masing-masing dengan toggle sumber data (manual/otomatis).
- Perangkat yang dipakai: **HP pribadi lewat browser mobile** (bukan tablet/komputer kantor) — pengaruh ke desain kamera (`getUserMedia`) dan pertimbangan PWA offline-first kalau sinyal di taman alat kurang stabil.
- Foto wajib di jam sinoptik, dengan watermark timestamp dibakar ke gambar via canvas overlay saat capture, sebelum upload.

## 8. Modul Validasi (Penyelia)

- Dashboard antrean validasi menampilkan data yang masuk.
- Approve / Reject / beri catatan revisi. Kalau reject, alur balik ke Pengamat untuk direvisi dan disubmit ulang.

## 9. Modul Rekap & Laporan PDF SKP

Template lama (`Template_SKP_SILAP_Kinerja.docx`) dinilai kurang lengkap. Spesifikasi laporan final:

- Menampilkan **semua parameter** pengamatan (bukan cuma 3 seperti template lama), dengan **layout tabel baris ganda** per entri supaya tetap terbaca meski portrait.
- Kolom bukti dukung hanya **foto** (kolom koordinat GPS dihapus).
- **Kop resmi** (logo BMKG + nama instansi) ditambahkan — gaya mengikuti dokumen "Bukti Kinerja Pemeliharaan/Kebersihan Lingkungan Taman Peralatan Triwulan III 2026" milik instansi: logo di tengah atas, judul tebal center-aligned, keterangan triwulan-tahun di bawah judul.
- **Ringkasan performa** ditambahkan (mis. total pengamatan valid vs jadwal per triwulan).
- **Ruang tanda tangan/NIP/tanggal** untuk pengesahan Penyelia ditambahkan.
- **Tidak perlu** menandai sumber data (manual/AWS) per baris di laporan cetak, meskipun datanya tetap tersimpan di database.
- Karena generate PDF pindah dari mekanisme merge-tag AppSheet/Google Docs (`<<[field]>>`), template baru harus didesain ulang sebagai Blade view (`resources/views/pdf/rekap-skp.blade.php`).

## 10. Deviasi dari SRS Resmi (penting)

SRS resmi dari mentor menyebut pseudocode dengan sintaks behavior kolom AppSheet (`Show_If`, `Required_If`, `Valid_If`), yang mengindikasikan rencana awal implementasi di AppSheet dengan basis data Google Spreadsheet. Setelah didiskusikan dengan mentor, proyek ini **berpindah ke stack Laravel + Inertia + React dengan database relasional**, karena stasiun punya divisi IT sendiri untuk maintain aplikasi setelah magang selesai. Perubahan lain dari SRS resmi:

- Tabel `aws_data` terpisah dengan feed otomatis tiap 10 menit **tidak dibuat** — AWS dibaca manual dari monitor oleh pengamat.
- Aturan "AWS jadi rujukan pengganti hanya saat status Tidak Dilakukan" **diubah** jadi pilihan bebas per parameter kapan saja.
- Peringatan visual baterai AWS (`batt_volt < 11.5V`) dari SRS resmi **belum diimplementasi ulang** di rencana baru ini — karena tidak ada lagi integrasi otomatis ke data AWS, perlu diputuskan apakah fitur ini masih relevan atau dihapus.

## 11. Hal yang Masih Terbuka

- **Peringatan baterai AWS:** relevan atau tidak, mengingat AWS sekarang dibaca manual dari monitor, bukan lewat feed otomatis (lihat bagian 10) — tidak ada lagi sumber data live untuk memicu peringatan ini secara otomatis.
- **NIP asli 7 pegawai** — masih dummy, perlu diminta ke bagian administrasi.

## 12. Riwayat Perubahan Dokumen

- Watermark foto: dikonfirmasi menampilkan timestamp realtime + label lokasi statis (teks tetap "Taman Alat, Stasiun Klimatologi Jawa Tengah", bukan koordinat live), dibakar ke gambar. Sebelumnya berstatus terbuka, ditutup karena interpretasi ini diajukan dan tidak dibantah.
# Grand Design & System Color Palette — SILAP-Kinerja
**Stasiun Klimatologi Jawa Tengah — BMKG**

Dokumen ini berisi panduan resmi *grand design*, skema warna (*color palette*), prinsip UI/UX, serta konvensi komponen visual untuk aplikasi **SILAP-Kinerja**.

---

## 1. Panduan Identitas Visual & Palette Warna (BMKG Color System)

Aplikasi menggunakan palet warna resmi BMKG yang elegan, bernuansa hijau alami klimatologi, dikombinasikan dengan sentuhan modern *Frosted Glassmorphism*.

| Peran Warna | Kode Warna / Tailwind Class | Visual / Penggunaan |
| :--- | :--- | :--- |
| **Header Gradient Start** | `#0f4a2a` (`rgb(15, 74, 42)`) | Sisi kiri gradien Navbar (Hijau Hutan Gelap) |
| **Header Gradient Middle** | `#166534` (`emerald-800`) | Bagian tengah gradien Navbar (Hijau BMKG Utama) |
| **Header Gradient End** | `#15803d` (`emerald-700`) | Sisi kanan gradien Navbar (Hijau Tropis Alami) |
| **Navbar Text Accent** | `#bbf7d0` (`emerald-200`) | Label NIP, role user, dan highlight teks sekunder |
| **Main Page Background** | `#f0fdf4` (`emerald-50`) | Warna dasar seluruh latar belakang halaman utama |
| **Card Container** | `#ffffff` / `bg-white` | Latar belakang modul form, tabel, dan card utama |
| **Primary Action Button** | `from-emerald-600 to-green-600` | Tombol kirim, simpan, dan aksi utama (Pill Shape) |
| **Shift Pagi Badge** | `bg-sky-100 text-sky-900 border-sky-300` | Indikator pengamatan Shift Pagi (07.00 - 15.00 WIB) |
| **Shift Siang Badge** | `bg-amber-100 text-amber-900 border-amber-300` | Indikator pengamatan Shift Siang (15.00 - 22.00 WIB) |
| **Validation Error State** | `bg-rose-50/70 border-rose-400` | Peringatan visual otomatis jika nilai parameter fisik salah |

---

## 2. Spesifikasi Glassmorphism & Motion / Transisi UI

Mengikuti prinsip desain *frosted glass* modern (seperti iOS & One UI), elemen navigasi dan widget melayang menggunakan aturan berikut:

### A. Header Navbar (BMKG Glass Gradient Header)
- **Background:** `linear-gradient(90deg, rgba(15, 74, 42, 0.95) 0%, rgba(22, 101, 52, 0.95) 50%, rgba(21, 128, 61, 0.95) 100%)`
- **Backdrop Blur:** `blur(12px)` (`backdrop-blur-md`)
- **Border:** `1px solid rgba(255, 255, 255, 0.15)`

### B. Menu Navigasi (Oval Clear Glass Toggle)
- **Bentuk:** `rounded-full` (Shape oval penuh yang lembut)
- **Active State:** `bg-white/20 text-white border-white/30 backdrop-blur-md scale-[1.03] shadow-md`
- **Hover State:** `hover:bg-white/15 hover:text-white hover:border-white/20 hover:scale-[1.03]`
- **Active/Click State:** `active:scale-[0.97]`
- **Durasi Transisi:** `transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]` (Sangat halus & kenyal).

### C. Floating Live Clock Widget (Jam Realtime WIB & UTC)
- **Posisi:** `fixed bottom-4 right-4 z-40` (Kanan bawah melayang)
- **Style:** `bg-emerald-950/90 backdrop-blur-md border border-emerald-700/60 rounded-full shadow-xl`
- **Elemen:** Indikator titik pulsa hijau aktif realtime (`w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse`) + teks WIB & UTC.

---

## 3. Struktur Tabel Riwayat Observasi Cuaca (Kemudahan Bukti SKP)

Tabel dibuat ringkas dan fokus pada pembuktian SKP & pengawasan operasional:
1. **Tanggal & Jam:** Tanggal dan jam pengamatan (WIB / UTC).
2. **Shift Observasi:**
   - **Shift Pagi:** 07:00 WIB s.d. 15:00 WIB.
   - **Shift Siang:** 15:00 WIB s.d. 22:00 WIB.
3. **Pengamat (Penginput):** Nama Petugas & NIP Pengamat.
4. **Foto Watermark:** Link akses foto bukti dukung ber-watermark lokasi & timestamp.
5. **Status Approval:** Status persetujuan Supervisor (Approved / Menunggu Validasi / Revisi).

---

## 4. Logo Resmi & Komponen Brand

- **Logo Utama Header:** `/images/brand/bmkg.png` (Logo BMKG bulat dengan teks lambang berwarna putih di bawahnya).
- **Nama Aplikasi:** `SILAP-Kinerja` (Sistem Informasi Laporan & Kinerja BMKG Jateng).

---

*Dokumen ini dibuat secara resmi untuk menjaga konsistensi visual dan standar pengkodean pada proyek SILAP-Kinerja.*

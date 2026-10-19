# Parameter Pengamatan (Form Nasional BMKGSoft v2)

Dokumen ini disusun berdasarkan ketentuan revisi SILAP-Kinerja (9 Oktober 2026), Peraturan Kepala BMKG No. 4 Tahun 2016, dan form nasional BMKGSoft v2 (Input Data > Klimatologi > tab FDIH).

## 1. Aturan Umum & Keputusan Final
- **Foto:** Hanya 2 kali sehari pada slot **07.00 WIB** (shift pagi) dan **17.00 WIB** (shift siang). Slot jam lain tanpa field foto.
- **Approval:** Penyelia meng-ACC **hanya per triwulan** per pegawai. Aksi revisi per entri observasi dipertahankan sebagai jalur pengecualian. ACC triwulan diblokir jika ada observasi pegawai berstatus revisi. Setelah ACC data terkunci; hanya admin yang dapat membuka kunci.
- **Fenologi:** Telah dihapus total dari seluruh aplikasi.
- **Penyimpanan Foto:** Menggunakan interface `PhotoStorageInterface` (driver `local` untuk development, `drive` ke Shared Drive Google Workspace instansi via Service Account).
- **Nilai 9999:** Sistem nasional memakai `9999` untuk data tidak diukur / opsional / baris nonaktif. Di database disimpan NULL, dicetak `9999` abu-abu di PDF.
- **Field Dihitung App:** Selisih Tinggi Air = Sebelum − Dibaca; Penguapan Open Pan = Selisih + CH Diukur; Penguapan Piche = Sekarang − Sebelum; Intensitas Gunn-Bellani = (Skala hari ini − Skala kemarin) × koefisien. Dicocokkan dengan layar nasional: 15 − 31,5 = −16,5; −16,5 + 18 = 1,5; 31,5 − 24,2 = 7,3. Selalu dihitung ulang di server.
- **Field Dihitung Nasional:** RH Sangkar & Assman, T Rata Air, Counter Rata (dicetak label "otomatis" di PDF).
- **Field "Sebelum":** diisi dari bacaan terakhir field sumbernya di stasiun: Counter Sebelum ← Counter Dibaca, Tinggi Air Sebelum ← Tinggi Air Dibaca, Piche Sebelum ← Piche Sekarang, Gunn-Bellani Kemarin ← Skala Buret. Bisa diubah lewat tombol "Ubah" bila alat direset/diisi ulang.
- **Validasi fisika** (form dan server, `config/silap.php` bagian `aturan_fisika` dan `batas_aws`): TBB ≤ TBK; Min ≤ Maks; bacaan Counter, Piche, dan Gunn-Bellani tidak boleh lebih kecil dari Sebelum; penguapan open pan tidak boleh negatif; batas wajar tiap parameter (kolom Batas di bawah, bisa diubah di Kelola Alat).

---

## 2. Kelompok Jadwal Baca
| Kode | Slot (WIB) | Dipakai Oleh |
|---|---|---|
| `AGM1B` | 07.30, 13.30, 17.30 | Kartu 1 s.d. 7 (seluruh isi tab FDIH Agm 1-b) |
| `JAM_PENUH` | 07.00 s.d. 22.00 (16 slot) | Kartu 8: Awan, Jarak Pandang, Arah/Kecepatan Angin, Ombrometer, Campbell-Stokes |
| `HARIAN_0700` | Hanya slot 07.00 | Kartu 8: Gunn-Bellani, Microbarograf, Termograf, Hellmann (nonaktif) |

Operasional stasiun berjalan 7 hari seminggu (termasuk Minggu) dengan total 19 slot per hari (16 jam penuh + 3 AGM1B).

---

## 3. Kartu 1–7 (Tab FDIH, Jadwal AGM1B)
1. **Kartu 1. Psikrometer Sangkar (1,2 m):**
   - TBK (°C) — Input, batas 0–50 (Padanan AWS: `TA_meas`)
   - TBB (°C) — Input, batas 0–50 (Validasi: TBB ≤ TBK)
   - RH (%) — Dihitung sistem nasional (Padanan AWS: `RH_meas`)

2. **Kartu 2. Angin (0,5 m & 10 m):**
   - Counter Sebelum (km) — Terisi dari entri sebelumnya (bisa diedit)
   - Counter Dibaca (km) — Input, ≥ 0 dan tidak lebih kecil dari Counter Sebelum
   - Counter Rata (km/jam) — Dihitung sistem nasional
   - Kecepatan saat Pengamatan 10 m — Input, 0–75 (Padanan AWS: `WS_meas` m/s; PDF juga mencetak padanan knot)

3. **Kartu 3. OP Penguapan:**
   - Tinggi Air Sebelum (mm) — Terisi otomatis (bisa diedit)
   - Tinggi Air Dibaca (mm) — Input
   - Selisih Tinggi Air (mm) — Dihitung app (Sebelum − Dibaca)
   - T Air Maks (°C) — Input
   - T Air Min (°C) — Input (Validasi: Min ≤ Maks)
   - T Rata Air (°C) — Dihitung sistem nasional
   - CH Diukur (mm) — Input dari penakar hujan, 0–500
   - Penguapan Open Pan (mm) — Dihitung app (Selisih + CH Diukur), tidak boleh negatif

4. **Kartu 4. Psikrometer Assman (Bertingkat 5, 10, 20, 50, 100, 150, 200 cm):**
   - TBK (°C) & TBB (°C) — Input, batas 0–60 (Validasi: TBB ≤ TBK tiap tinggi)
   - RH (%) — Dihitung sistem nasional

5. **Kartu 5. Piche Evaporimeter:**
   - Pembacaan Sebelum (cm³) — Terisi otomatis (bisa diedit)
   - Pembacaan Sekarang (cm³) — Input, tidak lebih kecil dari Pembacaan Sebelum
   - Penguapan Piche (cm³) — Dihitung app (Sekarang − Sebelum)

6. **Kartu 6. Pengamatan Kualitatif:**
   - Keadaan Tanah — Dropdown dari master `parameter_options` (isi awal di seeder; lengkapi dari dropdown sistem nasional)
   - Keadaan Hujan — Dropdown dari master `parameter_options` (Ringan, Sedang, Lebat, Tidak Ada Hujan)
   - Keterangan AGM 1-B — Teks opsional

7. **Kartu 7. Suhu Tanah (Kedalaman 0, 2, 5, 10, 20, 50, 100 cm):**
   - Masing-masing Berumput dan Gundul (°C), batas 0–70
   - Baris kedalaman 2 cm dinonaktifkan di app dan dicetak `9999` di PDF sesuai kondisi stasiun

---

## 4. Kartu 8 (Alat di Luar Tab FDIH)
| Parameter | Satuan | Jadwal | Batas | AWS |
|---|---|---|---|---|
| Jumlah Awan | okta | `JAM_PENUH` | 0–8, bilangan bulat | – |
| Penglihatan Mendatar | km | `JAM_PENUH` | 0–100 | – |
| Arah Angin | derajat | `JAM_PENUH` | 0–360 | `WD_meas` |
| Kecepatan Angin | m/s (PDF juga knot) | `JAM_PENUH` | 0–75 | `WS_meas` |
| Curah Hujan Ombrometer | mm per jam | `JAM_PENUH` | 0–300 | `rainHourly` |
| Campbell-Stokes | jam per jam | `JAM_PENUH` | 0–1 | – |
| Gunn-Bellani Kemarin | skala | `HARIAN_0700` | ≥ 0 (field Sebelum) | – |
| Gunn-Bellani Skala Buret | skala | `HARIAN_0700` | ≥ 0, tidak lebih kecil dari kemarin | `SR_Max` |
| Gunn-Bellani Intensitas | kal/cm² | `HARIAN_0700` | dihitung app, koefisien default 20,8 | – |
| Microbarograf | mbar | `HARIAN_0700` | 900–1100 | `PA_QFE` |
| Termograf | °C | `HARIAN_0700` | 0–50 | `TA_meas` |
| Suhu Udara Maksimum (AWS) | °C | `JAM_PENUH` | 0–50, hanya AWS | `TA_Max` |
| Suhu Udara Minimum (AWS) | °C | `JAM_PENUH` | 0–50, hanya AWS, ≤ maksimum | `TA_Min` |
| Penakar Hujan Hellmann | pias | `HARIAN_0700` | 0–300, nonaktif default | `rainHourly` |

Batas nilai AWS lain (per kolom, `config/silap.php` → `batas_aws`): `RH_meas` 0–100 %, `TA_*` 0–50 °C, `WS_meas` 0–75 m/s, `WD_meas` 0–360°, `PA_QFE`/`PA_QFF` 900–1100 mbar, `rainHourly` 0–300 mm, `SR_Max` 0–1500 W/m².

---

## 5. Keadaan Cuaca pada Gambar Laporan Shift
Diturunkan otomatis dari jumlah awan jam terakhir dan curah hujan jam terakhir dalam shift (`config/silap.php` → `keadaan_cuaca`):

- **Hujan** (dipakai bila hujan jam terakhir ≥ 0,1 mm), kriteria intensitas BMKG: Ringan 0,1–5,0; Sedang 5,0–10,0; Lebat 10,0–20; Sangat Lebat > 20 mm/jam. Nilai batas masuk kelas yang lebih rendah (tabel BMKG di kajian STMKG: sedang 5,1–10,0).
- **Awan**: BMKG tidak mempublikasikan ambang okta untuk istilah prakiraan, sehingga dipakai kelas jumlah awan WMO (WMO-No. 49 Vol. II, Code Table D-8: FEW 1–2, SCT 3–4, BKN 5–7, OVC 8): Cerah 0–2, Cerah Berawan 3–4, Berawan 5–7, Berawan Tebal 8 okta. Perlu dikonfirmasi ke pedoman stasiun bila ada.

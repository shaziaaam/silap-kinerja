# Parameter Pengamatan (Form Nasional BMKGSoft v2)

Dokumen ini disusun berdasarkan ketentuan revisi SILAP-Kinerja (9 Oktober 2026), Peraturan Kepala BMKG No. 4 Tahun 2016, dan form nasional BMKGSoft v2 (Input Data > Klimatologi > tab FDIH).

## 1. Aturan Umum & Keputusan Final
- **Foto:** Hanya 2 kali sehari pada slot **07.00 WIB** (shift pagi) dan **17.00 WIB** (shift siang). Slot jam lain tanpa field foto.
- **Approval:** Penyelia meng-ACC **hanya per triwulan** per pegawai. Aksi revisi per entri observasi dipertahankan sebagai jalur pengecualian. ACC triwulan diblokir jika ada observasi pegawai berstatus revisi.
- **Fenologi:** Telah dihapus total dari seluruh aplikasi.
- **Penyimpanan Foto:** Menggunakan interface `PhotoStorageInterface` (driver `local` untuk development, `drive` ke Shared Drive Google Workspace instansi via Service Account).
- **Nilai 9999:** Sistem nasional memakai `9999` untuk data tidak diukur / opsional / baris nonaktif. Di database disimpan NULL, dicetak `9999` abu-abu di PDF dan CSV.
- **Field Dihitung App:** Selisih Tinggi Air = Sebelum − Dibaca; Penguapan Open Pan = Selisih + CH Diukur; Penguapan Piche = Sekarang − Sebelum.
- **Field Dihitung Nasional:** RH Sangkar & Assman, T Rata Air, Counter Rata (dicetak label "otomatis" di PDF).

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
   - TBK (°C) — Input (Padanan AWS: `TA_meas`)
   - TBB (°C) — Input (Validasi: TBB ≤ TBK)
   - RH (%) — Dihitung sistem nasional (Padanan AWS: `RH_meas`)

2. **Kartu 2. Angin (0,5 m & 10 m):**
   - Counter Sebelum (km) — Terisi dari entri sebelumnya (bisa diedit)
   - Counter Dibaca (km) — Input
   - Counter Rata (km/jam) — Dihitung sistem nasional
   - Kecepatan saat Pengamatan 10 m — Input (Padanan AWS: `WS_meas` m/s dan `ws_knot` knot)

3. **Kartu 3. OP Penguapan:**
   - Tinggi Air Sebelum (mm) — Terisi otomatis (bisa diedit)
   - Tinggi Air Dibaca (mm) — Input
   - Selisih Tinggi Air (mm) — Dihitung app (Sebelum − Dibaca)
   - T Air Maks (°C) — Input
   - T Air Min (°C) — Input (Validasi: Min ≤ Maks)
   - T Rata Air (°C) — Dihitung sistem nasional
   - CH Diukur (mm) — Input dari penakar hujan
   - Penguapan Open Pan (mm) — Dihitung app (Selisih + CH Diukur)

4. **Kartu 4. Psikrometer Assman (Bertingkat 5, 10, 20, 50, 100, 150, 200 cm):**
   - TBK (°C) & TBB (°C) — Input (Validasi: TBB ≤ TBK tiap tinggi)
   - RH (%) — Dihitung sistem nasional

5. **Kartu 5. Piche Evaporimeter:**
   - Pembacaan Sebelum (cm³) — Terisi otomatis (bisa diedit)
   - Pembacaan Sekarang (cm³) — Input
   - Penguapan Piche (cm³) — Dihitung app (Sekarang − Sebelum)

6. **Kartu 6. Pengamatan Kualitatif:**
   - Keadaan Tanah — Dropdown dari master `parameter_options` (Basah, Kering, Lembab)
   - Keadaan Hujan — Dropdown dari master `parameter_options` (Ringan, Sedang, Lebat, Tidak Ada Hujan)
   - Keterangan AGM 1-B — Teks opsional

7. **Kartu 7. Suhu Tanah (Kedalaman 0, 2, 5, 10, 20, 50, 100 cm):**
   - Masing-masing Berumput dan Gundul (°C)
   - Baris kedalaman 2 cm dinonaktifkan di app dan dicetak `9999` di PDF/CSV sesuai kondisi stasiun

---

## 4. Kartu 8 (Alat di Luar Tab FDIH)
- **Jumlah Awan:** 0–8 okta (`JAM_PENUH`)
- **Penglihatan Mendatar (Jarak Pandang):** km (`JAM_PENUH`)
- **Arah & Kecepatan Angin:** Derajat & m/s / knot (`JAM_PENUH`, AWS: `WD_meas`, `WS_meas`, `ws_knot`)
- **Curah Hujan Ombrometer:** mm per jam (`JAM_PENUH`, AWS: `rainHourly`, `RainDaily`)
- **Campbell-Stokes:** 0,0–1,0 jam per jam (`JAM_PENUH`)
- **Gunn-Bellani:** Skala buret (`HARIAN_0700`, AWS: `SR_Max`, koefisien default 20.8 kal/cm²)
- **Microbarograf:** Tekanan udara pias (`HARIAN_0700`, AWS: `PA_QFE`, `PA_QFF`)
- **Termograf:** Suhu pias (`HARIAN_0700`, AWS: `TA_meas`, `TA_Min`, `TA_Max`)
- **Penakar Hujan Hellmann:** Pias (`HARIAN_0700`, nonaktif default)
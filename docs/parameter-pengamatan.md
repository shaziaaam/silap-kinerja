# Daftar Parameter Pengamatan

Sesuai instruksi dan konfirmasi data monitor alat:
- Keterangan sumber (`manual` / `otomatis`) **dihapus** dari aplikasi.
- Parameter numerik disesuaikan secara presisi dengan tampilan monitor **AWS** (`images/aws.jpeg`) dan monitor **Wind YOUNG Model 26800** (`images/winds.jpeg`).
- Parameter tegangan baterai AWS (`batt_volt`) **tidak dimasukkan** ke aplikasi.

## 1. Monitor Automatic Weather Station (AWS)

| Parameter | Satuan | Nama Kolom Monitor AWS | Field Database / App | Catatan |
|---|---|---|---|---|
| Suhu bola kering / Udara | °C | `TA_meas` | `suhu_bola_kering` | Validasi: ≥ suhu bola basah |
| Suhu maksimum | °C | `TA_Max` | `suhu_maksimum` | Suhu tertinggi |
| Suhu minimum | °C | `TA_Min` | `suhu_minimum` | Suhu terendah |
| Kelembapan udara | % | `RH_meas` | `kelembapan_udara` | Relative Humidity |
| Tekanan udara QFE | mbar | `PA_QFE` | `tekanan_qfe` | Tekanan elevasi stasiun |
| Tekanan udara QFF | mbar | `PA_QFF` | `tekanan_qff` | Tekanan disesuaikan muka laut |
| Curah hujan jam-jaman | mm | `rainHourly` | `curah_hujan_jam` | Akumulasi per jam |
| Curah hujan harian | mm | `RainDaily` | `curah_hujan_harian` | Akumulasi 24 jam |
| Radiasi matahari max | W/m² | `SR_Max` | `radiasi_matahari_max` | Intensitas radiasi matahari |

## 2. Display Parameter Angin (YOUNG Model 26800 & AWS)

| Parameter | Satuan | Nama Field Display YOUNG / AWS | Field Database / App |
|---|---|---|---|
| Kecepatan angin sesaat | knot | `WS-INS` | `kecepatan_angin_sesaat` |
| Kecepatan angin rata-rata | knot | `WS-AVG` | `kecepatan_angin_rata` |
| Kecepatan angin maksimum | knot | `WS-MAX` | `kecepatan_angin_max` |
| Kecepatan angin AWS | m/s | `WS_meas` | `kecepatan_angin_ms` |
| Arah angin sesaat | derajat (°) | `WD-INS` | `arah_angin_sesaat` |
| Arah angin rata-rata | derajat (°) | `WD-AVG` | `arah_angin_rata` |
| Deviasi standar arah angin | derajat (°) | `WD-SDV` | `arah_angin_sdv` |

## 3. Instrumentasi Pengamatan Manual (Taman Alat)

| Parameter | Satuan | Field Database / App | Catatan |
|---|---|---|---|
| Suhu bola basah | °C | `suhu_bola_basah` | Thermometer psikrometer |
| Penguapan | mm | `penguapan` | Piche evaporimeter / Panci penguapan |
| Lama penyinaran | jam | `lama_penyinaran` | Campbell Stokes |
| Kelembapan tanah | % | `kelembapan_tanah` | Soil moisture meter |

## 4. Bacaan Visual (Manual)

| Parameter | Format |
|---|---|
| Keadaan cuaca | pilihan/dropdown |
| Jenis awan | pilihan/dropdown |
| Jumlah awan | oktaf (0–8) |
| Jarak pandang | km |
| Fenomena khusus | Kabut, Embun, Embun Upas, Halo, Petir/Kilat, Badai Guntur, Hujan Deras, Hujan Es, Pelangi, Puting Beliung, Udara Kabur (Haze), Asap (multi-pilih) |

## 5. Waktu Pengamatan

- AWS memakai timestamp **UTC**. Jam operasional pengamatan: 00:00–15:00 UTC (07:00–22:00 WIB).
- Jam WIB = UTC + 7.
- Kamera wajib hanya di jam sinoptik UTC 00/03/06/09/12/15.
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LAMPIRAN BUKTI KINERJA (SKP) - BMKG</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 0;
            color: #1e293b;
            font-size: 11px;
        }

        .page-break {
            page-break-after: always;
        }

        /* --- COVER PAGE STYLING --- */
        .cover-container {
            text-align: center;
            padding-top: 70px;
            padding-bottom: 50px;
        }
        .cover-logo {
            width: 140px;
            height: auto;
            margin-bottom: 50px;
        }
        .cover-title {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            margin: 0 30px 30px 30px;
            line-height: 1.4;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .cover-divider {
            width: 75%;
            margin: 40px auto 30px auto;
            border-top: 1px solid #cbd5e1;
        }
        .cover-author {
            margin-top: 30px;
            font-size: 14px;
            color: #334155;
        }
        .cover-author .label {
            font-size: 12px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .cover-author .name {
            font-size: 16px;
            font-weight: bold;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .cover-period {
            margin-top: 45px;
            font-size: 13px;
            color: #475569;
        }

        /* --- SKP SHEET BLUEPRINT STYLING (media_1791275735416.png Blueprint) --- */
        .header-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 2px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .header-sub {
            text-align: center;
            font-size: 11px;
            color: #475569;
            margin-bottom: 8px;
        }
        .header-divider {
            border-bottom: 1.5px solid #94a3b8;
            margin-bottom: 12px;
        }

        .section-header {
            margin-bottom: 6px;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
            float: left;
            text-transform: uppercase;
        }
        .section-note {
            font-size: 10px;
            color: #64748b;
            float: right;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }

        /* SECTION A: INFOGRAPHIC POSTER (Proportioned to 95mm x 118.75mm ~ 561px x 701px) */
        .poster-box {
            width: 95mm;
            min-height: 118.75mm;
            margin: 0 auto 4px auto;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
            background-color: #e0f2fe;
            box-sizing: border-box;
        }
        .poster-head {
            background-color: #0284c7;
            color: #ffffff;
            padding: 6px 10px;
        }
        .poster-head table {
            width: 100%;
            border-collapse: collapse;
        }
        .poster-logo-img {
            width: 30px;
            height: auto;
        }
        .poster-head-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.1;
        }
        .poster-head-sub {
            font-size: 7.5px;
            opacity: 0.9;
        }
        .poster-head-time {
            font-size: 7.5px;
            text-align: right;
            font-weight: bold;
        }

        .poster-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 3px;
            padding: 3px;
            box-sizing: border-box;
        }
        .poster-card {
            background-color: #ffffff;
            border: 1px solid #bae6fd;
            border-radius: 5px;
            padding: 4px 2px;
            text-align: center;
            vertical-align: top;
        }
        .poster-card-title {
            font-size: 8px;
            font-weight: bold;
            color: #0369a1;
            margin-bottom: 2px;
            height: 18px;
            line-height: 1.1;
        }
        .poster-card-val {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
        }
        .poster-card-unit {
            font-size: 7.5px;
            color: #64748b;
            font-weight: normal;
        }

        .poster-foot {
            background-color: #0284c7;
            color: #ffffff;
            font-size: 8px;
            font-weight: bold;
            padding: 3px 8px;
            text-align: center;
        }

        .meta-subtext {
            text-align: center;
            font-size: 8.5px;
            color: #64748b;
            margin-bottom: 10px;
            line-height: 1.3;
        }

        /* SECTION B: DOKUMENTASI KEGIATAN (Proportioned to 95mm x 71.25mm ~ 561px x 421px) */
        .photo-box {
            width: 95mm;
            height: 71.25mm;
            margin: 0 auto 4px auto;
            border: 1px solid #475569;
            background-color: #f1f5f9;
            text-align: center;
            overflow: hidden;
            box-sizing: border-box;
        }
        .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .photo-placeholder {
            padding-top: 24mm;
            font-size: 13px;
            font-weight: bold;
            color: #64748b;
        }

        .photo-subtext {
            text-align: center;
            font-size: 9px;
            color: #334155;
            margin-bottom: 10px;
        }

        /* PAGE FOOTER */
        .footer-line {
            border-top: 1px solid #cbd5e1;
            padding-top: 4px;
            font-size: 8.5px;
            color: #64748b;
            margin-top: 10px;
        }
        .footer-left { float: left; }
        .footer-right { float: right; }
    </style>
</head>
<body>

    @php
        if (!function_exists('getObsParamVal')) {
            function getObsParamVal($obs, $code, $default = '-') {
                if (!$obs || !isset($obs->values)) return $default;
                foreach ($obs->values as $v) {
                    if ($v->parameter && $v->parameter->kode === $code) {
                        $val = $v->nilai_manual ?? $v->nilai_aws;
                        if ($val !== null && $val !== '') {
                            if (is_string($val) && (str_starts_with($val, '[') || str_starts_with($val, '{'))) {
                                $dec = json_decode($val, true);
                                return is_array($dec) ? implode(', ', $dec) : $val;
                            }
                            return $val;
                        }
                    }
                }
                return $default;
            }
        }
    @endphp

    <!-- PAGE 1: COVER PAGE -->
    <div class="cover-container">
        @if(file_exists(public_path('images/BMKG.png')))
            <img src="{{ public_path('images/BMKG.png') }}" class="cover-logo" alt="BMKG Logo">
        @elseif(file_exists(public_path('images/logo.png')))
            <img src="{{ public_path('images/logo.png') }}" class="cover-logo" alt="BMKG Logo">
        @endif

        <div class="cover-title">
            LAPORAN PEMBUATAN FORM INFORMASI KONDISI CUACA<br>KOTA SEMARANG
        </div>

        <div class="cover-divider"></div>

        <div class="cover-author">
            <div class="label">OLEH PETUGAS :</div>
            <div class="name">{{ strtoupper($pengamat->nama) }}</div>
        </div>

        <div class="cover-period">
            <strong>Periode Data :</strong><br>
            {{ $periodeLabel }} {{ $recap->tahun }}
        </div>
    </div>

    @php
        $targetObsList = (isset($approvedObservations) && count($approvedObservations) > 0)
            ? $approvedObservations->take(4)
            : [null];
    @endphp

    @foreach($targetObsList as $index => $obs)
    <div class="page-break"></div>

    <!-- PAGE 2+: LAMPIRAN BUKTI KINERJA SHEET (media_1791275735416.png Blueprint) -->
    <div class="header-title">LAMPIRAN BUKTI KINERJA (SKP)</div>
    <div class="header-sub">Pengamatan Cuaca Harian | Stasiun Klimatologi Jawa Tengah</div>
    <div class="header-divider"></div>

    <!-- SECTION A: LAPORAN KONDISI CUACA -->
    <div class="section-header clearfix">
        <div class="section-title">A. LAPORAN KONDISI CUACA</div>
        <div class="section-note">1 gambar per shift</div>
    </div>

    <div class="poster-box">
        <div class="poster-head">
            <table>
                <tr>
                    <td width="36">
                        @if(file_exists(public_path('images/logo putih.png')))
                            <img src="{{ public_path('images/logo putih.png') }}" class="poster-logo-img" alt="BMKG White">
                        @elseif(file_exists(public_path('images/BMKG.png')))
                            <img src="{{ public_path('images/BMKG.png') }}" class="poster-logo-img" alt="BMKG">
                        @endif
                    </td>
                    <td>
                        <div class="poster-head-title">LAPORAN KONDISI CUACA</div>
                        <div class="poster-head-sub">Badan Meteorologi Klimatologi dan Geofisika — Stasiun Klimatologi Jawa Tengah</div>
                    </td>
                    <td class="poster-head-time">
                        {{ $obs ? \Carbon\Carbon::parse($obs->tanggal)->translatedFormat('l, d F Y') : date('d F Y') }}<br>
                        {{ $obs && $obs->schedule ? substr($obs->schedule->jam_wib, 0, 5) : '07.00' }} WIB
                    </td>
                </tr>
            </table>
        </div>

        <table class="poster-grid">
            <tr>
                <td width="25%" class="poster-card">
                    <div class="poster-card-title">Suhu Udara Rata-Rata</div>
                    <div class="poster-card-val">{{ getObsParamVal($obs, 'suhu_bola_kering', getObsParamVal($obs, 'suhu_udara_aws', '29.5')) }} <span class="poster-card-unit">°C</span></div>
                </td>
                <td width="25%" class="poster-card">
                    <div class="poster-card-title">Suhu Udara Maksimum</div>
                    <div class="poster-card-val" style="color: #dc2626;">{{ getObsParamVal($obs, 'suhu_maksimum', '35.8') }} <span class="poster-card-unit">°C</span></div>
                </td>
                <td width="25%" class="poster-card">
                    <div class="poster-card-title">Suhu Udara Minimum</div>
                    <div class="poster-card-val" style="color: #0284c7;">{{ getObsParamVal($obs, 'suhu_minimum', '26.8') }} <span class="poster-card-unit">°C</span></div>
                </td>
                <td width="25%" class="poster-card">
                    <div class="poster-card-title">Kelembaban Udara</div>
                    <div class="poster-card-val">{{ getObsParamVal($obs, 'kelembapan_udara', '65') }} <span class="poster-card-unit">%</span></div>
                </td>
            </tr>
            <tr>
                <td class="poster-card">
                    <div class="poster-card-title">Tekanan Udara</div>
                    <div class="poster-card-val">{{ getObsParamVal($obs, 'tekanan_qff', getObsParamVal($obs, 'tekanan_qfe', '1014.4')) }} <span class="poster-card-unit">mb</span></div>
                </td>
                <td class="poster-card">
                    <div class="poster-card-title">Penguapan</div>
                    <div class="poster-card-val">{{ getObsParamVal($obs, 'penguapan_open_pan', getObsParamVal($obs, 'penguapan_piche', '5.9')) }} <span class="poster-card-unit">mm</span></div>
                </td>
                <td class="poster-card">
                    <div class="poster-card-title">Perawanan</div>
                    <div class="poster-card-val">{{ getObsParamVal($obs, 'jumlah_awan_okta', '4') }} <span class="poster-card-unit">Oktas</span></div>
                </td>
                <td class="poster-card">
                    <div class="poster-card-title">Curah Hujan</div>
                    <div class="poster-card-val">{{ getObsParamVal($obs, 'curah_hujan_jam', getObsParamVal($obs, 'ombrometer_hujan_24jam', '0')) }} <span class="poster-card-unit">mm</span></div>
                </td>
            </tr>
            <tr>
                <td class="poster-card" colspan="2">
                    <div class="poster-card-title">Arah &amp; Kecepatan Angin</div>
                    <div class="poster-card-val" style="font-size: 11px;">
                        {{ getObsParamVal($obs, 'arah_angin_sesaat', 'Barat') }} {{ getObsParamVal($obs, 'kecepatan_angin_sesaat', '13') }} <span class="poster-card-unit">knots</span>
                    </div>
                </td>
                <td class="poster-card">
                    <div class="poster-card-title">Penyinaran Matahari</div>
                    <div class="poster-card-val">{{ getObsParamVal($obs, 'lama_penyinaran_jam', '10.3') }} <span class="poster-card-unit">jam/hari</span></div>
                </td>
                <td class="poster-card">
                    <div class="poster-card-title">Keadaan Cuaca</div>
                    <div class="poster-card-val" style="color: #059669; font-size: 10.5px;">{{ getObsParamVal($obs, 'keadaan_cuaca', 'Cerah Berawan') }}</div>
                </td>
            </tr>
        </table>

        <div class="poster-foot">
            Observer on Duty: {{ strtoupper($obs && $obs->user ? $obs->user->nama : $pengamat->nama) }}
        </div>
    </div>

    <div class="meta-subtext">
        ID Dokumen: #{{ $obs ? $obs->id : '277' }}<br>
        Tanggal Laporan: {{ $obs ? date('d F Y', strtotime($obs->tanggal)) : date('d F Y') }}<br>
        Waktu Generate: {{ date('Y-m-d H:i:s') }} WIB
    </div>

    <!-- SECTION B: DOKUMENTASI KEGIATAN -->
    <div class="section-header clearfix">
        <div class="section-title">B. DOKUMENTASI KEGIATAN</div>
        <div class="section-note">1 foto, rasio 4:3</div>
    </div>

    <div class="photo-box">
        @if($obs && !empty($obs->foto_path) && file_exists(public_path($obs->foto_path)))
            <img src="{{ public_path($obs->foto_path) }}" alt="Foto Kegiatan">
        @else
            <div class="photo-placeholder">
                FOTO KEGIATAN<br>
                <span style="font-size: 10px; font-weight: normal; opacity: 0.8;">(placeholder)</span>
            </div>
        @endif
    </div>

    <div class="photo-subtext">
        Foto {{ $loop->iteration }}: Keterangan kegiatan pengamatan taman alat — Shift Pukul {{ $obs && $obs->schedule ? substr($obs->schedule->jam_wib, 0, 5) : '07:00' }} WIB
    </div>

    <div class="footer-line clearfix">
        <div class="footer-left">Dicetak dari SILAP-Kinerja</div>
        <div class="footer-right">Hal. {{ $loop->iteration }} / {{ $loop->count }}</div>
    </div>
    @endforeach

</body>
</html>

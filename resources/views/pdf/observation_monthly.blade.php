<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Observasi Bulanan Stasiun - BMKG</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #1e293b;
            line-height: 1.3;
            margin: 15px;
        }
        .kop {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 6px;
            margin-bottom: 12px;
        }
        .kop h2 {
            margin: 0;
            font-size: 13px;
            color: #0369a1;
            text-transform: uppercase;
        }
        .kop h3 {
            margin: 2px 0 0 0;
            font-size: 11px;
            font-weight: normal;
        }
        .kop p {
            margin: 2px 0 0 0;
            font-size: 8px;
            color: #64748b;
        }
        .title {
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 10px;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 2px 0;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .data-table th, .data-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 5px;
            text-align: center;
        }
        .data-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #0f172a;
            font-size: 9px;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .footer {
            margin-top: 20px;
            width: 100%;
        }
        .footer td {
            text-align: center;
            vertical-align: top;
        }
    </style>
</head>
<body>
    <div class="kop">
        <h2>BADAN METEOROLOGI, KLIMATOLOGI, DAN GEOFISIKA</h2>
        <h3>STASIUN KLIMATOLOGI JAWA TENGAH</h3>
        <p>JL. Siliwangi No. 291 Semarang - Telp. (024) 7601633</p>
    </div>

    <div class="title">REKAPITULASI PENYELENGGARAAN OBSERVASI BULANAN</div>

    <table class="meta-table">
        <tr>
            <td width="15%"><strong>Bulan / Tahun</strong></td>
            <td width="35%">: {{ $namaBulan }} {{ $tahun }}</td>
            <td width="15%"><strong>Mode Laporan</strong></td>
            <td width="35%">: {{ $mode === 'stasiun' ? 'Seluruh Stasiun' : 'Pegawai: ' . ($pegawai->nama ?? '-') }}</td>
        </tr>
        <tr>
            <td><strong>Total Approved</strong></td>
            <td>: {{ count($dailySummary) }} Hari Terdata</td>
            <td><strong>Hari Hujan (≥0.5 mm)</strong></td>
            <td>: {{ $totalHariHujan }} Hari</td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th width="8%">Tanggal</th>
                <th width="18%">Jumlah Slot Input</th>
                <th width="22%">Total Curah Hujan Harian</th>
                <th width="18%">Kriteria Hari Hujan</th>
                <th width="17%">Status Data</th>
                <th width="17%">Approval</th>
            </tr>
        </thead>
        <tbody>
            @foreach($dailySummary as $row)
                <tr>
                    <td><strong>{{ sprintf('%02d', $row['tgl']) }}</strong></td>
                    <td>{{ $row['slotCount'] }} / 16 Slot</td>
                    <td>{{ $row['totalRain'] !== null ? number_format($row['totalRain'], 1) . ' mm' : '-' }}</td>
                    <td>
                        @if($row['isRainyDay'])
                            <span style="color: #0369a1; font-weight: bold;">Ya (Hari Hujan)</span>
                        @else
                            <span style="color: #64748b;">Bukan Hari Hujan</span>
                        @endif
                    </td>
                    <td>
                        @if($row['isComplete'])
                            <span style="color: #166534; font-weight: bold;">Lengkap (16 Jam)</span>
                        @else
                            <span style="color: #991b1b; font-weight: bold;">Tidak Lengkap</span>
                        @endif
                    </td>
                    <td><span style="color: #15803d; font-weight: bold;">Approved</span></td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="footer">
        <tr>
            <td width="50%">
                <p>Mengetahui,<br>Penyelia Stasiun Klimatologi</p>
                <br><br><br>
                <p><strong><u>Penyelia BMKG</u></strong><br>NIP. 198505102010011002</p>
            </td>
            <td width="50%">
                <p>Semarang, {{ $tanggalCetak }}<br>Pengamat Meteorologi/Klimatologi,</p>
                <br><br><br>
                <p><strong><u>{{ $pegawai->nama ?? 'Tim Pengamat Stasiun' }}</u></strong><br>NIP. {{ $pegawai->nip ?? '-' }}</p>
            </td>
        </tr>
    </table>
</body>
</html>

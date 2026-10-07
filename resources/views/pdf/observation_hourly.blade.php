<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Observasi Cuaca Per Jam - BMKG</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #1e293b;
            line-height: 1.4;
            margin: 20px;
        }
        .kop {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .kop h2 {
            margin: 0;
            font-size: 14px;
            color: #0369a1;
            text-transform: uppercase;
        }
        .kop h3 {
            margin: 2px 0 0 0;
            font-size: 12px;
            font-weight: normal;
        }
        .kop p {
            margin: 2px 0 0 0;
            font-size: 9px;
            color: #64748b;
        }
        .title {
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 12px;
            text-transform: uppercase;
            text-decoration: underline;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 12px;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 3px 0;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .data-table th, .data-table td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            text-align: left;
        }
        .data-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            font-size: 10px;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .footer {
            margin-top: 30px;
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

    <div class="title">CATATAN PENGAMATAN CUACA PER JAM</div>

    <table class="meta-table">
        <tr>
            <td width="18%"><strong>Tanggal Pengamatan</strong></td>
            <td width="32%">: {{ \Carbon\Carbon::parse($observation->tanggal)->translatedFormat('d F Y') }}</td>
            <td width="18%"><strong>Pengamat</strong></td>
            <td width="32%">: {{ $observation->user->nama ?? '-' }} (NIP: {{ $observation->user->nip ?? '-' }})</td>
        </tr>
        <tr>
            <td><strong>Waktu Pengamatan</strong></td>
            <td>: Pukul {{ substr($observation->schedule->jam_wib ?? '07:00', 0, 5) }} WIB ({{ substr($observation->schedule->jam_utc ?? '00:00', 0, 5) }} UTC)</td>
            <td><strong>Status Pengamatan</strong></td>
            <td>: <span style="text-transform: uppercase; font-weight: bold;">{{ $observation->status_pengamatan }}</span></td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th width="5%" class="text-center">No</th>
                <th width="45%">Parameter Pengamatan</th>
                <th width="12%" class="text-center">Satuan</th>
                <th width="19%" class="text-center">Nilai AWS</th>
                <th width="19%" class="text-center">Nilai Manual</th>
            </tr>
        </thead>
        <tbody>
            @php $no = 1; @endphp
            @foreach($parameters as $param)
                @php
                    $valObj = $observation->values->where('parameter_id', $param->id)->first();
                    $awsVal = $valObj->nilai_aws ?? '-';
                    $manualVal = $valObj->nilai_manual ?? '-';
                @endphp
                <tr>
                    <td class="text-center">{{ $no++ }}</td>
                    <td>{{ $param->label }}</td>
                    <td class="text-center">{{ $param->satuan ?? '-' }}</td>
                    <td class="text-center font-mono">{{ $param->sumber === 'manual' ? '-' : $awsVal }}</td>
                    <td class="text-center font-mono">{{ $param->sumber === 'aws' ? '-' : $manualVal }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($observation->alasan_batal)
        <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 8px; border-radius: 4px; margin-bottom: 15px; color: #9f1239;">
            <strong>Catatan Pembatalan/Hambatan:</strong> {{ $observation->alasan_batal }}
        </div>
    @endif

    <table class="footer">
        <tr>
            <td width="50%"></td>
            <td width="50%">
                <p>Semarang, {{ \Carbon\Carbon::parse($observation->tanggal)->translatedFormat('d F Y') }}<br>Pengamat Meteorologi/Klimatologi,</p>
                <br><br><br>
                <p><strong><u>{{ $observation->user->nama ?? '-' }}</u></strong><br>NIP. {{ $observation->user->nip ?? '-' }}</p>
            </td>
        </tr>
    </table>
</body>
</html>

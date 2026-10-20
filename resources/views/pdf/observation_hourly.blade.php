<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Pengamatan Cuaca - BMKG</title>
    <style>
        @page { size: A4 portrait; margin: 14mm 14mm 12mm 14mm; }
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 8.5px; color: #1e293b; margin: 0; }

        .kop { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 10px; }
        .kop .i1 { font-size: 11px; font-weight: bold; color: #0369a1; }
        .kop .i2 { font-size: 10px; font-weight: bold; }
        .kop .i3 { font-size: 7.5px; color: #64748b; }
        .judul { text-align: center; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }

        .meta { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .meta td { padding: 2px 0; font-size: 8.5px; vertical-align: top; }
        .meta td.l { width: 13%; color: #475569; }

        .tabel { width: 100%; border-collapse: collapse; }
        .tabel th { background: #e2e8f0; border: 1px solid #94a3b8; padding: 3px 4px; font-size: 7.5px; text-align: center; }
        .tabel td { border: 1px solid #cbd5e1; padding: 2.5px 4px; font-size: 8px; vertical-align: middle; }
        .tabel tr.kartu td { background: #dbeafe; color: #0f172a; font-weight: bold; font-size: 8px; border-color: #94a3b8; }
        .tabel tr { page-break-inside: avoid; }
        .c { text-align: center; }
        .nilai { text-align: center; font-weight: bold; font-size: 8.5px; }
        .na { color: #94a3b8; font-weight: normal; }
        .auto { color: #15803d; font-style: italic; font-weight: normal; }
        .pre { color: #475569; }
        .ket { font-size: 7px; color: #475569; }
        .ket.ketik { color: #0369a1; font-weight: bold; }

        .legend { font-size: 7px; color: #475569; margin-top: 5px; line-height: 1.4; }
        .batal { background: #fffbeb; border: 1px solid #fde68a; padding: 5px; border-radius: 3px; color: #92400e; margin-bottom: 6px; }
        .ttd { width: 100%; margin-top: 14px; page-break-inside: avoid; }
        .ttd td { text-align: center; font-size: 8.5px; vertical-align: top; }
        .foot { position: fixed; bottom: -6mm; left: 0; right: 0; font-size: 6.5px; color: #94a3b8; }
    </style>
</head>
<body>
@php
    $jam = $jamWib ?? substr($observation->schedule->jam_wib ?? '07:00', 0, 5);
    $shift = $observation->shift ?? ((int) substr($jam, 0, 2) < 15 ? 'pagi' : 'siang');
    $agm = in_array($jam, ['07:30', '13:30', '17:30'], true);
    $judulKartu = [
        1 => '1. Psikrometer Sangkar (1,2 m)',
        2 => '2. Angin',
        3 => '3. OP Penguapan',
        4 => '4. Psikrometer Assman',
        5 => '5. Piche Penguapan',
        6 => '6. Keadaan Tanah, Keadaan Hujan & Keterangan AGM 1-B',
        7 => '7. Suhu Tanah',
        8 => 'Pengamatan di Luar Tab FDIH',
    ];
    $kelompok = $parameters->groupBy(fn ($p) => $p->kartu ?? 8)->sortKeys();
    $no = 0;
@endphp

    <div class="foot">
        Dicetak dari SILAP-Kinerja {{ now()->format('d/m/Y H:i') }} WIB &middot;
        status: {{ $observation->status_approval === 'approved' ? 'Terverifikasi' : 'Belum diverifikasi' }} &middot;
        urutan baris sama dengan urutan input BMKGSoft v2
    </div>

    <div class="kop">
        <div class="i1">BADAN METEOROLOGI, KLIMATOLOGI, DAN GEOFISIKA</div>
        <div class="i2">STASIUN KLIMATOLOGI JAWA TENGAH</div>
        <div class="i3">Jl. Siliwangi No.&nbsp;291, Semarang 50145 &middot; Telp. (024) 7609016</div>
    </div>

    <div class="judul">Laporan Pengamatan Cuaca Shift {{ ucfirst($shift) }}</div>

    <table class="meta">
        <tr>
            <td class="l">Stasiun</td><td>: Stasiun Klimatologi Jawa Tengah ({{ config('silap.stasiun_id', '96835') }})</td>
            <td class="l">Pengamat</td><td>: {{ $observation->user->nama ?? '-' }}</td>
        </tr>
        <tr>
            <td class="l">Tanggal</td><td>: {{ \Carbon\Carbon::parse($observation->tanggal)->locale('id')->isoFormat('dddd, D MMMM YYYY') }}</td>
            <td class="l">NIP</td><td>: {{ $observation->user->nip ?? '-' }}</td>
        </tr>
        <tr>
            <td class="l">Jam</td><td>: {{ str_replace(':', '.', $jam) }} WIB ({{ str_replace(':', '.', $jam) }} WS) &middot; {{ $agm ? 'AGM 1-B (tab FDIH)' : 'jam penuh' }}</td>
            <td class="l">Shift</td><td>: {{ ucfirst($shift) }}</td>
        </tr>
    </table>

    @if($observation->alasan_batal)
        <div class="batal"><b>Kondisi khusus:</b> {{ $observation->alasan_batal }}</div>
    @endif

    <table class="tabel">
        <thead>
            <tr>
                <th style="width:6%">No</th>
                <th style="width:40%">Parameter</th>
                <th style="width:13%">Nilai</th>
                <th style="width:10%">Satuan</th>
                <th style="width:17%">Nilai AWS</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
        @foreach($kelompok as $k => $daftar)
            <tr class="kartu"><td colspan="6">{{ $judulKartu[$k] ?? 'Kartu ' . $k }}</td></tr>
            @foreach($daftar as $p)
                @php
                    $no++;
                    $manual = $nilai[$p->kode]['manual'] ?? null;
                    $aws = $nilai[$p->kode]['aws'] ?? null;
                    $ada = $manual !== null && $manual !== '';
                    $teksBebas = in_array($p->tipe_input, ['text', 'select'], true);

                    if (!$p->is_active) {
                        $isi = '<span class="na">9999</span>'; $ket = 'Nonaktif'; $kelasKet = '';
                    } elseif ($p->sifat === 'dihitung_nasional') {
                        $isi = '<span class="auto">otomatis</span>'; $ket = 'Otomatis (nasional)'; $kelasKet = '';
                    } elseif ($p->sifat === 'dihitung_app') {
                        $isi = $ada ? e($manual) : '<span class="na">&ndash;</span>'; $ket = 'Dihitung, cek'; $kelasKet = '';
                    } elseif ($p->sifat === 'sebelum') {
                        $isi = $ada ? '<span class="pre">' . e($manual) . '</span>' : '<span class="na">9999</span>'; $ket = 'Bacaan sebelumnya'; $kelasKet = '';
                    } elseif ($p->sumber === 'aws') {
                        $isi = '<span class="na">&ndash;</span>'; $ket = 'Hanya dari AWS'; $kelasKet = '';
                    } elseif ($ada) {
                        $isi = e($manual); $ket = 'Diketik'; $kelasKet = 'ketik';
                    } else {
                        $isi = $teksBebas ? '<span class="na">&ndash;</span>' : '<span class="na">9999</span>';
                        $ket = $teksBebas ? 'Kosong' : 'Tidak diukur'; $kelasKet = '';
                    }

                    $isiAws = ($aws === null || $aws === '') ? '<span class="na">&ndash;</span>'
                        : e($aws) . ' <span class="ket">' . e($p->kode_aws) . '</span>';
                    if ($p->kode_aws === 'WS_meas' && is_numeric($aws)) {
                        $isiAws .= '<br><span class="ket">= ' . number_format((float) $aws * 1.94384, 1, '.', '') . ' knot</span>';
                    }
                @endphp
                <tr>
                    <td class="c">{{ $no }}</td>
                    <td>{{ $p->label }}</td>
                    <td class="nilai">{!! $isi !!}</td>
                    <td class="c">{{ $teksBebas ? '' : $p->satuan }}</td>
                    <td class="c">{!! $isiAws !!}</td>
                    <td class="ket {{ $kelasKet }}">{{ $ket }}</td>
                </tr>
            @endforeach
        @endforeach
        </tbody>
    </table>

    <div class="legend">
        <b>Keterangan:</b> Diketik = salin ke BMKGSoft v2 sesuai urutan nomor &middot; Otomatis (nasional) = dihitung sistem nasional, tidak perlu diketik &middot;
        Dihitung, cek = dihitung aplikasi untuk mencocokkan &middot; Bacaan sebelumnya = terisi dari pembacaan terakhir &middot; 9999 = tidak diukur &middot; nilai AWS dibaca dari monitor AWS.
    </div>

    <table class="ttd">
        <tr>
            <td style="width:50%"></td>
            <td style="width:50%">
                Semarang, {{ \Carbon\Carbon::parse($observation->tanggal)->locale('id')->isoFormat('D MMMM YYYY') }}<br>Pengamat,
                <div style="height:40px"></div>
                <b><u>{{ $observation->user->nama ?? '-' }}</u></b><br>NIP. {{ $observation->user->nip ?? '-' }}
            </td>
        </tr>
    </table>
</body>
</html>

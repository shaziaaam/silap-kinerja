<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LAMPIRAN BUKTI KINERJA (SKP) - {{ $pengamat->nama }}</title>
    <style>
        @page { size: A4 portrait; margin: 11mm 15mm 16mm 15mm; }
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #1e293b; font-size: 11px; }
        .page-break { page-break-after: always; }

        /* Sampul (sama dengan versi sebelumnya) */
        .cover { text-align: center; padding-top: 100px; }
        .cover-logo { width: 180px; height: auto; margin-bottom: 60px; }
        .cover-title { font-size: 28px; font-weight: bold; color: #0f172a; margin: 0 10px; line-height: 1.4; text-transform: uppercase; letter-spacing: .5px; }
        .cover-divider { width: 85%; margin: 50px auto 40px auto; border-top: 1px solid #94a3b8; }
        .cover-label { font-size: 15px; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 8px; }
        .cover-name { font-size: 22px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
        .cover-nip { font-size: 14px; color: #475569; margin-top: 6px; }
        .cover-period { margin-top: 10px; font-size: 16px; color: #334155; font-style: italic; line-height: 1.6; }

        /* Lembar lampiran bukti kinerja per shift */
        .header-title { text-align: center; font-size: 15px; font-weight: bold; color: #0f172a; }
        .header-sub { text-align: center; font-size: 10px; color: #475569; margin-top: 4px; }
        .header-divider { border-top: 1.5px solid #94a3b8; margin: 8px 0 12px 0; }
        .section-title { font-size: 11px; font-weight: bold; color: #0f172a; margin: 0 0 7px 0; text-transform: uppercase; }
        .figure { text-align: center; }
        .poster { width: 115mm; height: auto; border: 1px solid #cbd5e1; }
        .photo { width: 115mm; height: auto; border: 1px solid #94a3b8; }
        .kosong { width: 115mm; margin: 0 auto; border: 1px dashed #94a3b8; color: #94a3b8; padding: 40px 0; text-align: center; }
        .caption { text-align: center; font-size: 9px; font-style: italic; color: #475569; margin-top: 5px; }
        .gap { height: 14px; }

        .footer { position: absolute; bottom: -9mm; left: 0; right: 0; border-top: 1px solid #cbd5e1; padding-top: 3px; font-size: 8.5px; color: #64748b; }
        .footer .r { float: right; }
    </style>
</head>
<body>
@php
    $logo = collect([public_path('images/brand/bmkg.png'), public_path('images/brand/logo.png')])->first(fn ($p) => file_exists($p));
    $hari = fn ($t) => \Carbon\Carbon::parse($t)->locale('id')->isoFormat('dddd, D MMMM YYYY');
@endphp

    <div class="cover">
        @if($logo)<img src="{{ $logo }}" class="cover-logo" alt="BMKG">@endif

        <div class="cover-title">Laporan Pembuatan Form<br>Informasi Kondisi Cuaca<br>Kota Semarang</div>

        <div class="cover-divider"></div>

        <div class="cover-label">Oleh Petugas :</div>
        <div class="cover-name">{{ $pengamat->nama }}</div>
        <div class="cover-nip">NIP. {{ $pengamat->nip ?? '-' }}</div>

        <div class="cover-divider"></div>

        <div class="cover-period">Periode Data<br>{{ $periodeData }}</div>
    </div>

@foreach($lampiran as $l)
    @php
        $label = $l['shift'] === 'pagi' ? 'Shift Pagi' : 'Shift Siang';
        $jam = str_replace(':', '.', $l['jam']);
    @endphp
    <div class="page-break"></div>

    <div class="header-title">LAMPIRAN BUKTI KINERJA (SKP)</div>
    <div class="header-sub">Pengamatan Cuaca Harian ({{ $label }}, Pukul {{ $jam }} WIB) | {{ $hari($l['obs']->tanggal) }} | Stasiun Klimatologi Jawa Tengah</div>
    <div class="header-divider"></div>

    <div class="section-title">A. Laporan Kondisi Cuaca : {{ $label }} (Pukul {{ $jam }} WIB)</div>
    <div class="figure">
        @if($l['gambarShift'])
            <img src="{{ $l['gambarShift'] }}" class="poster" alt="Laporan Kondisi Cuaca">
        @else
            <div class="kosong">Gambar laporan kondisi cuaca tidak tersedia</div>
        @endif
    </div>

    <div class="gap"></div>

    <div class="section-title">B. Dokumentasi Kegiatan Observasi (Taman Alat)</div>
    <div class="figure">
        @if($l['foto'])
            <img src="{{ $l['foto'] }}" class="photo" alt="Foto Kegiatan">
        @else
            <div class="kosong">Foto kegiatan tidak tersedia</div>
        @endif
    </div>
    <div class="caption">
        Foto: Dokumentasi Pengamatan Taman Alat : {{ $label }} (Pukul {{ $jam }} WIB)
        @if($l['obs']->foto_sumber === 'galeri') &middot; diunggah dari galeri (darurat) @endif
    </div>

    {{-- Page number: cover is page 1, each attachment sheet is one page --}}
    <div class="footer">
        Dicetak otomatis dari SILAP-Kinerja Staklim Jawa Tengah
        <span class="r">Hal. {{ $loop->iteration + 1 }} / {{ count($lampiran) + 1 }}</span>
    </div>
@endforeach
</body>
</html>

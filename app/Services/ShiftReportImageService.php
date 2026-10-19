<?php

namespace App\Services;

use App\Models\Observation;
use Carbon\Carbon;
use Exception;

/**
 * Gambar "Laporan Kondisi Cuaca" per shift: template PNG desain B diisi dengan
 * GD (FreeType) dan font Poppins. Koordinat, ukuran, dan warna ada di
 * config('silap.laporan_shift'), dikalibrasi dari contoh terisi.
 */
class ShiftReportImageService
{
    protected string $fontSemiBold;
    protected string $fontMedium;
    protected string $fontRegular;

    public function __construct()
    {
        $this->fontSemiBold = resource_path('fonts/Poppins-SemiBold.ttf');
        $this->fontMedium = resource_path('fonts/Poppins-Medium.ttf');
        $this->fontRegular = resource_path('fonts/Poppins-Regular.ttf');
    }

    /**
     * Smaller JPEG copy of the shift image for the SKP PDF. The 4488 px original is far
     * more than an A4 box needs and would cost DomPDF ~100 MB per page, so it is scaled
     * down and cached per shift; the cache key changes whenever that shift's data does.
     */
    public function jpegUntukPdf(Observation $observation, int $lebar = 1100): string
    {
        $shiftKey = ($observation->shift ?: ($observation->schedule?->shift ?? 'pagi')) === 'pagi' ? 'pagi' : 'siang';
        $tanggal = Carbon::parse($observation->tanggal)->format('Y-m-d');
        $versi = Observation::whereDate('tanggal', $tanggal)->where('shift', $shiftKey)
            ->selectRaw('COUNT(*) as n, MAX(updated_at) as t')->first();

        $path = storage_path('app/pdf_cache/shift_' . $tanggal . '_' . $shiftKey . '_'
            . sha1($lebar . '|' . $versi?->n . '|' . $versi?->t) . '.jpg');
        if (is_file($path)) {
            return $path;
        }

        $image = $this->buatGambar($observation);
        $kecil = imagescale($image, $lebar);
        imagedestroy($image);

        @mkdir(dirname($path), 0755, true);
        imagejpeg($kecil, $path, 88);
        imagedestroy($kecil);

        return $path;
    }

    /** Draw the filled-in report onto the template and return the GD image. */
    protected function buatGambar(Observation $observation)
    {
        ini_set('memory_limit', '512M');

        $cfg = config('silap.laporan_shift');

        // Shift comes from observations.shift (set on create/update); fall back to the
        // Schedule accessor so legacy rows without the column still resolve correctly.
        $shift = !empty($observation->shift)
            ? $observation->shift
            : ($observation->schedule?->shift ?? 'pagi');
        $isPagi = $shift === 'pagi';
        $shiftKey = $isPagi ? 'pagi' : 'siang';

        $templatePath = resource_path($cfg['template'][$shiftKey]);
        if (!file_exists($templatePath)) {
            throw new Exception("Template image not found: " . $templatePath);
        }

        $image = imagecreatefrompng($templatePath);
        if (!$image) {
            throw new Exception("Failed to load template PNG image.");
        }
        imagealphablending($image, true);

        $colorValue = $this->hexColor($image, $cfg['warna']['nilai']);
        $colorLabel = $this->hexColor($image, $cfg['warna']['label']);
        $colorAccent = $this->hexColor($image, $cfg['warna']['aksen'][$shiftKey]);

        // 1. Header: "Senin, 05 Oktober 2026  ·  07.00 WIB" — one image per shift, so the
        // time shown is the shift's photo slot (07.00 pagi, 17.00 siang).
        $jamFoto = config("silap.shifts.{$shiftKey}.foto_slot", $isPagi ? '07:00' : '17:00');
        $jamWib = str_replace(':', '.', $jamFoto) . ' WIB';
        $tgl = Carbon::parse($observation->tanggal ?? now())->locale('id');
        $this->drawHeader($image, $cfg['header'], $tgl->isoFormat('dddd, DD MMMM YYYY'), $jamWib, $colorValue, $colorLabel, $colorAccent);

        // 2. "Observer  <nama>" centred as one group
        $observerName = $observation->user ? $observation->user->nama : 'Pengamat BMKG';
        $o = $cfg['observer'];
        $this->eraseBox($image, $o['hapus_label']);
        $this->drawLabelValuePair(
            $image, $o['pusat_x'], $o['baseline'], $o['jeda'],
            'Observer', $this->fontRegular, $o['ukuran_label'], $colorLabel,
            $observerName, $this->fontSemiBold, $o['ukuran_nama'], $colorValue
        );

        $data = $this->dataShift($observation, $shiftKey);
        $getVal = fn (string $key) => $data[$key] ?? '-';

        // 3. Value cards: value + unit centred in the card
        $k = $cfg['kartu'];
        foreach ($k['isian'] as $isian) {
            $this->eraseBox($image, [
                $isian['pusat_x'] - $k['lebar_hapus'], $isian['baseline'] - $k['hapus_atas'],
                $isian['pusat_x'] + $k['lebar_hapus'], $isian['baseline'] + $k['hapus_bawah'],
            ]);
            $this->drawLabelValuePair(
                $image, $isian['pusat_x'], $isian['baseline'], $k['jeda_satuan'],
                $getVal($isian['data']), $this->fontSemiBold, $k['ukuran_nilai'], $colorValue,
                $isian['satuan'], $this->fontRegular, $k['ukuran_satuan'], $colorLabel
            );
        }

        // Wind card label becomes "Angin dari <arah>"
        $a = $cfg['angin_label'];
        $arahAngin = $getVal('arah_angin');
        $this->eraseBox($image, $a['hapus']);
        $this->drawCenteredText($image, $this->fontRegular, $a['ukuran'], "Angin dari {$arahAngin}", $a['pusat_x'], $a['baseline'], $colorLabel);

        // 4. Keadaan Cuaca (wide card); the "Keadaan Cuaca" caption stays from the template
        $c = $cfg['cuaca'];
        $keadaanCuaca = $getVal('keadaan_cuaca');
        $this->eraseBox($image, [
            $c['pusat_x'] - $c['lebar_hapus'], $c['baseline'] - $c['hapus_atas'],
            $c['pusat_x'] + $c['lebar_hapus'], $c['baseline'] + $c['hapus_bawah'],
        ]);
        $this->drawCenteredText($image, $this->fontSemiBold, $c['ukuran'], $keadaanCuaca, $c['pusat_x'], $c['baseline'], $colorValue);
        $this->drawIkonCuaca($image, $cfg['ikon_cuaca'], $keadaanCuaca);

        // 5. Footer: "ID Dokumen  LKC-YYYYMMDD-P|S" centred as one group
        $d = $cfg['dokumen'];
        $docId = 'LKC-' . $tgl->format('Ymd') . '-' . ($isPagi ? 'P' : 'S');
        $this->eraseBox($image, $d['hapus_label']);
        $this->drawLabelValuePair(
            $image, $d['pusat_x'], $d['baseline'], $d['jeda'],
            'ID Dokumen', $this->fontRegular, $d['ukuran_label'], $colorLabel,
            $docId, $this->fontMedium, $d['ukuran_nilai'], $colorValue
        );

        // Timestamps after the pre-printed "Waktu input" and "Laporan dibuat" labels
        $w = $cfg['waktu'];
        $waktuInput = ($data['waktu_input'] ?? now())->isoFormat('YYYY-MM-DD HH:mm:ss') . ' WIB';
        $waktuDibuat = now()->isoFormat('YYYY-MM-DD HH:mm:ss') . ' WIB';
        $this->drawTextAtInkLeft($image, $this->fontMedium, $w['ukuran'], $waktuInput, $w['input_x'], $w['baseline'], $colorValue);
        $this->drawTextAtInkLeft($image, $this->fontMedium, $w['ukuran'], $waktuDibuat, $w['dibuat_x'], $w['baseline'], $colorValue);

        return $image;
    }

    /**
     * Display values for one shift, gathered from every observation on that date and
     * shift (one image summarises the whole shift, not one slot).
     *
     * @return array<string, mixed> card key => display string, plus 'waktu_input' (Carbon)
     */
    public function dataShift(Observation $observation, string $shiftKey): array
    {
        $tanggal = Carbon::parse($observation->tanggal)->format('Y-m-d');

        $obsShift = Observation::with(['schedule', 'values.parameter'])
            ->whereDate('tanggal', $tanggal)
            ->where('shift', $shiftKey)
            ->where('status_pengamatan', 'lengkap')
            ->get()
            ->sortBy(fn ($o) => (string) $o->schedule?->jam_wib)
            ->values();

        if ($obsShift->isEmpty()) {
            $obsShift = collect([$observation->loadMissing(['schedule', 'values.parameter'])]);
        }

        // Readings of one parameter through the shift, in slot order (manual first, AWS as fallback).
        $seri = function (string $kode) use ($obsShift) {
            $out = [];
            foreach ($obsShift as $o) {
                foreach ($o->values as $v) {
                    if ($v->parameter?->kode === $kode) {
                        $val = $v->nilai_manual ?? $v->nilai_aws;
                        if (is_numeric($val)) {
                            $out[] = (float) $val;
                        }
                    }
                }
            }
            return $out;
        };
        $aws = function (string $kode) use ($obsShift) {
            $out = [];
            foreach ($obsShift as $o) {
                foreach ($o->values as $v) {
                    if ($v->parameter?->kode === $kode && is_numeric($v->nilai_aws)) {
                        $out[] = (float) $v->nilai_aws;
                    }
                }
            }
            return $out;
        };
        $terakhir = fn (array $s) => $s ? end($s) : null;
        $rata = fn (array $s) => $s ? array_sum($s) / count($s) : null;
        $f1 = fn (?float $v) => $v === null ? '-' : number_format($v, 1, '.', '');
        // "0" and "2.5" rather than "0.0" and "2.50", like the reference sample
        $fRingkas = fn (?float $v) => $v === null ? '-' : rtrim(rtrim(number_format($v, 1, '.', ''), '0'), '.');

        $tbk = $seri('suhu_bola_kering');
        $maks = $aws('suhu_udara_maks') ?: $tbk;
        $min = $aws('suhu_udara_min') ?: $tbk;
        $awanTerakhir = $terakhir($seri('jumlah_awan_okta'));
        // Rain is summed from the configured first slot of the rain day (default 07.00).
        $slotHujanAwal = (int) \App\Models\Setting::get('hujan_slot_awal', 7);
        $hujanJam = [];
        foreach ($obsShift as $o) {
            if ((int) substr((string) $o->schedule?->jam_wib, 0, 2) < $slotHujanAwal) {
                continue;
            }
            foreach ($o->values as $v) {
                $val = $v->parameter?->kode === 'curah_hujan_ombrometer' ? ($v->nilai_manual ?? $v->nilai_aws) : null;
                if (is_numeric($val)) {
                    $hujanJam[] = (float) $val;
                }
            }
        }
        $angin = $terakhir($seri('kecepatan_angin_jam')) ?? $terakhir($seri('kecepatan_angin_10m'));
        $arah = $terakhir($seri('arah_angin_derajat'));

        // Microbarograf is read once a day at 07.00, so the siang shift uses that day's reading.
        $tekanan = $terakhir($seri('tekanan_udara_barograf'));
        if ($tekanan === null) {
            $tekanan = Observation::query()
                ->whereDate('observations.tanggal', $tanggal)
                ->join('observation_values', 'observation_values.observation_id', '=', 'observations.id')
                ->join('instrument_parameters', 'instrument_parameters.id', '=', 'observation_values.parameter_id')
                ->where('instrument_parameters.kode', 'tekanan_udara_barograf')
                ->selectRaw('COALESCE(observation_values.nilai_manual, observation_values.nilai_aws) as v')
                ->first()?->v;
            $tekanan = is_numeric($tekanan) ? (float) $tekanan : null;
        }

        // The photo-slot observation is the shift's reference input time.
        $jamFoto = config("silap.shifts.{$shiftKey}.foto_slot");
        $obsFoto = $obsShift->first(fn ($o) => substr((string) $o->schedule?->jam_wib, 0, 5) === $jamFoto);
        $waktuInput = ($obsFoto ?? $obsShift->last())->created_at;

        return [
            'suhu_rata' => $f1($rata($tbk)),
            'suhu_maks' => $f1($maks ? max($maks) : null),
            'suhu_min' => $f1($min ? min($min) : null),
            'kelembaban' => ($rh = $rata($aws('rh_sangkar'))) === null ? '-' : (string) (int) round($rh),
            'tekanan' => $f1($tekanan),
            'penguapan' => $f1($terakhir($seri('penguapan_openpan'))),
            'awan' => $awanTerakhir === null ? '-' : (string) (int) $awanTerakhir,
            'hujan' => $hujanJam ? $fRingkas(array_sum($hujanJam)) : '-',
            'penyinaran' => ($sun = $seri('lama_penyinaran_jam')) ? $f1(array_sum($sun)) : '-',
            'angin_knot' => $angin === null ? '-' : $this->meterPerDetikKeKnot((string) $angin),
            'arah_angin' => $arah === null ? '-' : $this->arahMataAngin((string) $arah),
            'keadaan_cuaca' => $this->keadaanCuaca($awanTerakhir, $terakhir($hujanJam)),
            'waktu_input' => $waktuInput ? Carbon::parse($waktuInput) : null,
        ];
    }

    /**
     * Weather condition from the latest cloud cover (okta) and hourly rain, using the
     * BMKG forecast terms in config('silap.keadaan_cuaca').
     */
    public function keadaanCuaca(?float $okta, ?float $hujanJamTerakhir): string
    {
        $cfg = config('silap.keadaan_cuaca');

        if ($hujanJamTerakhir !== null && $hujanJamTerakhir >= $cfg['hujan_min']) {
            foreach ($cfg['hujan'] as [$batasAtas, $nama]) {
                if ($batasAtas === null || $hujanJamTerakhir <= $batasAtas) {
                    return $nama;
                }
            }
        }

        if ($okta === null) {
            return '-';
        }
        foreach ($cfg['awan'] as [$oktaMaks, $nama]) {
            if ($okta <= $oktaMaks) {
                return $nama;
            }
        }

        return end($cfg['awan'])[1];
    }

    /**
     * Swap the weather card icon to match the condition, reusing the sun / cloud / rain
     * icons drawn on the other cards of the same template. Both spots sit on a white
     * card, so a square copy blends seamlessly.
     */
    protected function drawIkonCuaca($image, array $cfg, string $keadaan): void
    {
        $ikon = str_starts_with($keadaan, 'Hujan') ? 'hujan' : ($cfg['peta'][$keadaan] ?? null);
        if ($ikon === null) {
            return; // keep the template's sun-and-cloud icon
        }

        $gelap = $ikon === 'awan_gelap';
        [$sx, $sy] = $cfg['sumber'][$gelap ? 'awan' : $ikon];
        [$tx, $ty] = $cfg['tujuan'];
        $r = $cfg['setengah_sisi'];
        $sisi = $r * 2 + 1;

        $potong = imagecreatetruecolor($sisi, $sisi);
        imagecopy($potong, $image, 0, 0, $sx - $r, $sy - $r, $sisi, $sisi);

        if ($gelap) {
            // Darken only the cloud strokes: anything clearly off the circle's pastel fill.
            $isi = imagecolorsforindex($potong, imagecolorat($potong, $r, 12));
            $f = $cfg['faktor_gelap'];
            for ($y = 0; $y < $sisi; $y++) {
                for ($x = 0; $x < $sisi; $x++) {
                    $c = imagecolorsforindex($potong, imagecolorat($potong, $x, $y));
                    $beda = abs($c['red'] - $isi['red']) + abs($c['green'] - $isi['green']) + abs($c['blue'] - $isi['blue']);
                    if ($beda > 24 && $c['red'] + $c['green'] + $c['blue'] < 720) {
                        imagesetpixel($potong, $x, $y, imagecolorallocate(
                            $potong,
                            (int) round($c['red'] * $f),
                            (int) round($c['green'] * $f),
                            (int) round($c['blue'] * $f)
                        ));
                    }
                }
            }
        }

        imagecopy($image, $potong, $tx - $r, $ty - $r, 0, 0, $sisi, $sisi);
        imagedestroy($potong);
    }

    /**
     * Convert a wind speed in m/s (AWS WS_meas) to knots, matching the "knots" unit
     * on the card, rounded to whole knots like the reference sample ("13 knots").
     * Non-numeric input is passed through unchanged.
     */
    protected function meterPerDetikKeKnot(string $ms): string
    {
        if (!is_numeric($ms)) {
            return $ms;
        }

        return (string) (int) round((float) $ms * 1.94384);
    }

    /**
     * Convert a wind bearing in degrees to an Indonesian compass name.
     * Non-numeric input (e.g. the "-" placeholder) is passed through unchanged.
     */
    protected function arahMataAngin(string $derajat): string
    {
        if (!is_numeric($derajat)) {
            return $derajat;
        }

        $arah = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
        $index = (int) round(((float) $derajat % 360) / 45) % 8;

        return $arah[$index];
    }

    protected function hexColor($image, string $hex): int
    {
        $hex = ltrim($hex, '#');

        return imagecolorallocate($image, hexdec(substr($hex, 0, 2)), hexdec(substr($hex, 2, 2)), hexdec(substr($hex, 4, 2)));
    }

    /**
     * Ink extent of a string relative to the drawing origin: [left offset, width].
     */
    protected function inkBox(string $font, float $size, string $text): array
    {
        $bbox = imagettfbbox($size, 0, $font, $text);

        return [$bbox[0], $bbox[2] - $bbox[0]];
    }

    /**
     * Remove pre-printed template text. Each row is filled by interpolating the
     * pixels just outside the box, so white cards and the vertical background
     * gradient both stay seamless.
     */
    protected function eraseBox($image, array $box): void
    {
        [$x0, $y0, $x1, $y1] = $box;
        $span = max(1, $x1 - $x0);

        for ($y = $y0; $y <= $y1; $y++) {
            $l = imagecolorsforindex($image, imagecolorat($image, $x0 - 1, $y));
            $r = imagecolorsforindex($image, imagecolorat($image, $x1 + 1, $y));

            if ($l === $r) {
                imageline($image, $x0, $y, $x1, $y, imagecolorallocate($image, $l['red'], $l['green'], $l['blue']));
                continue;
            }

            for ($x = $x0; $x <= $x1; $x++) {
                $t = ($x - $x0) / $span;
                imagesetpixel($image, $x, $y, imagecolorallocate(
                    $image,
                    (int) round($l['red'] + ($r['red'] - $l['red']) * $t),
                    (int) round($l['green'] + ($r['green'] - $l['green']) * $t),
                    (int) round($l['blue'] + ($r['blue'] - $l['blue']) * $t)
                ));
            }
        }
    }

    protected function drawTextAtInkLeft($image, string $font, float $size, string $text, int $inkLeft, int $baseline, int $color): void
    {
        [$offset] = $this->inkBox($font, $size, $text);
        imagettftext($image, $size, 0, $inkLeft - $offset, $baseline, $color, $font, $text);
    }

    protected function drawCenteredText($image, string $font, float $size, string $text, int $centerX, int $baseline, int $color): void
    {
        [, $width] = $this->inkBox($font, $size, $text);
        $this->drawTextAtInkLeft($image, $font, $size, $text, (int) round($centerX - $width / 2), $baseline, $color);
    }

    /**
     * Draw two strings on one baseline, separated by a fixed ink gap, with the
     * pair centred on $centerX (e.g. value + unit, or label + value).
     */
    protected function drawLabelValuePair(
        $image, int $centerX, int $baseline, int $gap,
        string $first, string $firstFont, float $firstSize, int $firstColor,
        string $second, string $secondFont, float $secondSize, int $secondColor
    ): void {
        [, $w1] = $this->inkBox($firstFont, $firstSize, $first);
        [, $w2] = $this->inkBox($secondFont, $secondSize, $second);

        $left = (int) round($centerX - ($w1 + $gap + $w2) / 2);
        $this->drawTextAtInkLeft($image, $firstFont, $firstSize, $first, $left, $baseline, $firstColor);
        $this->drawTextAtInkLeft($image, $secondFont, $secondSize, $second, $left + $w1 + $gap, $baseline, $secondColor);
    }

    /**
     * Date (value colour) · dot (label colour) · time (accent colour), centred as a group.
     */
    protected function drawHeader($image, array $h, string $date, string $time, int $colorValue, int $colorDot, int $colorAccent): void
    {
        [, $wDate] = $this->inkBox($this->fontSemiBold, $h['ukuran_tanggal'], $date);
        [, $wTime] = $this->inkBox($this->fontMedium, $h['ukuran_jam'], $time);
        $dot = $h['titik_radius'] * 2;

        $left = (int) round($h['pusat_x'] - ($wDate + $h['jeda'] + $dot + $h['jeda'] + $wTime) / 2);
        $this->drawTextAtInkLeft($image, $this->fontSemiBold, $h['ukuran_tanggal'], $date, $left, $h['baseline'], $colorValue);

        $dotX = $left + $wDate + $h['jeda'] + $h['titik_radius'];
        imagefilledellipse($image, $dotX, $h['titik_y'], $dot, $dot, $colorDot);

        $this->drawTextAtInkLeft($image, $this->fontMedium, $h['ukuran_jam'], $time, $left + $wDate + $h['jeda'] + $dot + $h['jeda'], $h['baseline'], $colorAccent);
    }
}

<?php

namespace App\Services;

use App\Models\Observation;
use Carbon\Carbon;
use Exception;

class ShiftReportImageService
{
    protected string $fontBold;
    protected string $fontSemiBold;
    protected string $fontMedium;
    protected string $fontRegular;

    public function __construct()
    {
        $this->fontBold = resource_path('fonts/Poppins-Bold.ttf');
        $this->fontSemiBold = resource_path('fonts/Poppins-SemiBold.ttf');
        $this->fontMedium = resource_path('fonts/Poppins-Medium.ttf');
        $this->fontRegular = resource_path('fonts/Poppins-Regular.ttf');
    }

    /**
     * Generate shift weather report image using PHP GD (FreeType) & Poppins font.
     *
     * @param Observation $observation
     * @return string Path to generated PNG image
     */
    public function generate(Observation $observation): string
    {
        ini_set('memory_limit', '512M');

        $jamUtc = $observation->schedule ? $observation->schedule->jam_utc : '00:00';
        $jamWib = $observation->schedule ? $observation->schedule->jam_wib : '07.00 WIB';

        $isPagi = str_contains($jamWib, '07.') || $jamUtc === '00:00' || intval(substr($jamUtc, 0, 2)) < 7;
        
        $templatePath = base_path($isPagi ? 'images/shift/shift pagi.png' : 'images/shift/shift siang.png');

        if (!file_exists($templatePath)) {
            throw new Exception("Template image not found: " . $templatePath);
        }

        $image = imagecreatefrompng($templatePath);
        if (!$image) {
            throw new Exception("Failed to load template PNG image.");
        }

        // Palette
        $colorDark = imagecolorallocate($image, 30, 41, 59);       // #1E293B (Slate 800)
        $colorMuted = imagecolorallocate($image, 100, 116, 139);   // #64748B (Slate 500)
        $colorFaint = imagecolorallocate($image, 148, 163, 184);   // #94A3B8 (Slate 400)
        $colorBlue = imagecolorallocate($image, 37, 99, 235);      // #2563EB (Blue 600)
        $colorOrange = imagecolorallocate($image, 234, 88, 12);    // #EA580C (Orange 600)
        $colorWhite = imagecolorallocate($image, 255, 255, 255);   // #FFFFFF (Pure White)

        $accentColor = $isPagi ? $colorBlue : $colorOrange;

        // 1. Header Date & Time
        // Format: "Senin, 05 Oktober 2026  ·  07.00 WIB"
        $tgl = Carbon::parse($observation->tanggal ?? now())->locale('id');
        $dateStr = $tgl->isoFormat('DD MMMM YYYY');
        $dayStr = $tgl->isoFormat('dddd');
        $datePart = "{$dayStr}, {$dateStr}";
        $dotPart = "  ·  ";
        $timePart = $jamWib;

        $fontSizeHeader = 68;
        $this->drawHeaderDateTime($image, $fontSizeHeader, $datePart, $dotPart, $timePart, 2244, 1200, $colorDark, $accentColor);

        // 2. Observer Name (aligned right after pre-printed "Observer")
        $observerName = $observation->user ? $observation->user->nama : 'Pengamat BMKG';
        imagettftext($image, 44, 0, 2060, 1445, $colorDark, $this->fontBold, $observerName);

        // Map Observation Values
        $obsValues = [];
        if ($observation->relationLoaded('values') && $observation->values) {
            foreach ($observation->values as $v) {
                $obsValues[$v->parameter_key] = $v->nilai;
            }
        }

        $getVal = function ($key, $default = '-') use ($obsValues) {
            if (isset($obsValues[$key]) && $obsValues[$key] !== null && $obsValues[$key] !== '') {
                return (string) $obsValues[$key];
            }
            return (string) $default;
        };

        // Grid 3x4 Layout Columns
        $col1X = 868;
        $col2X = 2244;
        $col3X = 3620;
        $col23X = 2932;

        // Baselines for Card Values
        $row1Y = 2260;
        $row2Y = 3130;
        $row3Y = 3990;

        // Erase pre-printed faint units inside white cards
        // Row 1
        imagefilledrectangle($image, $col1X - 450, 2180, $col1X + 450, 2330, $colorWhite);
        imagefilledrectangle($image, $col2X - 450, 2180, $col2X + 450, 2330, $colorWhite);
        imagefilledrectangle($image, $col3X - 450, 2180, $col3X + 450, 2330, $colorWhite);

        // Row 2
        imagefilledrectangle($image, $col1X - 450, 3050, $col1X + 450, 3200, $colorWhite);
        imagefilledrectangle($image, $col2X - 450, 3050, $col2X + 450, 3200, $colorWhite);
        imagefilledrectangle($image, $col3X - 450, 3050, $col3X + 450, 3200, $colorWhite);

        // Row 3
        imagefilledrectangle($image, $col1X - 450, 3910, $col1X + 450, 4060, $colorWhite);
        imagefilledrectangle($image, $col2X - 450, 3910, $col2X + 450, 4060, $colorWhite);
        imagefilledrectangle($image, $col3X - 450, 3910, $col3X + 450, 4060, $colorWhite);

        // Row 4 Col 1 (Angin)
        imagefilledrectangle($image, $col1X - 450, 4670, $col1X + 450, 4880, $colorWhite);
        imagefilledrectangle($image, $col1X - 450, 4910, $col1X + 450, 5050, $colorWhite);

        // Row 4 Col 2&3 (Cuaca)
        imagefilledrectangle($image, $col23X - 850, 4650, $col23X + 850, 5050, $colorWhite);

        // Render Values & Units
        // Row 1: Temperatures
        $suhuKering = $getVal('suhu_bola_kering', '29.5');
        $suhuMax = $getVal('suhu_maksimum', '35.8');
        $suhuMin = $getVal('suhu_minimum', '26.8');

        $this->drawCardValueWithUnit($image, $suhuKering, '°C', $col1X, $row1Y, $colorDark, $colorMuted);
        $this->drawCardValueWithUnit($image, $suhuMax, '°C', $col2X, $row1Y, $colorDark, $colorMuted);
        $this->drawCardValueWithUnit($image, $suhuMin, '°C', $col3X, $row1Y, $colorDark, $colorMuted);

        // Row 2: Kelembaban, Tekanan, Penguapan
        $kelembapan = $getVal('kelembapan_udara', '65');
        $tekanan = $getVal('tekanan_qff', $getVal('tekanan_qfe', '1014.4'));
        $penguapan = $getVal('penguapan', '5.9');

        $this->drawCardValueWithUnit($image, $kelembapan, '%', $col1X, $row2Y, $colorDark, $colorMuted);
        $this->drawCardValueWithUnit($image, $tekanan, 'mb', $col2X, $row2Y, $colorDark, $colorMuted);
        $this->drawCardValueWithUnit($image, $penguapan, 'mm', $col3X, $row2Y, $colorDark, $colorMuted);

        // Row 3: Awan, Rain, Sun
        $jumlahAwan = $getVal('jumlah_awan', '4');
        $curahHujan = $getVal('curah_hujan_harian', $getVal('curah_hujan_jam', '0'));
        $penyinaran = $getVal('lama_penyinaran', '10.3');

        $this->drawCardValueWithUnit($image, $jumlahAwan, 'oktas', $col1X, $row3Y, $colorDark, $colorMuted);
        $this->drawCardValueWithUnit($image, $curahHujan, 'mm', $col2X, $row3Y, $colorDark, $colorMuted);
        $this->drawCardValueWithUnit($image, $penyinaran, 'jam/hari', $col3X, $row3Y, $colorDark, $colorMuted);

        // Row 4 Col 1: Angin
        $kecepatanAngin = $getVal('kecepatan_angin_sesaat', $getVal('kecepatan_angin_rata', '13'));
        $arahAngin = $getVal('arah_angin_sesaat', 'Barat');
        
        $this->drawCardValueWithUnit($image, $kecepatanAngin, 'knots', $col1X, 4770, $colorDark, $colorMuted);
        $this->drawCenteredText($image, $this->fontMedium, 38, "Angin dari {$arahAngin}", $col1X, 4960, $colorMuted);

        // Row 4 Col 2&3: Keadaan Cuaca
        $keadaanCuaca = $getVal('keadaan_cuaca', 'Cerah Berawan');
        $this->drawCenteredText($image, $this->fontBold, 92, $keadaanCuaca, $col23X, 4770, $colorDark);
        $this->drawCenteredText($image, $this->fontMedium, 38, "Keadaan Cuaca", $col23X, 4960, $colorMuted);

        // 3. Footer Document ID & Timestamps
        $tglCode = $tgl->format('Ymd');
        $shiftCode = $isPagi ? 'P' : 'S';
        $docId = "LKC-{$tglCode}-{$shiftCode}";
        imagettftext($image, 38, 0, 2200, 5250, $colorDark, $this->fontBold, $docId);

        $waktuInput = $observation->created_at ? Carbon::parse($observation->created_at)->isoFormat('YYYY-MM-DD HH:mm:ss') . " WIB" : now()->isoFormat('YYYY-MM-DD HH:mm:ss') . " WIB";
        $waktuDibuat = now()->isoFormat('YYYY-MM-DD HH:mm:ss') . " WIB";

        // Align right after pre-printed "Waktu input" and "Laporan dibuat"
        imagettftext($image, 34, 0, 1540, 5420, $colorDark, $this->fontSemiBold, $waktuInput);
        imagettftext($image, 34, 0, 3540, 5420, $colorDark, $this->fontSemiBold, $waktuDibuat);

        // Save generated image to storage/app/public/reports/
        $outputDirectory = storage_path('app/public/reports');
        if (!file_exists($outputDirectory)) {
            mkdir($outputDirectory, 0755, true);
        }

        $filename = "laporan_cuaca_{$observation->id}_" . time() . ".png";
        $outputPath = "{$outputDirectory}/{$filename}";

        imagepng($image, $outputPath, 6);
        imagedestroy($image);

        return $outputPath;
    }

    protected function drawHeaderDateTime($image, float $fontSize, string $datePart, string $dotPart, string $timePart, int $centerX, int $y, int $colorDark, int $colorAccent): void
    {
        $bboxDate = imagettfbbox($fontSize, 0, $this->fontBold, $datePart);
        $wDate = abs($bboxDate[2] - $bboxDate[0]);

        $bboxDot = imagettfbbox($fontSize, 0, $this->fontBold, $dotPart);
        $wDot = abs($bboxDot[2] - $bboxDot[0]);

        $bboxTime = imagettfbbox($fontSize, 0, $this->fontBold, $timePart);
        $wTime = abs($bboxTime[2] - $bboxTime[0]);

        $totalW = $wDate + $wDot + $wTime;
        $startX = (int) ($centerX - ($totalW / 2));

        imagettftext($image, $fontSize, 0, $startX, $y, $colorDark, $this->fontBold, $datePart);
        imagettftext($image, $fontSize, 0, $startX + $wDate, $y, $colorDark, $this->fontBold, $dotPart);
        imagettftext($image, $fontSize, 0, $startX + $wDate + $wDot, $y, $colorAccent, $this->fontBold, $timePart);
    }

    protected function drawCenteredText($image, string $font, float $fontSize, string $text, int $centerX, int $y, int $color): void
    {
        $bbox = imagettfbbox($fontSize, 0, $font, $text);
        $textWidth = abs($bbox[2] - $bbox[0]);
        $x = (int) ($centerX - ($textWidth / 2));
        imagettftext($image, $fontSize, 0, $x, $y, $color, $font, $text);
    }

    protected function drawCardValueWithUnit($image, string $val, string $unit, int $centerX, int $y, int $colorVal, int $colorUnit): void
    {
        $valSize = 105;
        $unitSize = 44;

        $bboxVal = imagettfbbox($valSize, 0, $this->fontBold, $val);
        $wVal = abs($bboxVal[2] - $bboxVal[0]);

        $bboxUnit = imagettfbbox($unitSize, 0, $this->fontRegular, " " . $unit);
        $wUnit = abs($bboxUnit[2] - $bboxUnit[0]);

        $totalW = $wVal + $wUnit;
        $startX = (int) ($centerX - ($totalW / 2));

        imagettftext($image, $valSize, 0, $startX, $y, $colorVal, $this->fontBold, $val);
        imagettftext($image, $unitSize, 0, $startX + $wVal + 12, $y, $colorUnit, $this->fontRegular, " " . $unit);
    }
}

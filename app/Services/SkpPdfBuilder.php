<?php

namespace App\Services;

use App\Http\Controllers\SkpReportController;
use App\Models\Observation;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Builds the payload for the quarterly SKP evidence PDF: the cover ("Laporan Pembuatan
 * Form Informasi Kondisi Cuaca") followed by one "Lampiran Bukti Kinerja" sheet per shift
 * (Laporan Kondisi Cuaca image above, activity photo below). Approved data only.
 *
 * Shared by the controller (preview, direct download) and the ExportSkpZip job so
 * every route renders an identical document.
 */
class SkpPdfBuilder
{
    public function __construct(
        protected PdfPhotoService $photos,
        protected ShiftReportImageService $shiftImages,
    ) {
    }

    /**
     * Calendar months covered by a period key such as "T4" or "B10".
     */
    public static function monthsForPeriode(string $periodeKey): array
    {
        $map = [
            'T1' => [1, 2, 3],
            'T2' => [4, 5, 6],
            'T3' => [7, 8, 9],
            'T4' => [10, 11, 12],
            'B1' => [1], 'B2' => [2], 'B3' => [3], 'B4' => [4],
            'B5' => [5], 'B6' => [6], 'B7' => [7], 'B8' => [8],
            'B9' => [9], 'B10' => [10], 'B11' => [11], 'B12' => [12],
        ];

        return $map[$periodeKey] ?? [1, 2, 3];
    }

    /**
     * @return array<string, mixed> view data for pdf.skp_triwulan
     */
    public function dataFor(RekapSkpTriwulan $recap): array
    {
        $months = self::monthsForPeriode($recap->triwulan);
        $awal = Carbon::create($recap->tahun, min($months), 1)->format('Y-m-d');
        $akhir = Carbon::create($recap->tahun, max($months), 1)->addMonth()->format('Y-m-d');

        // SKP only reports approved data (half-open range keeps the last day on SQLite).
        $approved = Observation::with(['schedule', 'values.parameter'])
            ->where('user_id', $recap->user_id)
            ->where('status_approval', 'approved')
            ->where('tanggal', '>=', $awal)
            ->where('tanggal', '<', $akhir)
            ->get()
            ->sortBy(fn ($o) => Carbon::parse($o->tanggal)->format('Y-m-d') . ' ' . $o->schedule?->jam_wib)
            ->values();

        // One attachment sheet per shift: the shift's photo observation (07.00 pagi,
        // 17.00 siang) with its Laporan Kondisi Cuaca image above the activity photo.
        $foto = $approved->filter(fn ($o) => !empty($o->photo_ref) || !empty($o->foto_path))->values();
        $fotoJpeg = $this->photos->jpegPathMap($foto);
        $lampiran = $foto->map(fn ($o) => [
            'obs' => $o,
            'shift' => ($o->shift ?: ($o->schedule?->shift ?? 'pagi')) === 'pagi' ? 'pagi' : 'siang',
            'jam' => substr((string) $o->schedule?->jam_wib, 0, 5),
            'foto' => $fotoJpeg[$o->id] ?? null,
            'gambarShift' => $this->gambarShift($o),
        ])->all();

        $romawi = ['T1' => 'I', 'T2' => 'II', 'T3' => 'III', 'T4' => 'IV'][$recap->triwulan] ?? $recap->triwulan;
        $mulai = Carbon::parse($awal)->locale('id');
        $selesai = Carbon::parse($akhir)->subDay()->locale('id');

        return [
            'recap' => $recap,
            'pengamat' => $recap->user,
            'periodeLabel' => SkpReportController::getPeriodeLabel($recap->triwulan),
            // "Triwulan IV (01 Oktober 2026 s/d 31 Desember 2026)", as on the previous cover
            'periodeData' => "Triwulan {$romawi} (" . $mulai->isoFormat('DD MMMM YYYY') . ' s/d ' . $selesai->isoFormat('DD MMMM YYYY') . ')',
            'lampiran' => $lampiran,
            // Kept for callers/tests that inspect the photo set directly.
            'approvedObservations' => $approved,
            'photos' => $foto,
            'fotoJpeg' => $fotoJpeg,
        ];
    }

    /**
     * Performance summary. "Jadwal" is the slots of every shift the observer worked
     * (pagi 07.00-14.00 + AGM 1-B 07.30/13.30; siang 15.00-22.00 + 17.30), so the
     * percentage measures completeness of the shifts actually served.
     */
    public function ringkasan($approved): array
    {
        $slotPerShift = Schedule::all()->groupBy('shift')->map->count();
        $shiftBertugas = $approved->groupBy(fn ($o) => Carbon::parse($o->tanggal)->format('Y-m-d') . '|' . $o->shift);

        $jadwal = $shiftBertugas->sum(fn ($obs, $kunci) => $slotPerShift[explode('|', $kunci)[1]] ?? 0);
        $valid = $approved->where('status_pengamatan', 'lengkap')->count();
        $fotoTerpenuhi = $shiftBertugas->filter(fn ($obs) => $obs->contains(fn ($o) => !empty($o->photo_ref) || !empty($o->foto_path)))->count();

        return [
            'shiftPagi' => $shiftBertugas->keys()->filter(fn ($k) => str_ends_with($k, '|pagi'))->count(),
            'shiftSiang' => $shiftBertugas->keys()->filter(fn ($k) => str_ends_with($k, '|siang'))->count(),
            'jadwal' => $jadwal,
            'valid' => $valid,
            'dibatalkan' => $approved->where('status_pengamatan', 'dibatalkan')->count(),
            'kepatuhan' => $jadwal > 0 ? round(min(100, $valid / $jadwal * 100), 1) : 0,
            'fotoTerpenuhi' => $fotoTerpenuhi,
            'fotoWajib' => $shiftBertugas->count(),
            'agm1b' => $approved->filter(fn ($o) => $o->schedule?->kelompok === 'AGM1B')->count(),
        ];
    }

    protected function gambarShift(Observation $o): ?string
    {
        try {
            return $this->shiftImages->jpegUntukPdf($o);
        } catch (Throwable $e) {
            Log::warning("Gambar laporan shift untuk observasi #{$o->id} gagal dibuat: " . $e->getMessage());
            return null;
        }
    }
}

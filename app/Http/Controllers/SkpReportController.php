<?php

namespace App\Http\Controllers;

use App\Models\Observation;
use App\Models\RekapSkpTriwulan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use ZipArchive;

class SkpReportController extends Controller
{
    public static function getPeriodeLabel($triwulanKey)
    {
        $labels = [
            'T1' => 'Triwulan 1 (Jan - Mar)',
            'T2' => 'Triwulan 2 (Apr - Jun)',
            'T3' => 'Triwulan 3 (Jul - Sep)',
            'T4' => 'Triwulan 4 (Okt - Des)',
            'B1' => 'Bulan Januari',
            'B2' => 'Bulan Februari',
            'B3' => 'Bulan Maret',
            'B4' => 'Bulan April',
            'B5' => 'Bulan Mei',
            'B6' => 'Bulan Juni',
            'B7' => 'Bulan Juli',
            'B8' => 'Bulan Agustus',
            'B9' => 'Bulan September',
            'B10' => 'Bulan Oktober',
            'B11' => 'Bulan November',
            'B12' => 'Bulan Desember',
        ];
        return $labels[$triwulanKey] ?? $triwulanKey;
    }

    private function getMonthsForPeriode($periodeKey): array
    {
        $map = [
            'T1' => [1, 2, 3],
            'T2' => [4, 5, 6],
            'T3' => [7, 8, 9],
            'T4' => [10, 11, 12],
            'B1' => [1],
            'B2' => [2],
            'B3' => [3],
            'B4' => [4],
            'B5' => [5],
            'B6' => [6],
            'B7' => [7],
            'B8' => [8],
            'B9' => [9],
            'B10' => [10],
            'B11' => [11],
            'B12' => [12],
        ];
        return $map[$periodeKey] ?? [1, 2, 3];
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $usersQuery = User::where('role', 'pengamat');
        if ($user->role === 'pengamat') {
            $usersQuery->where('id', $user->id);
        }
        $users = $usersQuery->get();

        $recapsQuery = RekapSkpTriwulan::with('user')->orderBy('tanggal_generate', 'desc');
        if ($user->role === 'pengamat') {
            $recapsQuery->where('user_id', $user->id);
        }
        $recaps = $recapsQuery->paginate(15);

        // Attach human readable label to each recap item
        $recaps->getCollection()->transform(function ($item) {
            $item->periode_label = self::getPeriodeLabel($item->triwulan);
            return $item;
        });

        return Inertia::render('Supervisor/SkpReport', [
            'pengamatList' => $users,
            'recaps' => $recaps,
        ]);
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required',
            'tahun' => 'required|integer|min:2020|max:2030',
            'periode' => 'required|string',
        ]);

        $periodeKey = $validated['periode'];
        $months = $this->getMonthsForPeriode($periodeKey);

        $targetUsers = $validated['user_id'] === 'all'
            ? User::where('role', 'pengamat')->get()
            : User::where('id', $validated['user_id'])->get();

        foreach ($targetUsers as $targetUser) {
            $allApproved = Observation::where('user_id', $targetUser->id)
                ->where('status_approval', 'approved')
                ->whereYear('tanggal', $validated['tahun'])
                ->get();

            $validCount = $allApproved->filter(function ($o) use ($months) {
                $m = is_string($o->tanggal)
                    ? (int) date('n', strtotime($o->tanggal))
                    : (int) $o->tanggal->format('n');
                return in_array($m, $months, true);
            })->count();

            RekapSkpTriwulan::updateOrCreate(
                [
                    'user_id' => $targetUser->id,
                    'tahun' => $validated['tahun'],
                    'triwulan' => $periodeKey,
                ],
                [
                    'total_pengamatan_valid' => $validCount,
                    'tanggal_generate' => now(),
                ]
            );
        }

        $label = self::getPeriodeLabel($periodeKey);
        return redirect()->back()->with('message', "Rekap SKP {$label} ({$validated['tahun']}) berhasil di-generate.");
    }

    public function previewPdf(Request $request, RekapSkpTriwulan $recap)
    {
        $user = $request->user();
        if ($user->role === 'pengamat' && $recap->user_id !== $user->id) {
            abort(403, 'Akses ditolak.');
        }

        $months = $this->getMonthsForPeriode($recap->triwulan);

        $approvedObservations = Observation::with(['schedule', 'values.parameter'])
            ->where('user_id', $recap->user_id)
            ->where('status_approval', 'approved')
            ->whereYear('tanggal', $recap->tahun)
            ->whereIn(\DB::raw('MONTH(tanggal)'), $months)
            ->orderBy('tanggal', 'desc')
            ->get();

        $photos = $approvedObservations->filter(function ($o) {
            return !empty($o->foto_path);
        })->take(4);

        $pdfData = [
            'recap' => $recap,
            'pengamat' => $recap->user,
            'tanggal' => now()->translatedFormat('d F Y'),
            'periodeLabel' => self::getPeriodeLabel($recap->triwulan),
            'approvedObservations' => $approvedObservations,
            'photos' => $photos,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.skp_triwulan', $pdfData);

        return $pdf->stream('SKP_' . $recap->user->nip . '.pdf');
    }

    public function downloadPdfByParam(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'tahun' => 'required|integer',
            'periode' => 'required|string',
        ]);

        $user = $request->user();
        if ($user->role === 'pengamat' && (int)$validated['user_id'] !== $user->id) {
            abort(403, 'Akses ditolak.');
        }

        $recap = RekapSkpTriwulan::where('user_id', $validated['user_id'])
            ->where('tahun', $validated['tahun'])
            ->where('triwulan', $validated['periode'])
            ->first();

        if (!$recap) {
            return back()->withErrors(['message' => 'Belum ada rekap SKP yang di-generate untuk pegawai ini pada periode ini. Silakan klik "Hitung & Generate SKP" terlebih dahulu.']);
        }

        $recap->load('user');

        $months = $this->getMonthsForPeriode($recap->triwulan);

        $approvedObservations = Observation::with(['schedule', 'values.parameter'])
            ->where('user_id', $recap->user_id)
            ->where('status_approval', 'approved')
            ->whereYear('tanggal', $recap->tahun)
            ->whereIn(\DB::raw('MONTH(tanggal)'), $months)
            ->orderBy('tanggal', 'desc')
            ->get();

        $photos = $approvedObservations->filter(function ($o) {
            return !empty($o->foto_path);
        })->take(4);

        $pdfData = [
            'recap' => $recap,
            'pengamat' => $recap->user,
            'tanggal' => now()->translatedFormat('d F Y'),
            'periodeLabel' => self::getPeriodeLabel($recap->triwulan),
            'approvedObservations' => $approvedObservations,
            'photos' => $photos,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.skp_triwulan', $pdfData);

        return $pdf->stream('SKP_' . str_replace(' ', '_', $recap->user->nama) . '_' . $recap->user->nip . '.pdf');
    }

    public function exportZip(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'pengamat') {
            abort(403, 'Hanya Admin dan Penyelia yang dapat mengunduh paket ZIP SKP.');
        }

        $validated = $request->validate([
            'tahun' => 'required|integer',
            'periode' => 'required|string',
            'user_id' => 'nullable|string',
        ]);

        $periodeKey = $validated['periode'];
        $query = RekapSkpTriwulan::with('user')
            ->where('tahun', $validated['tahun'])
            ->where('triwulan', $periodeKey);

        if (!empty($validated['user_id']) && $validated['user_id'] !== 'all') {
            $query->where('user_id', $validated['user_id']);
        }

        $recaps = $query->get();

        if ($recaps->isEmpty()) {
            return back()->withErrors(['message' => 'Belum ada rekap SKP yang di-generate untuk periode/pegawai ini. Silakan klik Generate terlebih dahulu.']);
        }

        $userSuffix = (!empty($validated['user_id']) && $validated['user_id'] !== 'all')
            ? '_' . str_replace(' ', '_', $recaps->first()->user->nama ?? 'Pegawai')
            : '';

        $zipFileName = 'SKP_Paket_' . $periodeKey . '_' . $validated['tahun'] . $userSuffix . '.zip';
        $zipPath = storage_path('app/' . $zipFileName);

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            foreach ($recaps as $recap) {
                $pdfContent = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.skp_triwulan', [
                    'recap' => $recap,
                    'pengamat' => $recap->user,
                    'tanggal' => now()->translatedFormat('d F Y'),
                    'periodeLabel' => self::getPeriodeLabel($recap->triwulan),
                ])->output();

                $fileName = 'SKP_' . str_replace(' ', '_', $recap->user->nama) . '_' . $recap->user->nip . '.pdf';
                $zip->addFromString($fileName, $pdfContent);
            }
            $zip->close();
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    public function monthlyReportIndex(Request $request)
    {
        $user = $request->user();
        $bulan = (int) $request->input('bulan', date('n'));
        $tahun = (int) $request->input('tahun', date('Y'));
        $mode = $request->input('mode', 'stasiun');
        $pegawaiId = $request->input('user_id');

        $users = User::where('role', 'pengamat')->get();

        if ($user->role === 'pengamat') {
            $mode = 'pegawai';
            $pegawaiId = $user->id;
        }

        $daysInMonth = Carbon::createFromDate($tahun, $bulan, 1)->daysInMonth;

        $query = Observation::with(['values.parameter'])
            ->where('status_approval', 'approved')
            ->whereYear('tanggal', $tahun)
            ->whereMonth('tanggal', $bulan);

        if ($mode === 'pegawai' && $pegawaiId) {
            $query->where('user_id', $pegawaiId);
        }

        $approvedObservations = $query->get();

        $dailySummary = [];
        $totalHariHujan = 0;

        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dateStr = sprintf('%04d-%02d-%02d', $tahun, $bulan, $d);
            $dayObs = $approvedObservations->filter(function ($o) use ($dateStr) {
                $cleanDate = is_string($o->tanggal) ? explode('T', $o->tanggal)[0] : $o->tanggal->format('Y-m-d');
                return $cleanDate === $dateStr;
            });

            $slotCount = $dayObs->count();
            $isComplete = $slotCount === 16;

            $totalRain = 0;
            $hasRainData = false;

            foreach ($dayObs as $o) {
                foreach ($o->values as $v) {
                    if ($v->parameter && $v->parameter->kode === 'curah_hujan_jam') {
                        $val = (float) ($v->nilai_aws ?? $v->nilai_manual ?? 0);
                        $totalRain += $val;
                        $hasRainData = true;
                    }
                }
            }

            $isRainyDay = $totalRain >= 0.5;
            if ($isRainyDay) $totalHariHujan++;

            $dailySummary[] = [
                'tgl' => $d,
                'dateStr' => $dateStr,
                'slotCount' => $slotCount,
                'isComplete' => $isComplete,
                'totalRain' => $hasRainData ? $totalRain : null,
                'isRainyDay' => $isRainyDay,
            ];
        }

        return Inertia::render('Reports/Monthly', [
            'bulan' => $bulan,
            'tahun' => $tahun,
            'mode' => $mode,
            'pegawaiId' => $pegawaiId,
            'users' => $users,
            'dailySummary' => $dailySummary,
            'totalHariHujan' => $totalHariHujan,
        ]);
    }

    public function downloadMonthlyPdf(Request $request)
    {
        $user = $request->user();
        $bulan = (int) $request->input('bulan', date('n'));
        $tahun = (int) $request->input('tahun', date('Y'));
        $mode = $request->input('mode', 'stasiun');
        $pegawaiId = $request->input('user_id');

        if ($user->role === 'pengamat') {
            $mode = 'pegawai';
            $pegawaiId = $user->id;
        }

        $pegawai = $pegawaiId ? User::find($pegawaiId) : null;
        $daysInMonth = Carbon::createFromDate($tahun, $bulan, 1)->daysInMonth;

        $query = Observation::with(['values.parameter'])
            ->where('status_approval', 'approved')
            ->whereYear('tanggal', $tahun)
            ->whereMonth('tanggal', $bulan);

        if ($mode === 'pegawai' && $pegawaiId) {
            $query->where('user_id', $pegawaiId);
        }

        $approvedObservations = $query->get();

        $dailySummary = [];
        $totalHariHujan = 0;

        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dateStr = sprintf('%04d-%02d-%02d', $tahun, $bulan, $d);
            $dayObs = $approvedObservations->filter(function ($o) use ($dateStr) {
                $cleanDate = is_string($o->tanggal) ? explode('T', $o->tanggal)[0] : $o->tanggal->format('Y-m-d');
                return $cleanDate === $dateStr;
            });

            $slotCount = $dayObs->count();
            $isComplete = $slotCount === 16;

            $totalRain = 0;
            $hasRainData = false;

            foreach ($dayObs as $o) {
                foreach ($o->values as $v) {
                    if ($v->parameter && $v->parameter->kode === 'curah_hujan_jam') {
                        $val = (float) ($v->nilai_aws ?? $v->nilai_manual ?? 0);
                        $totalRain += $val;
                        $hasRainData = true;
                    }
                }
            }

            $isRainyDay = $totalRain >= 0.5;
            if ($isRainyDay) $totalHariHujan++;

            $dailySummary[] = [
                'tgl' => $d,
                'dateStr' => $dateStr,
                'slotCount' => $slotCount,
                'isComplete' => $isComplete,
                'totalRain' => $hasRainData ? $totalRain : null,
                'isRainyDay' => $isRainyDay,
            ];
        }

        $namaBulan = Carbon::createFromDate($tahun, $bulan, 1)->translatedFormat('F');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.observation_monthly', [
            'bulan' => $bulan,
            'tahun' => $tahun,
            'namaBulan' => $namaBulan,
            'mode' => $mode,
            'pegawai' => $pegawai,
            'dailySummary' => $dailySummary,
            'totalHariHujan' => $totalHariHujan,
            'tanggalCetak' => now()->translatedFormat('d F Y'),
        ])->setPaper('a4', 'landscape');

        $fileName = 'Laporan_Bulanan_' . $namaBulan . '_' . $tahun . '.pdf';
        return $pdf->download($fileName);
    }
}

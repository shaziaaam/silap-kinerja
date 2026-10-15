<?php

namespace App\Http\Controllers;

use App\Models\Observation;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ValidationController extends Controller
{
    private function getMonthsForTriwulan(string $triwulan): array
    {
        return match ($triwulan) {
            'T1' => [1, 2, 3],
            'T2' => [4, 5, 6],
            'T3' => [7, 8, 9],
            'T4' => [10, 11, 12],
            default => [1, 2, 3],
        };
    }

    public function queue(Request $request)
    {
        $currentMonth = (int) now()->format('n');
        $defaultT = match (true) {
            $currentMonth <= 3 => 'T1',
            $currentMonth <= 6 => 'T2',
            $currentMonth <= 9 => 'T3',
            default => 'T4',
        };

        $tahun = (int) $request->input('tahun', now()->year);
        $triwulan = $request->input('triwulan', $defaultT);
        $months = $this->getMonthsForTriwulan($triwulan);

        $pengamats = User::where('role', 'pengamat')->orderBy('nama')->get();

        $quarterSummary = [];
        foreach ($pengamats as $p) {
            $obsQuery = Observation::where('user_id', $p->id)
                ->whereYear('tanggal', $tahun)
                ->whereIn(\DB::raw('MONTH(tanggal)'), $months);

            // Fallback for SQLite testing where MONTH() doesn't exist
            if (config('database.default') === 'sqlite') {
                $obsQuery = Observation::where('user_id', $p->id)
                    ->whereBetween('tanggal', [
                        sprintf('%04d-%02d-01', $tahun, min($months)),
                        Carbon::create($tahun, max($months))->endOfMonth()->format('Y-m-d')
                    ]);
            }

            $allObs = $obsQuery->with(['schedule'])->get();
            $totalObs = $allObs->count();
            $pendingCount = $allObs->where('status_approval', 'pending')->count();
            $revisionCount = $allObs->where('status_approval', 'revision')->count();
            $approvedCount = $allObs->where('status_approval', 'approved')->count();

            // Photo completeness: 07:00 & 17:00 slots
            $foto07 = $allObs->filter(fn($o) => substr($o->schedule?->jam_wib ?? '', 0, 5) === '07:00' && !empty($o->foto_path))->count();
            $foto17 = $allObs->filter(fn($o) => substr($o->schedule?->jam_wib ?? '', 0, 5) === '17:00' && !empty($o->foto_path))->count();

            $recap = RekapSkpTriwulan::where('user_id', $p->id)
                ->where('tahun', $tahun)
                ->where('triwulan', $triwulan)
                ->first();

            $isAcc = $recap && $recap->status === 'approved';

            $quarterSummary[] = [
                'user' => $p,
                'total_obs' => $totalObs,
                'pending_count' => $pendingCount,
                'revision_count' => $revisionCount,
                'approved_count' => $approvedCount,
                'foto_07_count' => $foto07,
                'foto_17_count' => $foto17,
                'status_acc' => $isAcc ? 'approved' : ($revisionCount > 0 ? 'revision' : 'pending'),
                'can_acc' => $revisionCount === 0 && $totalObs > 0 && !$isAcc,
                'recap' => $recap,
            ];
        }

        // Recent observations needing supervisor inspection
        $observations = Observation::with(['user', 'schedule'])
            ->whereIn('status_approval', ['pending', 'revision'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Supervisor/ValidationQueue', [
            'observations' => $observations,
            'quarterSummary' => $quarterSummary,
            'selectedTahun' => $tahun,
            'selectedTriwulan' => $triwulan,
        ]);
    }

    public function action(Request $request, Observation $observation)
    {
        $validated = $request->validate([
            'status_approval' => 'required|in:approved,revision',
            'catatan_supervisor' => 'nullable|string',
        ]);

        $observation->update([
            'status_approval' => $validated['status_approval'],
            'catatan_supervisor' => $validated['catatan_supervisor'],
            'approved_by' => $request->user()->id,
        ]);

        $message = $validated['status_approval'] === 'approved' 
            ? 'Pengamatan berhasil disetujui.' 
            : 'Catatan revisi telah dikirim ke pengamat.';

        return redirect()->back()->with('message', $message);
    }

    public function approveQuarter(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'tahun' => 'required|integer',
            'triwulan' => 'required|in:T1,T2,T3,T4',
            'catatan' => 'nullable|string',
        ]);

        $months = $this->getMonthsForTriwulan($validated['triwulan']);

        // Check if user has observations with status revision
        $hasRevision = Observation::where('user_id', $validated['user_id'])
            ->where('status_approval', 'revision')
            ->whereYear('tanggal', $validated['tahun'])
            ->where(function ($q) use ($months, $validated) {
                if (config('database.default') === 'sqlite') {
                    $q->whereBetween('tanggal', [
                        sprintf('%04d-%02d-01', $validated['tahun'], min($months)),
                        Carbon::create($validated['tahun'], max($months))->endOfMonth()->format('Y-m-d')
                    ]);
                } else {
                    $q->whereIn(\DB::raw('MONTH(tanggal)'), $months);
                }
            })
            ->exists();

        if ($hasRevision) {
            return redirect()->back()->withErrors([
                'error' => 'ACC triwulan ditolak: masih terdapat observasi yang berstatus revisi untuk pegawai ini. Harap tunggu pengamat memperbaiki observasi terlebih dahulu.'
            ]);
        }

        // Approve all observations in this quarter
        $obsQuery = Observation::where('user_id', $validated['user_id'])
            ->whereYear('tanggal', $validated['tahun']);

        if (config('database.default') === 'sqlite') {
            $obsQuery->whereBetween('tanggal', [
                sprintf('%04d-%02d-01', $validated['tahun'], min($months)),
                Carbon::create($validated['tahun'], max($months))->endOfMonth()->format('Y-m-d')
            ]);
        } else {
            $obsQuery->whereIn(\DB::raw('MONTH(tanggal)'), $months);
        }

        $obsQuery->update([
            'status_approval' => 'approved',
            'approved_by' => $request->user()->id,
        ]);

        $totalValid = Observation::where('user_id', $validated['user_id'])
            ->where('status_approval', 'approved')
            ->whereYear('tanggal', $validated['tahun'])
            ->where(function ($q) use ($months, $validated) {
                if (config('database.default') === 'sqlite') {
                    $q->whereBetween('tanggal', [
                        sprintf('%04d-%02d-01', $validated['tahun'], min($months)),
                        Carbon::create($validated['tahun'], max($months))->endOfMonth()->format('Y-m-d')
                    ]);
                } else {
                    $q->whereIn(\DB::raw('MONTH(tanggal)'), $months);
                }
            })
            ->count();

        RekapSkpTriwulan::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'tahun' => $validated['tahun'],
                'triwulan' => $validated['triwulan'],
            ],
            [
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
                'catatan' => $validated['catatan'] ?? 'Disetujui Penyelia',
                'total_pengamatan_valid' => $totalValid,
                'tanggal_generate' => now(),
            ]
        );

        return redirect()->back()->with('message', "Seluruh observasi Triwulan {$validated['triwulan']} {$validated['tahun']} berhasil disetujui (ACC).");
    }

    public function approveAll(Request $request)
    {
        $validated = $request->validate([
            'tahun' => 'required|integer',
            'triwulan' => 'required|in:T1,T2,T3,T4',
        ]);

        $pengamats = User::where('role', 'pengamat')->get();
        $approvedCount = 0;

        foreach ($pengamats as $p) {
            $subReq = new Request([
                'user_id' => $p->id,
                'tahun' => $validated['tahun'],
                'triwulan' => $validated['triwulan'],
            ]);
            $subReq->setUserResolver(fn() => $request->user());

            try {
                $this->approveQuarter($subReq);
                $approvedCount++;
            } catch (\Throwable $e) {
                // skip if has revisions
            }
        }

        return redirect()->back()->with('message', "Persetujuan massal triwulan selesai diproses ({$approvedCount} pegawai di-ACC).");
    }
}

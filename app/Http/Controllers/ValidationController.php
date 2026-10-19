<?php

namespace App\Http\Controllers;

use App\Models\Observation;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    /**
     * Observations of one employee in one quarter. Uses a half-open date range
     * [first day, first day of next quarter) so it runs the same on MySQL and SQLite
     * (no MONTH()/QUARTER()) and keeps the quarter's last day even where the date is
     * stored as "Y-m-d 00:00:00".
     */
    private function observasiTriwulan(int $userId, int $tahun, string $triwulan)
    {
        $awal = Carbon::create($tahun, min($this->getMonthsForTriwulan($triwulan)), 1)->startOfDay();

        return Observation::where('user_id', $userId)
            ->where('tanggal', '>=', $awal->format('Y-m-d'))
            ->where('tanggal', '<', $awal->copy()->addMonths(3)->format('Y-m-d'));
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

        $pengamats = User::where('role', 'pengamat')->orderBy('nama')->get();

        $quarterSummary = [];
        foreach ($pengamats as $p) {
            $allObs = $this->observasiTriwulan($p->id, $tahun, $triwulan)->with(['schedule'])->get();
            $totalObs = $allObs->count();
            $pendingCount = $allObs->where('status_approval', 'pending')->count();
            $revisionCount = $allObs->where('status_approval', 'revision')->count();
            $approvedCount = $allObs->where('status_approval', 'approved')->count();

            // Photo completeness: 07:00 & 17:00 slots
            $foto07 = $allObs->filter(fn($o) => substr($o->schedule?->jam_wib ?? '', 0, 5) === '07:00' && !empty($o->foto_path))->count();
            $foto17 = $allObs->filter(fn($o) => substr($o->schedule?->jam_wib ?? '', 0, 5) === '17:00' && !empty($o->foto_path))->count();

            // Photos picked from the gallery carry upload-time coordinates, not capture-time,
            // so the supervisor should see how many of them are in the batch.
            $fotoGaleri = $allObs->where('foto_sumber', 'galeri')->count();

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
                'foto_galeri_count' => $fotoGaleri,
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

    /**
     * Per-observation exception path: the supervisor can only send an observation back
     * for revision. Approval itself happens once per employee per quarter.
     */
    public function action(Request $request, Observation $observation)
    {
        $validated = $request->validate([
            'status_approval' => 'required|in:revision',
            'catatan_supervisor' => 'required|string',
        ], [
            'catatan_supervisor.required' => 'Catatan revisi wajib diisi agar pengamat tahu apa yang harus diperbaiki.',
        ]);

        if ($observation->status_approval === 'approved') {
            return redirect()->back()->withErrors([
                'error' => 'Observasi ini sudah terkunci karena triwulannya telah di-ACC. Minta admin membuka kunci triwulan terlebih dahulu.',
            ]);
        }

        $observation->update([
            'status_approval' => 'revision',
            'catatan_supervisor' => $validated['catatan_supervisor'],
            'approved_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('message', 'Catatan revisi telah dikirim ke pengamat.');
    }

    public function approveQuarter(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'tahun' => 'required|integer',
            'triwulan' => 'required|in:T1,T2,T3,T4',
            'catatan' => 'nullable|string',
        ]);

        $error = $this->accTriwulan(
            (int) $validated['user_id'], (int) $validated['tahun'], $validated['triwulan'],
            $request->user(), $validated['catatan'] ?? null
        );

        if ($error) {
            return redirect()->back()->withErrors(['error' => $error]);
        }

        return redirect()->back()->with('message', "Seluruh observasi Triwulan {$validated['triwulan']} {$validated['tahun']} berhasil disetujui (ACC).");
    }

    public function approveAll(Request $request)
    {
        $validated = $request->validate([
            'tahun' => 'required|integer',
            'triwulan' => 'required|in:T1,T2,T3,T4',
        ]);

        $disetujui = 0;
        $dilewati = [];

        foreach (User::where('role', 'pengamat')->orderBy('nama')->get() as $p) {
            $error = $this->accTriwulan($p->id, (int) $validated['tahun'], $validated['triwulan'], $request->user());
            if ($error === null) {
                $disetujui++;
            } elseif ($this->observasiTriwulan($p->id, (int) $validated['tahun'], $validated['triwulan'])->exists()) {
                $dilewati[] = $p->nama;
            }
        }

        $pesan = "Persetujuan massal triwulan selesai: {$disetujui} pegawai di-ACC.";
        if ($dilewati) {
            $pesan .= ' Dilewati karena masih ada revisi: ' . implode(', ', $dilewati) . '.';
        }

        return redirect()->back()->with('message', $pesan);
    }

    /**
     * Admin-only: reopen an approved quarter so the observer can correct it. Every
     * observation in the quarter goes back to pending and the reopening is recorded.
     */
    public function unlockQuarter(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'tahun' => 'required|integer',
            'triwulan' => 'required|in:T1,T2,T3,T4',
            'alasan' => 'required|string|min:5',
        ], [
            'alasan.required' => 'Alasan membuka kunci wajib diisi.',
            'alasan.min' => 'Alasan membuka kunci terlalu singkat.',
        ]);

        $recap = RekapSkpTriwulan::where('user_id', $validated['user_id'])
            ->where('tahun', $validated['tahun'])
            ->where('triwulan', $validated['triwulan'])
            ->first();

        if (!$recap || $recap->status !== 'approved') {
            return redirect()->back()->withErrors(['error' => 'Triwulan ini belum di-ACC, jadi tidak ada kunci yang perlu dibuka.']);
        }

        DB::transaction(function () use ($validated, $recap, $request) {
            $this->observasiTriwulan((int) $validated['user_id'], (int) $validated['tahun'], $validated['triwulan'])
                ->where('status_approval', 'approved')
                ->update(['status_approval' => 'pending', 'approved_by' => null]);

            $recap->update([
                'status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
                'dibuka_oleh' => $request->user()->id,
                'dibuka_at' => now(),
                'alasan_buka' => $validated['alasan'],
            ]);
        });

        $nama = User::find($validated['user_id'])->nama;

        return redirect()->back()->with('message', "Kunci Triwulan {$validated['triwulan']} {$validated['tahun']} untuk {$nama} telah dibuka. Data dapat diperbaiki lalu di-ACC ulang oleh penyelia.");
    }

    /**
     * Approve one employee's quarter. Returns an error message, or null on success.
     */
    private function accTriwulan(int $userId, int $tahun, string $triwulan, User $penyetuju, ?string $catatan = null): ?string
    {
        $query = fn () => $this->observasiTriwulan($userId, $tahun, $triwulan);

        if ($query()->where('status_approval', 'revision')->exists()) {
            return 'ACC triwulan ditolak: masih terdapat observasi yang berstatus revisi untuk pegawai ini. Harap tunggu pengamat memperbaiki observasi terlebih dahulu.';
        }
        if (!$query()->exists()) {
            return 'ACC triwulan ditolak: pegawai ini belum memiliki observasi pada triwulan tersebut.';
        }

        DB::transaction(function () use ($query, $userId, $tahun, $triwulan, $penyetuju, $catatan) {
            $query()->update(['status_approval' => 'approved', 'approved_by' => $penyetuju->id]);

            RekapSkpTriwulan::updateOrCreate(
                ['user_id' => $userId, 'tahun' => $tahun, 'triwulan' => $triwulan],
                [
                    'status' => 'approved',
                    'approved_by' => $penyetuju->id,
                    'approved_at' => now(),
                    'catatan' => $catatan ?? 'Disetujui Penyelia',
                    'total_pengamatan_valid' => $query()->where('status_approval', 'approved')->count(),
                    'tanggal_generate' => now(),
                ]
            );
        });

        return null;
    }
}

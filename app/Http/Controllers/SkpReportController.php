<?php

namespace App\Http\Controllers;

use App\Models\Observation;
use App\Models\RekapSkpTriwulan;
use App\Models\User;
use App\Jobs\ExportSkpZip;
use App\Models\SkpExport;
use App\Services\PdfPhotoService;
use App\Services\SkpPdfBuilder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;

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

    /** Delegates to the shared builder so the job and the controller agree. */
    protected function skpPdfData(RekapSkpTriwulan $recap): array
    {
        return app(SkpPdfBuilder::class)->dataFor($recap);
    }

    private function getMonthsForPeriode($periodeKey): array
    {
        return SkpPdfBuilder::monthsForPeriode((string) $periodeKey);
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

        // Attach human readable label and revision block flag to each recap item
        $recaps->getCollection()->transform(function ($item) {
            $item->periode_label = self::getPeriodeLabel($item->triwulan);
            $months = $this->getMonthsForPeriode($item->triwulan);
            $item->has_pending_revisions = Observation::where('user_id', $item->user_id)
                ->where('status_approval', 'revision')
                ->whereYear('tanggal', $item->tahun)
                ->where(function ($query) use ($months) {
                    foreach ($months as $idx => $m) {
                        if ($idx === 0) {
                            $query->whereMonth('tanggal', $m);
                        } else {
                            $query->orWhereMonth('tanggal', $m);
                        }
                    }
                })
                ->exists();
            return $item;
        });

        // "userId|tahun|periode" => '' (siap dicetak) or the reason it cannot be printed yet.
        // A combination without a recap row is simply not approved; the page handles that case.
        $alasanLaporan = [];
        foreach (RekapSkpTriwulan::whereIn('user_id', $users->pluck('id'))->get() as $rekap) {
            $alasanLaporan["{$rekap->user_id}|{$rekap->tahun}|{$rekap->triwulan}"] = $this->alasanBelumBisaDicetak($rekap) ?? '';
        }

        $skpExports = $user->role === 'pengamat'
            ? []
            : SkpExport::with('targetUser')->latest()->limit(10)->get();

        return Inertia::render('Supervisor/SkpReport', [
            'pengamatList' => $users,
            'recaps' => $recaps,
            'alasanLaporan' => $alasanLaporan,
            'skpExports' => $skpExports,
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
            // Cek apakah masih ada observasi yang berstatus 'revision' pada tahun dan periode yang dipilih
            $hasRevision = Observation::where('user_id', $targetUser->id)
                ->where('status_approval', 'revision')
                ->whereYear('tanggal', $validated['tahun'])
                ->where(function ($q) use ($months) {
                    foreach ($months as $idx => $m) {
                        if ($idx === 0) {
                            $q->whereMonth('tanggal', $m);
                        } else {
                            $q->orWhereMonth('tanggal', $m);
                        }
                    }
                })
                ->exists();

            if ($hasRevision) {
                $label = self::getPeriodeLabel($periodeKey);
                return redirect()->back()->withErrors([
                    'message' => "Pengesahan (ACC) SKP {$label} ({$validated['tahun']}) untuk pegawai {$targetUser->nama} diblokir: masih ada data observasi berstatus 'Revisi' yang belum diperbaiki oleh pengamat.",
                ]);
            }

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
        // Pengamat only ever gets their own quarter; penyelia/admin can open anyone's.
        if ($user->role === 'pengamat' && $recap->user_id !== $user->id) {
            abort(403, 'Anda hanya dapat mengunduh laporan triwulan milik Anda sendiri.');
        }

        if ($pesan = $this->alasanBelumBisaDicetak($recap)) {
            abort(422, $pesan);
        }

        return $this->streamSkpPdf($recap);
    }

    public function downloadPdfByParam(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'tahun' => 'required|integer',
            'periode' => 'required|in:T1,T2,T3,T4',
        ]);

        $user = $request->user();
        if ($user->role === 'pengamat' && (int) $validated['user_id'] !== $user->id) {
            abort(403, 'Anda hanya dapat mengunduh laporan triwulan milik Anda sendiri.');
        }

        $recap = RekapSkpTriwulan::where('user_id', $validated['user_id'])
            ->where('tahun', $validated['tahun'])
            ->where('triwulan', $validated['periode'])
            ->first();

        if ($pesan = $this->alasanBelumBisaDicetak($recap)) {
            return back()->withErrors(['message' => $pesan]);
        }

        return $this->streamSkpPdf($recap);
    }

    /**
     * The SKP only reports approved data, so it can be printed once the quarter is
     * approved (ACC) and nothing in it is waiting for revision. Returns why not, or null.
     */
    protected function alasanBelumBisaDicetak(?RekapSkpTriwulan $recap): ?string
    {
        if (!$recap || $recap->status !== 'approved') {
            return 'Laporan triwulan belum tersedia: triwulan ini belum di-ACC oleh penyelia.';
        }

        $months = $this->getMonthsForPeriode($recap->triwulan);
        $adaRevisi = Observation::where('user_id', $recap->user_id)
            ->where('status_approval', 'revision')
            ->where('tanggal', '>=', sprintf('%04d-%02d-01', $recap->tahun, min($months)))
            ->where('tanggal', '<', Carbon::create($recap->tahun, max($months), 1)->addMonth()->format('Y-m-d'))
            ->exists();

        return $adaRevisi
            ? 'Laporan triwulan diblokir: masih ada observasi berstatus revisi yang belum diperbaiki.'
            : null;
    }

    protected function streamSkpPdf(RekapSkpTriwulan $recap)
    {
        // One quarter with photo attachments can take a while in DomPDF.
        @set_time_limit(300);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.skp_triwulan', $this->skpPdfData($recap));

        return $pdf->stream('SKP_' . $recap->triwulan . '_' . $recap->tahun . '_'
            . str_replace(' ', '_', $recap->user->nama) . '_' . $recap->user->nip . '.pdf');
    }

    public function downloadExport(Request $request, SkpExport $export)
    {
        if ($request->user()->role === 'pengamat') {
            abort(403, 'Hanya Admin dan Penyelia yang dapat mengunduh paket ZIP SKP.');
        }

        if (!$export->siapDiunduh()) {
            return back()->withErrors(['message' => 'Berkas paket ZIP belum siap atau sudah dihapus dari server.']);
        }

        return response()->download(storage_path('app/' . $export->file_path));
    }

    /**
     * ZIP of the quarterly PDFs of all employees (penyelia/admin only; route middleware).
     * A single employee's quarter is downloaded as a PDF instead.
     */
    public function exportZip(Request $request)
    {
        $validated = $request->validate([
            'tahun' => 'required|integer',
            'periode' => 'required|in:T1,T2,T3,T4',
        ]);

        $recaps = RekapSkpTriwulan::with('user')
            ->where('tahun', $validated['tahun'])
            ->where('triwulan', $validated['periode'])
            ->where('status', 'approved')
            ->get();

        if ($recaps->isEmpty()) {
            return back()->withErrors(['message' => 'Belum ada pegawai yang triwulannya di-ACC pada periode ini.']);
        }

        // One PDF takes ~15s and peaks near 330MB in DomPDF, so a whole package cannot
        // finish inside a web request. Queue it and let the supervisor collect the file.
        $export = SkpExport::create([
            'requested_by' => $request->user()->id,
            'target_user_id' => null,
            'tahun' => $validated['tahun'],
            'periode' => $validated['periode'],
            'status' => 'antre',
        ]);

        ExportSkpZip::dispatch($export->id);

        return back()->with('message', "Paket ZIP {$recaps->count()} pegawai sedang disiapkan. Berkas akan terunduh otomatis begitu selesai.");
    }
}

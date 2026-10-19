<?php

namespace App\Jobs;

use App\Models\RekapSkpTriwulan;
use App\Models\SkpExport;
use App\Services\SkpPdfBuilder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;
use ZipArchive;

/**
 * Builds the quarterly SKP package off the request cycle.
 *
 * One PDF takes roughly 15 seconds and peaks around 330 MB in DomPDF, so a package
 * covering every observer cannot finish inside a web request.
 */
class ExportSkpZip implements ShouldQueue
{
    use Queueable;

    /** Rendering is deterministic and expensive; a retry would just burn the same minutes. */
    public int $tries = 1;

    public int $timeout = 1800;

    public function __construct(public int $exportId)
    {
    }

    public function handle(SkpPdfBuilder $builder): void
    {
        $export = SkpExport::find($this->exportId);
        if (!$export) {
            return;
        }

        $export->update(['status' => 'proses']);

        $recaps = RekapSkpTriwulan::with('user')
            ->where('tahun', $export->tahun)
            ->where('triwulan', $export->periode)
            ->where('status', 'approved')
            ->when($export->target_user_id, fn ($q) => $q->where('user_id', $export->target_user_id))
            ->get();

        if ($recaps->isEmpty()) {
            $export->update([
                'status' => 'gagal',
                'pesan_error' => 'Belum ada pegawai yang triwulannya di-ACC pada periode ini.',
                'selesai_pada' => now(),
            ]);
            return;
        }

        $directory = storage_path('app/skp-exports');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $suffix = $export->target_user_id
            ? '_' . str_replace(' ', '_', $recaps->first()->user->nama ?? 'Pegawai')
            : '';
        $fileName = 'SKP_Paket_' . $export->periode . '_' . $export->tahun . $suffix . '_' . $export->id . '.zip';
        $absolutePath = $directory . '/' . $fileName;

        $zip = new ZipArchive();
        if ($zip->open($absolutePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            $export->update([
                'status' => 'gagal',
                'pesan_error' => 'Tidak dapat membuat berkas ZIP di server.',
                'selesai_pada' => now(),
            ]);
            return;
        }

        foreach ($recaps as $recap) {
            $pdf = Pdf::loadView('pdf.skp_triwulan', $builder->dataFor($recap))->output();
            $zip->addFromString(
                'SKP_' . str_replace(' ', '_', $recap->user->nama) . '_' . $recap->user->nip . '.pdf',
                $pdf
            );
            // DomPDF holds the whole document in memory; release it before the next one.
            unset($pdf);
            gc_collect_cycles();
        }

        $zip->close();

        $export->update([
            'status' => 'selesai',
            'file_path' => 'skp-exports/' . $fileName,
            'jumlah_pegawai' => $recaps->count(),
            'selesai_pada' => now(),
        ]);
    }

    public function failed(Throwable $e): void
    {
        Log::error('Ekspor ZIP SKP gagal', ['export_id' => $this->exportId, 'error' => $e->getMessage()]);

        SkpExport::where('id', $this->exportId)->update([
            'status' => 'gagal',
            'pesan_error' => mb_substr($e->getMessage(), 0, 1000),
            'selesai_pada' => now(),
        ]);
    }
}

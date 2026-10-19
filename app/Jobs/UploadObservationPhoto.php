<?php

namespace App\Jobs;

use App\Models\Observation;
use App\Services\PhotoStorage\DrivePhotoStorage;
use App\Services\PhotoStorage\LocalPhotoStorage;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Moves an observation photo from the server's temporary storage to the Shared Drive.
 * While Drive is unreachable the photo stays on the server (still viewable) and the
 * job retries with growing pauses; photos still pending after the last try are queued
 * again by the hourly `silap:unggah-foto-tertunda` command.
 */
class UploadObservationPhoto implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    public int $tries = 8;

    public int $timeout = 120;

    public function __construct(public int $observationId, public string $localRef)
    {
        $this->afterCommit();
    }

    /** 1 min, 5 min, 15 min, 30 min, then hourly: about 5 hours in total. */
    public function backoff(): array
    {
        return [60, 300, 900, 1800, 3600];
    }

    public function uniqueId(): string
    {
        return $this->observationId . ':' . $this->localRef;
    }

    public function handle(): void
    {
        if (config('silap.photo_disk') !== 'drive') {
            return;
        }

        $observation = Observation::find($this->observationId);

        // Deleted, already uploaded, or the photo was replaced since this job was queued.
        if (!$observation || $observation->photo_ref !== $this->localRef || !LocalPhotoStorage::isLocalRef($observation->photo_ref)) {
            return;
        }

        $hasil = app(DrivePhotoStorage::class)->pindahkanKeDrive($this->localRef);

        $observation->forceFill([
            'photo_ref' => $hasil['id'],
            'foto_path' => $hasil['id'],
            'foto_gdrive_id' => $hasil['id'],
            'foto_gdrive_url' => $hasil['web_view_link'],
        ])->save();
    }

    public function failed(?Throwable $e): void
    {
        Log::warning("Foto observasi #{$this->observationId} belum terunggah ke Google Drive setelah {$this->tries} percobaan; "
            . 'foto tetap aman di server dan akan diantrekan ulang oleh silap:unggah-foto-tertunda. ' . $e?->getMessage());
    }
}

<?php

namespace App\Console\Commands;

use App\Jobs\UploadObservationPhoto;
use App\Models\Observation;
use Illuminate\Console\Command;

/**
 * Queue an upload for every photo still on the server, e.g. after a long Drive outage
 * or once the service account credentials are installed. Scheduled hourly.
 */
class UnggahFotoTertunda extends Command
{
    protected $signature = 'silap:unggah-foto-tertunda';

    protected $description = 'Antrekan upload ke Google Drive untuk foto observasi yang masih tersimpan sementara di server';

    public function handle(): int
    {
        if (config('silap.photo_disk') !== 'drive') {
            $this->info('PHOTO_DISK bukan "drive"; foto memang disimpan di server.');
            return self::SUCCESS;
        }

        $jumlah = 0;
        Observation::whereNotNull('photo_ref')
            ->whereNull('foto_gdrive_id')
            ->where('photo_ref', 'like', '%/%')
            ->select(['id', 'photo_ref'])
            ->chunkById(200, function ($batch) use (&$jumlah) {
                foreach ($batch as $o) {
                    UploadObservationPhoto::dispatch($o->id, $o->photo_ref);
                    $jumlah++;
                }
            });

        $this->info("{$jumlah} foto diantrekan untuk diunggah ke Google Drive.");

        return self::SUCCESS;
    }
}

<?php

namespace App\Services\PhotoStorage;

use App\Services\GoogleDriveService;
use RuntimeException;

/**
 * Google Drive storage (catatan revisi 7 / Fase 4). A new photo is first kept on the
 * server; the UploadObservationPhoto job then moves it to the Shared Drive in a
 * tahun/bulan/tanggal folder and retries while Drive is unreachable.
 */
class DrivePhotoStorage implements PhotoStorageInterface
{
    public function __construct(
        protected GoogleDriveService $driveService,
        protected LocalPhotoStorage $local,
    ) {
    }

    /** Temporary local copy; the queued job uploads it. */
    public function store(string $fileContents, string $fileName, string $mimeType = 'image/webp'): array
    {
        return $this->local->store($fileContents, $fileName, $mimeType);
    }

    /**
     * Upload a temporarily stored local photo to Drive, mirroring its date folders,
     * then remove the local copy. Throws when Drive cannot take it (the job retries).
     *
     * @return array{id: string, web_view_link: ?string}
     */
    public function pindahkanKeDrive(string $localRef): array
    {
        if (!$this->driveService->isConfigured()) {
            throw new RuntimeException('Google Drive belum terkonfigurasi (kredensial service account belum dipasang).');
        }

        $bytes = $this->local->get($localRef);
        if ($bytes === null) {
            throw new RuntimeException("Salinan sementara foto tidak ditemukan: {$localRef}");
        }

        // foto_observasi/2026/10/09/obs_x.webp -> folders [2026, 10, 09], name obs_x.webp
        $bagian = explode('/', $localRef);
        $nama = array_pop($bagian);
        $folder = array_slice($bagian, 1);

        $hasil = $this->driveService->uploadPhoto($bytes, $nama, 'image/webp', $folder);
        if (empty($hasil['id'])) {
            throw new RuntimeException("Upload foto ke Google Drive gagal: {$localRef}");
        }

        $this->local->delete($localRef);

        return ['id' => $hasil['id'], 'web_view_link' => $hasil['web_view_link'] ?? null];
    }

    public function get(string $ref): ?string
    {
        if (LocalPhotoStorage::isLocalRef($ref)) {
            return $this->local->get($ref);
        }

        return $this->driveService->isConfigured() ? $this->driveService->getFileContent($ref) : null;
    }

    public function delete(string $ref): bool
    {
        if (LocalPhotoStorage::isLocalRef($ref)) {
            return $this->local->delete($ref);
        }

        return $this->driveService->isConfigured() && $this->driveService->deleteFile($ref);
    }

    public function getUrl(string $ref): ?string
    {
        return null; // Drive folder has no public access; served through the route
    }
}

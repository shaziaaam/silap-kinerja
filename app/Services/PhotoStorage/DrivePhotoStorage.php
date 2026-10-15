<?php

namespace App\Services\PhotoStorage;

use App\Services\GoogleDriveService;
use Illuminate\Support\Facades\Log;

class DrivePhotoStorage implements PhotoStorageInterface
{
    protected GoogleDriveService $driveService;
    protected LocalPhotoStorage $localFallback;

    public function __construct(GoogleDriveService $driveService, LocalPhotoStorage $localFallback)
    {
        $this->driveService = $driveService;
        $this->localFallback = $localFallback;
    }

    public function store(string $fileContents, string $fileName, string $mimeType = 'image/webp'): array
    {
        // First save local backup copy
        $localResult = $this->localFallback->store($fileContents, $fileName, $mimeType);

        if ($this->driveService->isConfigured()) {
            try {
                $driveResult = $this->driveService->uploadPhoto($fileContents, $fileName, $mimeType);
                if ($driveResult && !empty($driveResult['id'])) {
                    return [
                        'ref' => $driveResult['id'],
                        'url' => $driveResult['web_view_link'] ?? $localResult['url'],
                        'disk' => 'drive',
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('DrivePhotoStorage upload error, fallback to local: ' . $e->getMessage());
            }
        }

        return $localResult;
    }

    public function get(string $ref): ?string
    {
        if ($this->driveService->isConfigured()) {
            $content = $this->driveService->getFileContent($ref);
            if ($content !== null) {
                return $content;
            }
        }
        return $this->localFallback->get($ref);
    }

    public function delete(string $ref): bool
    {
        $driveDeleted = false;
        if ($this->driveService->isConfigured()) {
            $driveDeleted = $this->driveService->deleteFile($ref);
        }
        $localDeleted = $this->localFallback->delete($ref);
        return $driveDeleted || $localDeleted;
    }

    public function getUrl(string $ref): ?string
    {
        return $this->localFallback->getUrl($ref);
    }
}

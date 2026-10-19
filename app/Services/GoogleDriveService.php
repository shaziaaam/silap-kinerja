<?php

namespace App\Services;

use Exception;
use Google\Client as GoogleClient;
use Google\Service\Drive as GoogleDrive;
use Google\Service\Drive\DriveFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GoogleDriveService
{
    protected ?GoogleClient $client = null;
    protected ?GoogleDrive $driveService = null;
    protected bool $isConfigured = false;
    protected ?string $sharedDriveId;
    protected ?string $folderId;

    public function __construct()
    {
        $this->sharedDriveId = config('google.shared_drive_id');
        $this->folderId = config('google.folder_id') ?: $this->sharedDriveId;

        $this->initializeClient();
    }

    /**
     * Initialize Google API Client with Service Account credentials.
     */
    protected function initializeClient(): void
    {
        $jsonString = config('google.service_account_json');
        $jsonPath = config('google.service_account_path');

        $authConfig = null;
        if (!empty($jsonString)) {
            $decoded = json_decode($jsonString, true);
            if (is_array($decoded)) {
                $authConfig = $decoded;
            }
        } elseif (!empty($jsonPath) && file_exists($jsonPath)) {
            $authConfig = $jsonPath;
        }

        if (!$authConfig) {
            $this->isConfigured = false;
            return;
        }

        try {
            $client = new GoogleClient();
            $client->setApplicationName('SILAP-Kinerja BMKG');
            $client->setScopes([GoogleDrive::DRIVE]);
            $client->setAuthConfig($authConfig);

            $this->client = $client;
            $this->driveService = new GoogleDrive($client);
            $this->isConfigured = true;
        } catch (Exception $e) {
            Log::error('Gagal menginisialisasi Google Drive Client Service Account: ' . $e->getMessage());
            $this->isConfigured = false;
        }
    }

    /**
     * Check if Google Drive Service Account is configured and ready.
     */
    public function isConfigured(): bool
    {
        return $this->isConfigured && $this->driveService !== null;
    }

    /**
     * Upload photo to Google Workspace Shared Drive.
     *
     * @param string $fileContents Binary contents of the image
     * @param string $fileName Target file name on Google Drive
     * @param string $mimeType MIME type (e.g. image/webp, image/jpeg)
     * @param array<int, string> $folderPath Sub-folders under the photo root, e.g. ['2026', '10', '09']
     * @return array|null Returns ['id' => ..., 'web_view_link' => ..., 'web_content_link' => ...] or null
     */
    public function uploadPhoto(string $fileContents, string $fileName, string $mimeType = 'image/webp', array $folderPath = []): ?array
    {
        if (!$this->isConfigured()) {
            Log::warning('Google Drive Service Account belum terkonfigurasi. Foto tidak dapat diunggah ke Shared Drive.');
            return null;
        }

        try {
            $parentId = $this->folderId;
            foreach ($folderPath as $nama) {
                $parentId = $this->folderAnak($parentId, (string) $nama);
            }

            $fileMetadata = new DriveFile([
                'name' => $fileName,
                'parents' => !empty($parentId) ? [$parentId] : [],
            ]);

            $optParams = [
                'data' => $fileContents,
                'mimeType' => $mimeType,
                'uploadType' => 'multipart',
                'fields' => 'id, name, webViewLink, webContentLink',
                'supportsAllDrives' => true,
            ];

            /** @var DriveFile $file */
            $file = $this->driveService->files->create($fileMetadata, $optParams);

            Log::info("Foto berhasil diunggah ke Google Shared Drive: {$fileName} (ID: {$file->id})");

            return [
                'id' => $file->id,
                'name' => $file->name,
                'web_view_link' => $file->webViewLink,
                'web_content_link' => $file->webContentLink,
            ];
        } catch (Exception $e) {
            Log::error('Error saat upload foto ke Google Workspace Shared Drive: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * ID of the sub-folder $nama under $parentId, created when missing. IDs are cached
     * so a busy day does not search Drive for the same year/month/day folder each time.
     */
    protected function folderAnak(?string $parentId, string $nama): string
    {
        $kunci = 'gdrive-folder:' . sha1(($parentId ?? 'root') . '/' . $nama);

        return Cache::rememberForever($kunci, function () use ($parentId, $nama) {
            $q = sprintf(
                "name = '%s' and mimeType = 'application/vnd.google-apps.folder' and trashed = false%s",
                str_replace("'", "\\'", $nama),
                $parentId ? " and '{$parentId}' in parents" : ''
            );
            $opt = [
                'q' => $q,
                'fields' => 'files(id)',
                'pageSize' => 1,
                'supportsAllDrives' => true,
                'includeItemsFromAllDrives' => true,
            ];
            if ($this->sharedDriveId) {
                $opt['corpora'] = 'drive';
                $opt['driveId'] = $this->sharedDriveId;
            }

            $ada = $this->driveService->files->listFiles($opt)->getFiles();
            if (!empty($ada)) {
                return $ada[0]->id;
            }

            $folder = $this->driveService->files->create(new DriveFile([
                'name' => $nama,
                'mimeType' => 'application/vnd.google-apps.folder',
                'parents' => $parentId ? [$parentId] : [],
            ]), ['fields' => 'id', 'supportsAllDrives' => true]);

            return $folder->id;
        });
    }

    /**
     * Get stream/content of a file from Google Drive Shared Drive.
     *
     * @param string $fileId
     * @return string|null
     */
    public function getFileContent(string $fileId): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = $this->driveService->files->get($fileId, [
                'alt' => 'media',
                'supportsAllDrives' => true,
            ]);

            return (string) $response->getBody();
        } catch (Exception $e) {
            Log::error("Gagal mengunduh file Google Drive {$fileId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete file from Google Workspace Shared Drive.
     *
     * @param string $fileId
     * @return bool
     */
    public function deleteFile(string $fileId): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $this->driveService->files->delete($fileId, [
                'supportsAllDrives' => true,
            ]);
            return true;
        } catch (Exception $e) {
            Log::error("Gagal menghapus file Google Drive {$fileId}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * List files in the Shared Drive / folder.
     *
     * @param string|null $q Optional query
     * @return array
     */
    public function listFiles(?string $q = null): array
    {
        if (!$this->isConfigured()) {
            return [];
        }

        try {
            $optParams = [
                'supportsAllDrives' => true,
                'includeItemsFromAllDrives' => true,
                'pageSize' => 50,
                'fields' => 'files(id, name, mimeType, webViewLink, createdTime)',
            ];

            if ($this->sharedDriveId) {
                $optParams['corpora'] = 'drive';
                $optParams['driveId'] = $this->sharedDriveId;
            }

            if (!empty($q)) {
                $optParams['q'] = $q;
            }

            $results = $this->driveService->files->listFiles($optParams);
            return $results->getFiles();
        } catch (Exception $e) {
            Log::error('Gagal melist file Google Drive: ' . $e->getMessage());
            return [];
        }
    }
}

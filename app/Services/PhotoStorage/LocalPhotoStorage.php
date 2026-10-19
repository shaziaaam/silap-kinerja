<?php

namespace App\Services\PhotoStorage;

use Illuminate\Support\Facades\Storage;

/**
 * Photos on the server's private disk (storage/app/private), never under a public URL;
 * they are served through the authenticated observations.photo route. Also the
 * temporary holding place before a photo is moved to Google Drive.
 */
class LocalPhotoStorage implements PhotoStorageInterface
{
    protected string $disk = 'local';
    protected string $directory = 'foto_observasi';
    // Rows saved before photos went private live on the public disk.
    protected string $legacyDisk = 'public';

    public function store(string $fileContents, string $fileName, string $mimeType = 'image/webp'): array
    {
        $path = $this->directory . '/' . ltrim($fileName, '/');
        Storage::disk($this->disk)->put($path, $fileContents);

        return [
            'ref' => $path,
            'url' => null,
            'disk' => 'local',
        ];
    }

    public function get(string $ref): ?string
    {
        foreach ([$this->disk, $this->legacyDisk] as $disk) {
            $path = $disk === $this->legacyDisk ? ltrim(str_replace('/storage/', '', $ref), '/') : $ref;
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->get($path);
            }
        }

        return null;
    }

    public function delete(string $ref): bool
    {
        if (Storage::disk($this->disk)->exists($ref)) {
            return Storage::disk($this->disk)->delete($ref);
        }
        return false;
    }

    public function getUrl(string $ref): ?string
    {
        return null; // served only through the authenticated route
    }

    /** True when $ref points at a file on this server (a Drive file ID has no slash). */
    public static function isLocalRef(?string $ref): bool
    {
        return $ref !== null && str_contains($ref, '/');
    }
}

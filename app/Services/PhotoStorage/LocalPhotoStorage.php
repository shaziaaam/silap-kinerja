<?php

namespace App\Services\PhotoStorage;

use Illuminate\Support\Facades\Storage;

class LocalPhotoStorage implements PhotoStorageInterface
{
    protected string $disk = 'public';
    protected string $directory = 'watermarked_photos';

    public function store(string $fileContents, string $fileName, string $mimeType = 'image/webp'): array
    {
        $path = $this->directory . '/' . ltrim($fileName, '/');
        Storage::disk($this->disk)->put($path, $fileContents);

        return [
            'ref' => $path,
            'url' => '/storage/' . ltrim($path, '/'),
            'disk' => 'local',
        ];
    }

    public function get(string $ref): ?string
    {
        if (Storage::disk($this->disk)->exists($ref)) {
            return Storage::disk($this->disk)->get($ref);
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
        return '/storage/' . ltrim($ref, '/');
    }
}

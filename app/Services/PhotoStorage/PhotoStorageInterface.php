<?php

namespace App\Services\PhotoStorage;

interface PhotoStorageInterface
{
    /**
     * Store observation photo.
     *
     * @param string $fileContents Binary contents
     * @param string $fileName File name
     * @param string $mimeType Mime type (default: image/webp)
     * @return array ['ref' => string, 'url' => ?string, 'disk' => string]
     */
    public function store(string $fileContents, string $fileName, string $mimeType = 'image/webp'): array;

    /**
     * Get binary content of photo by ref (used by PDF generator/caching).
     *
     * @param string $ref
     * @return string|null
     */
    public function get(string $ref): ?string;

    /**
     * Delete photo by ref.
     *
     * @param string $ref
     * @return bool
     */
    public function delete(string $ref): bool;

    /**
     * Get public / web view URL.
     *
     * @param string $ref
     * @return string|null
     */
    public function getUrl(string $ref): ?string;
}

<?php

namespace App\Services;

use App\Models\Observation;
use App\Services\PhotoStorage\PhotoStorageInterface;
use Illuminate\Support\Facades\Storage;

/**
 * Supplies evidence photos to the PDF renderer.
 *
 * Photos are archived as WebP, which DomPDF cannot read (it supports gif, png,
 * bmp and jpeg only), so this service fetches the bytes through the configured
 * PhotoStorage driver and hands DomPDF a JPEG copy. Copies are cached on local
 * disk so exporting a quarter's worth of PDFs does not re-download or re-encode
 * the same photo repeatedly.
 */
class PdfPhotoService
{
    protected const CACHE_DIR = 'pdf-photo-cache';

    /** @var array<int|string, string|null> memoised per request */
    protected array $memo = [];

    public function __construct(protected PhotoStorageInterface $storage)
    {
    }

    /**
     * Absolute path to a DomPDF-readable JPEG, or null when no photo is available.
     */
    public function jpegPath(?Observation $observation): ?string
    {
        if (!$observation) {
            return null;
        }

        $ref = $observation->photo_ref ?: $observation->foto_path;
        if (empty($ref)) {
            return null;
        }

        if (array_key_exists($ref, $this->memo)) {
            return $this->memo[$ref];
        }

        return $this->memo[$ref] = $this->resolve($ref);
    }

    /**
     * Build a map of observation id => JPEG path, for passing into a Blade view.
     *
     * @param  iterable<Observation>  $observations
     * @return array<int, string>
     */
    public function jpegPathMap(iterable $observations): array
    {
        $map = [];
        foreach ($observations as $observation) {
            $path = $this->jpegPath($observation);
            if ($path !== null) {
                $map[$observation->id] = $path;
            }
        }

        return $map;
    }

    protected function resolve(string $ref): ?string
    {
        $cachePath = storage_path('app/' . self::CACHE_DIR . '/' . sha1($ref) . '.jpg');
        if (is_file($cachePath)) {
            return $cachePath;
        }

        $bytes = $this->bytesFor($ref);
        if ($bytes === null || $bytes === '') {
            return null;
        }

        $info = @getimagesizefromstring($bytes);
        if ($info === false) {
            return null;
        }

        @mkdir(dirname($cachePath), 0755, true);

        // Already JPEG and within budget: keep the original bytes rather than re-encoding.
        $maxWidthJpeg = (int) config('silap.pdf_foto_lebar_maks', 1600);
        if ($info[2] === IMAGETYPE_JPEG && ($maxWidthJpeg <= 0 || $info[0] <= $maxWidthJpeg)) {
            return file_put_contents($cachePath, $bytes) !== false ? $cachePath : null;
        }

        $image = @imagecreatefromstring($bytes);
        if ($image === false) {
            return null;
        }

        // The archive keeps full resolution; the PDF copy only needs enough detail for
        // an A4 photo box, and oversized copies cost render time and memory per page.
        $maxWidth = (int) config('silap.pdf_foto_lebar_maks', 1600);
        if ($maxWidth > 0 && imagesx($image) > $maxWidth) {
            $scaled = imagescale($image, $maxWidth);
            if ($scaled !== false) {
                imagedestroy($image);
                $image = $scaled;
            }
        }

        // Flatten any transparency onto white so the PDF never shows a black box.
        $flat = imagecreatetruecolor(imagesx($image), imagesy($image));
        imagefill($flat, 0, 0, imagecolorallocate($flat, 255, 255, 255));
        imagecopy($flat, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));

        $ok = imagejpeg($flat, $cachePath, 90);
        imagedestroy($image);
        imagedestroy($flat);

        return $ok ? $cachePath : null;
    }

    protected function bytesFor(string $ref): ?string
    {
        $bytes = $this->storage->get($ref);
        if ($bytes !== null) {
            return $bytes;
        }

        // Legacy rows store a public-disk path in foto_path instead of photo_ref.
        $relative = ltrim(str_replace('/storage/', '', $ref), '/');
        if (Storage::disk('public')->exists($relative)) {
            return Storage::disk('public')->get($relative);
        }

        $absolute = public_path($ref);
        return is_file($absolute) ? (file_get_contents($absolute) ?: null) : null;
    }
}

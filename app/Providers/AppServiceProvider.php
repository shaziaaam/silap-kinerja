<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\PhotoStorage\PhotoStorageInterface::class, function ($app) {
            $disk = config('silap.photo_disk', env('PHOTO_DISK', 'local'));
            if ($disk === 'drive') {
                return $app->make(\App\Services\PhotoStorage\DrivePhotoStorage::class);
            }
            return $app->make(\App\Services\PhotoStorage\LocalPhotoStorage::class);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (str_starts_with(config('app.url'), 'https://') || request()->header('X-Forwarded-Proto') === 'https') {
            URL::forceScheme('https');
        }
    }
}

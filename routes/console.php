<?php

use Illuminate\Support\Facades\Schedule;

// Dijalankan oleh cron `php artisan schedule:run` tiap menit (lihat permintaan ke divisi IT).
Schedule::command('silap:unggah-foto-tertunda')->hourly()->withoutOverlapping();

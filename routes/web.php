<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordChangeController;
use App\Http\Controllers\ObservationController;
use App\Http\Controllers\ValidationController;
use App\Http\Controllers\SkpReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Admin\InstrumentController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public & Guest Routes
Route::get('/', function () {
    return Inertia::render('Landing');
})->name('landing');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    // Attempts are rate limited inside the controller so the form can show the message.
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

// Authenticated Routes
Route::middleware(['auth', \App\Http\Middleware\EnsurePasswordIsChanged::class])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    // Observations (Pengamat & Penyelia)
    Route::get('/observations', [ObservationController::class, 'index'])->name('observations.index');
    // Input dan perbaikan observasi hanya oleh pengamat (miliknya sendiri, dicek di controller)
    Route::middleware('role:pengamat')->group(function () {
        Route::get('/observations/create', [ObservationController::class, 'create'])->name('observations.create');
        Route::post('/observations', [ObservationController::class, 'store'])->name('observations.store');
        Route::get('/observations/{observation}/edit', [ObservationController::class, 'edit'])->name('observations.edit');
        Route::put('/observations/{observation}', [ObservationController::class, 'update'])->name('observations.update');
    });

    // Supervisor Queue & Approval: penyelia verifikator tunggal; admin boleh melihat
    // antrean dan satu-satunya yang boleh membuka kunci ACC.
    Route::get('/supervisor/queue', [ValidationController::class, 'queue'])
        ->middleware('role:penyelia,admin')->name('supervisor.queue');
    Route::middleware('role:penyelia')->group(function () {
        Route::post('/supervisor/observations/{observation}/action', [ValidationController::class, 'action'])->name('supervisor.action');
        Route::post('/supervisor/approve-quarter', [ValidationController::class, 'approveQuarter'])->name('supervisor.approve_quarter');
        Route::post('/supervisor/approve-all', [ValidationController::class, 'approveAll'])->name('supervisor.approve_all');
    });
    Route::post('/admin/unlock-quarter', [ValidationController::class, 'unlockQuarter'])
        ->middleware('role:admin')->name('admin.unlock_quarter');

    // Laporan & Export PDF / Image / Photo / CSV
    Route::get('/observations/{observation}/pdf', [ObservationController::class, 'downloadHourlyPdf'])->name('observations.pdf');
    Route::get('/observations/{observation}/photo', [ObservationController::class, 'viewPhoto'])->name('observations.photo');

    // Laporan triwulan (SKP): pengamat hanya PDF miliknya sendiri (dicek di controller);
    // penyelia/admin PDF per pegawai dan ZIP semua pegawai.
    Route::get('/supervisor/skp-report', [SkpReportController::class, 'index'])->name('supervisor.skp.index');
    Route::get('/supervisor/skp-report/pdf-direct', [SkpReportController::class, 'downloadPdfByParam'])->name('supervisor.skp.pdf-direct');
    Route::get('/supervisor/skp-report/{recap}/pdf', [SkpReportController::class, 'previewPdf'])->name('supervisor.skp.pdf');
    Route::middleware('role:penyelia,admin')->group(function () {
        Route::post('/supervisor/skp-report/generate', [SkpReportController::class, 'generate'])->name('supervisor.skp.generate');
        Route::post('/supervisor/skp-report/export-zip', [SkpReportController::class, 'exportZip'])->name('supervisor.skp.zip');
        Route::get('/supervisor/skp-report/exports/{export}/download', [SkpReportController::class, 'downloadExport'])->name('supervisor.skp.export_download');
    });

    // Admin: Kelola Pengguna & Kelola Alat
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users.index');
        Route::post('/admin/users', [UserController::class, 'store'])->name('admin.users.store');
        Route::put('/admin/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
        Route::delete('/admin/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
        Route::post('/admin/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('admin.users.reset-password');

        // Admin: Kelola Alat (Instruments)
        Route::prefix('admin/instruments')->name('admin.instruments.')->group(function () {
            Route::get('/', [InstrumentController::class, 'index'])->name('index');

            // Instrument CRUD
            Route::post('/', [InstrumentController::class, 'storeInstrument'])->name('store');
            Route::put('/{instrument}', [InstrumentController::class, 'updateInstrument'])->name('update');
            Route::delete('/{instrument}', [InstrumentController::class, 'destroyInstrument'])->name('destroy');

            // Parameter CRUD (nested under instrument)
            Route::post('/{instrument}/parameters', [InstrumentController::class, 'storeParameter'])->name('parameters.store');
            Route::put('/parameters/{parameter}', [InstrumentController::class, 'updateParameter'])->name('parameters.update');
            Route::delete('/parameters/{parameter}', [InstrumentController::class, 'destroyParameter'])->name('parameters.destroy');

            // Pilihan dropdown (Keadaan Tanah, Keadaan Hujan)
            Route::post('/options', [InstrumentController::class, 'storeOption'])->name('options.store');
            Route::put('/options/{option}', [InstrumentController::class, 'updateOption'])->name('options.update');
            Route::delete('/options/{option}', [InstrumentController::class, 'destroyOption'])->name('options.destroy');

            // Settings
            Route::post('/settings', [InstrumentController::class, 'updateSettings'])->name('settings.update');
        });
    });
});

// Force Password Change Route (outside EnsurePasswordIsChanged middleware loop)
Route::middleware('auth')->group(function () {
    Route::get('/force-change-password', [PasswordChangeController::class, 'show'])->name('password.force_change');
    Route::post('/force-change-password', [PasswordChangeController::class, 'update'])->name('password.force_update');
});

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Batasi rute ke peran tertentu, misal ->middleware('role:penyelia,admin').
 * Menu di Sidebar sudah disembunyikan per peran, tetapi itu hanya tampilan;
 * pemeriksaan sebenarnya harus di server.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!in_array($request->user()?->role, $roles, true)) {
            abort(403, 'Anda tidak memiliki hak akses untuk halaman atau aksi ini.');
        }

        return $next($request);
    }
}

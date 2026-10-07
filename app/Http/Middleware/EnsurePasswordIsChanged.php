<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            if (!$request->routeIs('password.force_change', 'password.force_update', 'logout')) {
                return redirect()->route('password.force_change');
            }
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AuthenticatedSessionController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request)
    {
        $request->validate([
            'nip' => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [
            'nip.required' => 'NIP atau email wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        $loginInput = trim($request->input('nip'));

        // At most 5 attempts per minute per account and device; shown on the form
        // instead of a bare "429 Too Many Requests" page.
        $kunci = 'login:' . Str::lower($loginInput) . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($kunci, 5)) {
            return back()->withErrors([
                'nip' => 'Terlalu banyak percobaan masuk. Coba lagi dalam ' . RateLimiter::availableIn($kunci) . ' detik.',
            ])->onlyInput('nip', 'remember');
        }

        // Mencari user berdasarkan NIP atau email (email tidak peka huruf besar/kecil)
        $user = User::where('nip', $loginInput)
            ->orWhereRaw('LOWER(email) = ?', [Str::lower($loginInput)])
            ->first();

        if ($user && Hash::check($request->input('password'), $user->password)) {
            RateLimiter::clear($kunci);
            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();

            if ($user->must_change_password) {
                return redirect()->route('password.force_change');
            }

            return redirect()->intended(route('dashboard'));
        }

        RateLimiter::hit($kunci, 60);

        return back()->withErrors([
            'nip' => 'NIP/email atau kata sandi salah.',
        ])->onlyInput('nip', 'remember');
    }

    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}

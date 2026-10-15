<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('id', 'desc')->get();
        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => 'required|string|unique:users,nip|max:50',
            'email' => 'nullable|email|unique:users,email|max:255',
            'role' => 'required|in:pengamat,penyelia,admin',
            'password' => 'required|string|min:6',
        ]);

        User::create([
            'nama' => $validated['nama'],
            'nip' => $validated['nip'],
            'email' => !empty($validated['email']) ? trim($validated['email']) : null,
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'must_change_password' => true,
        ]);

        return redirect()->back()->with('message', 'Akun pengguna berhasil dibuat.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => ['required', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|in:pengamat,penyelia,admin',
            'password' => 'nullable|string|min:6',
        ]);

        $updateData = [
            'nama' => $validated['nama'],
            'nip' => $validated['nip'],
            'email' => !empty($validated['email']) ? trim($validated['email']) : null,
            'role' => $validated['role'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return redirect()->back()->with('message', "Data pengguna {$user->nama} berhasil diperbarui.");
    }

    public function destroy(User $user)
    {
        if (auth()->id() === $user->id) {
            return redirect()->back()->withErrors(['error' => 'Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan.']);
        }

        $user->delete();

        return redirect()->back()->with('message', 'Akun pengguna berhasil dihapus.');
    }

    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user->update([
            'password' => Hash::make($request->password),
            'must_change_password' => true,
        ]);

        return redirect()->back()->with('message', "Password pengguna {$user->nama} berhasil direset.");
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Observation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ValidationController extends Controller
{
    public function queue(Request $request)
    {
        $observations = Observation::with(['user', 'schedule'])
            ->where('status_approval', 'pending')
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Supervisor/ValidationQueue', [
            'observations' => $observations,
        ]);
    }

    public function action(Request $request, Observation $observation)
    {
        $validated = $request->validate([
            'status_approval' => 'required|in:approved,revision',
            'catatan_supervisor' => 'nullable|string',
        ]);

        $observation->update([
            'status_approval' => $validated['status_approval'],
            'catatan_supervisor' => $validated['catatan_supervisor'],
            'approved_by' => $request->user()->id,
        ]);

        $message = $validated['status_approval'] === 'approved' 
            ? 'Pengamatan berhasil disetujui.' 
            : 'Catatan revisi telah dikirim ke pengamat.';

        return redirect()->back()->with('message', $message);
    }
}

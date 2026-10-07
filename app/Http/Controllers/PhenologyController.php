<?php

namespace App\Http\Controllers;

use App\Models\PhenologyEntry;
use App\Models\PhenologyEntryPhase;
use App\Models\PhenologyPhase;
use App\Models\PhenologyPlant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PhenologyController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = PhenologyEntry::with(['user', 'plant', 'entryPhases.phase'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc');

        if ($user->role === 'pengamat') {
            $query->where('user_id', $user->id);
        }

        $entries = $query->paginate(15);
        $plants = PhenologyPlant::where('is_active', true)->get();

        return Inertia::render('Phenology/Index', [
            'entries' => $entries,
            'plants'  => $plants,
        ]);
    }

    public function create()
    {
        $plants = PhenologyPlant::where('is_active', true)->get();
        $phases = PhenologyPhase::where('is_active', true)->orderBy('urutan')->get();

        return Inertia::render('Phenology/Create', [
            'plants' => $plants,
            'phases' => $phases,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal'   => 'required|date',
            'plant_id'  => 'required|exists:phenology_plants,id',
            'keadaan'   => 'required|in:sangat_baik,baik,sedang,buruk',
            'keterangan'=> 'nullable|string',
            'foto'      => 'nullable|string',
            'phases'    => 'required|array|min:1',
            'phases.*.phase_id' => 'required|exists:phenology_phases,id',
            'phases.*.tahap'    => 'required|in:mulai,sedang,selesai',
        ]);

        // Cek entri ganda per hari per tanaman
        $existing = PhenologyEntry::where('plant_id', $validated['plant_id'])
            ->where('tanggal', $validated['tanggal'])
            ->first();

        if ($existing) {
            return back()->withErrors([
                'plant_id' => 'Entri fenologi untuk tanaman ini pada tanggal tersebut sudah pernah diinput.',
            ])->withInput();
        }

        $fotoPath = null;
        if (!empty($validated['foto'])) {
            $imageData = $validated['foto'];
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $imageData = base64_decode($imageData);

                if ($imageData !== false) {
                    $filename = 'pheno_' . time() . '_' . uniqid() . '.webp';
                    Storage::disk('public')->put('phenology_photos/' . $filename, $imageData);
                    $fotoPath = 'storage/phenology_photos/' . $filename;
                }
            }
        }

        $entry = PhenologyEntry::create([
            'user_id'   => $request->user()->id,
            'plant_id'  => $validated['plant_id'],
            'tanggal'   => $validated['tanggal'],
            'keadaan'   => $validated['keadaan'],
            'keterangan'=> $validated['keterangan'] ?? null,
            'foto_path' => $fotoPath,
        ]);

        foreach ($validated['phases'] as $p) {
            PhenologyEntryPhase::create([
                'entry_id' => $entry->id,
                'phase_id' => $p['phase_id'],
                'tahap'    => $p['tahap'],
            ]);
        }

        return redirect()->route('phenology.index')->with('message', 'Pencatatan fenologi berhasil disimpan.');
    }

    // ---- Admin Master Plant & Phase CRUD ----

    public function storePlant(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:phenology_plants,nama',
        ]);

        PhenologyPlant::create(['nama' => $validated['nama'], 'is_active' => true]);

        return redirect()->back()->with('message', 'Tanaman berhasil ditambahkan.');
    }

    public function updatePlant(Request $request, PhenologyPlant $plant)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:phenology_plants,nama,' . $plant->id,
            'is_active' => 'boolean',
        ]);

        $plant->update($validated);

        return redirect()->back()->with('message', 'Data tanaman berhasil diperbarui.');
    }

    public function destroyPlant(PhenologyPlant $plant)
    {
        $plant->delete();
        return redirect()->back()->with('message', 'Tanaman berhasil dihapus.');
    }

    public function storePhase(Request $request)
    {
        $validated = $request->validate([
            'kode'   => 'required|string|max:100|unique:phenology_phases,kode',
            'nama'   => 'required|string|max:255',
            'urutan' => 'integer|min:0',
        ]);

        PhenologyPhase::create(array_merge($validated, ['is_active' => true]));

        return redirect()->back()->with('message', 'Fase fenologi berhasil ditambahkan.');
    }

    public function updatePhase(Request $request, PhenologyPhase $phase)
    {
        $validated = $request->validate([
            'kode'   => 'required|string|max:100|unique:phenology_phases,kode,' . $phase->id,
            'nama'   => 'required|string|max:255',
            'urutan' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $phase->update($validated);

        return redirect()->back()->with('message', 'Fase fenologi berhasil diperbarui.');
    }

    public function destroyPhase(PhenologyPhase $phase)
    {
        $phase->delete();
        return redirect()->back()->with('message', 'Fase fenologi berhasil dihapus.');
    }
}

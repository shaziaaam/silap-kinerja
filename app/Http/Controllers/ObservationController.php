<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\InstrumentParameter;
use App\Models\Observation;
use App\Models\ObservationValue;
use App\Models\Schedule;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ObservationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Observation::with(['schedule', 'supervisor', 'user', 'values.parameter'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc');

        if ($user->role === 'pengamat') {
            $query->where('user_id', $user->id);
        }

        $observations = $query->paginate(15);

        return Inertia::render('Observations/Index', [
            'observations' => $observations,
        ]);
    }

    public function create()
    {
        $schedules = Schedule::orderBy('jam_utc', 'asc')->get();
        $instruments = Instrument::with(['parameters' => function ($q) {
            $q->where(function ($sub) {
                $sub->where('is_active', true)
                    ->orWhereHas('instrument', function ($i) {
                        $i->where('nama', 'Pengamatan Visual & Angin Manual');
                    });
            })->orderBy('urutan');
        }])
        ->where(function ($q) {
            $q->where('is_active', true)
              ->orWhere('nama', 'Pengamatan Visual & Angin Manual');
        })
        ->orderBy('urutan_form')->get();

        $settings = [
            'jam_mulai' => (int) Setting::get('jam_mulai', 7),
            'jam_selesai' => (int) Setting::get('jam_selesai', 22),
        ];

        return Inertia::render('Observations/Create', [
            'schedules' => $schedules,
            'instruments' => $instruments,
            'settings' => $settings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'schedule_id' => 'required|exists:schedules,id',
            'tanggal' => 'required|date',
            'status_pengamatan' => 'required|in:lengkap,dibatalkan',
            'alasan_batal' => 'nullable|required_if:status_pengamatan,dibatalkan|string',
            'foto' => 'nullable|string',
            'values' => 'nullable|array',
        ]);

        $schedule = Schedule::findOrFail($validated['schedule_id']);
        if ($schedule->is_synoptic && empty($validated['foto']) && $validated['status_pengamatan'] === 'lengkap') {
            return back()->withErrors([
                'foto' => 'Foto bukti pengamatan wajib diambil pada jam pengamatan 07:00 WIB dan 17:00 WIB.',
            ])->withInput();
        }

        // Validasi Fisika Cuaca & Meteorologi
        if (!empty($validated['values']) && is_array($validated['values']) && $validated['status_pengamatan'] === 'lengkap') {
            $paramMap = InstrumentParameter::whereIn('id', array_keys($validated['values']))->get()->keyBy('id');
            $valsByCode = [];

            foreach ($validated['values'] as $paramId => $valData) {
                $param = $paramMap->get($paramId);
                if (!$param) continue;

                $val = $valData['manual'] ?? $valData['aws'] ?? null;
                if ($val !== null && $val !== '' && is_numeric($val)) {
                    $valsByCode[$param->kode] = (float) $val;
                }
            }

            // 1. Suhu bola basah <= Suhu bola kering
            $dryKey = isset($valsByCode['suhu_bola_kering']) ? 'suhu_bola_kering' : (isset($valsByCode['suhu_udara_aws']) ? 'suhu_udara_aws' : null);
            if (isset($valsByCode['suhu_bola_basah']) && $dryKey && isset($valsByCode[$dryKey])) {
                $tBasah = $valsByCode['suhu_bola_basah'];
                $tKering = $valsByCode[$dryKey];
                if ($tBasah > $tKering) {
                    return back()->withErrors([
                        'values' => "Validasi Fisika Gagal: Suhu bola basah ({$tBasah}°C) tidak boleh lebih tinggi dari suhu bola kering ({$tKering}°C).",
                    ])->withInput();
                }
            }

            // 2. Suhu minimum <= Suhu maksimum
            if (isset($valsByCode['suhu_minimum']) && isset($valsByCode['suhu_maksimum'])) {
                $tMin = $valsByCode['suhu_minimum'];
                $tMax = $valsByCode['suhu_maksimum'];
                if ($tMin > $tMax) {
                    return back()->withErrors([
                        'values' => "Validasi Fisika Gagal: Suhu minimum ({$tMin}°C) tidak boleh lebih tinggi dari suhu maksimum ({$tMax}°C).",
                    ])->withInput();
                }
            }
        }

        $fotoPath = null;
        if (!empty($validated['foto'])) {
            $imageData = $validated['foto'];
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $imageData = base64_decode($imageData);

                if ($imageData !== false) {
                    $filename = 'obs_' . time() . '_' . uniqid() . '.webp';
                    Storage::disk('public')->put('watermarked_photos/' . $filename, $imageData);
                    $fotoPath = 'storage/watermarked_photos/' . $filename;
                }
            }
        }

        $observation = Observation::create([
            'user_id' => $request->user()->id,
            'schedule_id' => $validated['schedule_id'],
            'tanggal' => $validated['tanggal'],
            'status_pengamatan' => $validated['status_pengamatan'],
            'alasan_batal' => $validated['alasan_batal'] ?? null,
            'foto_path' => $fotoPath,
            'status_approval' => 'pending',
        ]);

        if (!empty($validated['values']) && is_array($validated['values'])) {
            foreach ($validated['values'] as $paramId => $valData) {
                $nilaiAws = $valData['aws'] ?? null;
                $nilaiManual = $valData['manual'] ?? null;

                if (is_array($nilaiAws)) $nilaiAws = json_encode($nilaiAws);
                if (is_array($nilaiManual)) $nilaiManual = json_encode($nilaiManual);

                if ($nilaiAws !== null || $nilaiManual !== null) {
                    ObservationValue::create([
                        'observation_id' => $observation->id,
                        'parameter_id' => $paramId,
                        'nilai_aws' => $nilaiAws,
                        'nilai_manual' => $nilaiManual,
                    ]);
                }
            }
        }

        return redirect()->route('observations.index')->with('message', 'Data observasi berhasil dicatat.');
    }

    public function downloadHourlyPdf(Request $request, Observation $observation)
    {
        $user = $request->user();

        // Hak akses: Pengamat hanya bisa miliknya, Admin/Penyelia semua
        if ($user->role === 'pengamat' && $observation->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses untuk mengunduh laporan ini.');
        }

        $observation->load(['schedule', 'user', 'values.parameter']);

        $wibHour = (int) substr($observation->schedule->jam_wib ?? '07:00', 0, 2);

        $parameters = InstrumentParameter::where(function ($q) {
            $q->where('is_active', true)
              ->orWhereHas('instrument', function ($i) {
                  $i->where('nama', 'Pengamatan Visual & Angin Manual');
              });
        })
        ->whereHas('instrument', function ($q) {
            $q->where('is_active', true)
              ->orWhere('nama', 'Pengamatan Visual & Angin Manual');
        })
        ->orderBy('urutan')
        ->get()
        ->filter(function ($param) use ($wibHour) {
            return $param->isScheduledFor($wibHour);
        });

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.observation_hourly', [
            'observation' => $observation,
            'parameters'  => $parameters,
        ]);

        $fileName = 'Observasi_' . sprintf('%02d', $wibHour) . 'WIB_' . $observation->tanggal . '.pdf';
        return $pdf->download($fileName);
    }
}

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
        $schedules = Schedule::orderBy('jam_wib', 'asc')->get();
        $instruments = Instrument::with(['parameters' => function ($q) {
            $q->orderBy('urutan');
        }])
        ->orderBy('urutan_form')
        ->get();

        $parameterOptions = \App\Models\ParameterOption::orderBy('urutan')->get()->groupBy('parameter_kode');

        // Ambil nilai "sebelum" terakhir untuk kartu 2 (counter), 3 (tinggi air), 5 (piche)
        $previousObservation = Observation::with(['values.parameter'])
            ->where('status_pengamatan', 'lengkap')
            ->orderBy('tanggal', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $previousValues = [];
        if ($previousObservation) {
            foreach ($previousObservation->values as $v) {
                if ($v->parameter) {
                    $previousValues[$v->parameter->kode] = $v->nilai_manual ?? $v->nilai_aws;
                }
            }
        }

        $settings = [
            'jam_mulai' => (int) Setting::get('jam_mulai', 7),
            'jam_selesai' => (int) Setting::get('jam_selesai', 22),
            'foto_slots' => config('silap.foto_slots', ['07:00', '17:00']),
        ];

        return Inertia::render('Observations/Create', [
            'schedules' => $schedules,
            'instruments' => $instruments,
            'parameterOptions' => $parameterOptions,
            'previousValues' => $previousValues,
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
        $jamWib = substr((string) $schedule->jam_wib, 0, 5);
        $isMandatoryPhoto = in_array($jamWib, config('silap.foto_slots', ['07:00', '17:00']), true) || $schedule->is_synoptic;

        if ($isMandatoryPhoto && empty($validated['foto']) && $validated['status_pengamatan'] === 'lengkap') {
            return back()->withErrors([
                'foto' => 'Foto bukti pengamatan wajib diambil pada slot pengamatan 07:00 WIB dan 17:00 WIB.',
            ])->withInput();
        }

        // Validasi Fisika Cuaca & Meteorologi (dilewati jika nilai kosong)
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

            // 1. Suhu bola basah <= Suhu bola kering (Sangkar)
            $dryKey = isset($valsByCode['suhu_bola_kering']) ? 'suhu_bola_kering' : (isset($valsByCode['suhu_udara_aws']) ? 'suhu_udara_aws' : null);
            if (isset($valsByCode['suhu_bola_basah']) && $dryKey && isset($valsByCode[$dryKey])) {
                $tBasah = $valsByCode['suhu_bola_basah'];
                $tKering = $valsByCode[$dryKey];
                if ($tBasah > $tKering) {
                    return back()->withErrors([
                        'values' => "Validasi Fisika: Suhu bola basah ({$tBasah}°C) tidak boleh lebih tinggi dari suhu bola kering ({$tKering}°C).",
                    ])->withInput();
                }
            }

            // 2. Assman: TBB <= TBK di tiap ketinggian
            foreach ([5, 10, 20, 50, 100, 150, 200] as $h) {
                $tbkKey = "assman_tbk_{$h}cm";
                $tbbKey = "assman_tbb_{$h}cm";
                if (isset($valsByCode[$tbbKey]) && isset($valsByCode[$tbkKey])) {
                    if ($valsByCode[$tbbKey] > $valsByCode[$tbkKey]) {
                        return back()->withErrors([
                            'values' => "Validasi Fisika Assman: TBB {$h} cm ({$valsByCode[$tbbKey]}°C) tidak boleh lebih tinggi dari TBK {$h} cm ({$valsByCode[$tbkKey]}°C).",
                        ])->withInput();
                    }
                }
            }

            // 3. Suhu Air Min <= Suhu Air Maks
            if (isset($valsByCode['suhu_air_min']) && isset($valsByCode['suhu_air_maks'])) {
                if ($valsByCode['suhu_air_min'] > $valsByCode['suhu_air_maks']) {
                    return back()->withErrors([
                        'values' => "Validasi Fisika: Suhu air minimum ({$valsByCode['suhu_air_min']}°C) tidak boleh lebih tinggi dari suhu air maksimum ({$valsByCode['suhu_air_maks']}°C).",
                    ])->withInput();
                }
            }
        }

        $fotoPath = null;
        $fotoGdriveId = null;
        $fotoGdriveUrl = null;
        $fotoRef = null;

        if (!empty($validated['foto'])) {
            $imageData = $validated['foto'];
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $imageData = base64_decode($imageData);

                if ($imageData !== false) {
                    $filename = 'obs_' . time() . '_' . uniqid() . '.webp';

                    // Gunakan PhotoStorageInterface
                    $storage = app(\App\Services\PhotoStorage\PhotoStorageInterface::class);
                    $saved = $storage->store($imageData, $filename, 'image/webp');
                    $fotoPath = $saved['url'] ?? null;
                    $fotoRef = $saved['ref'] ?? null;
                    if ($saved['disk'] === 'drive') {
                        $fotoGdriveId = $saved['ref'];
                        $fotoGdriveUrl = $saved['url'];
                    }
                }
            }
        }

        $shift = (int) substr($schedule->jam_wib, 0, 2) < 15 ? 'pagi' : 'siang';

        $observation = Observation::create([
            'user_id' => $request->user()->id,
            'schedule_id' => $validated['schedule_id'],
            'tanggal' => $validated['tanggal'],
            'status_pengamatan' => $validated['status_pengamatan'],
            'alasan_batal' => $validated['alasan_batal'] ?? null,
            'shift' => $shift,
            'foto_path' => $fotoPath,
            'photo_slot' => $isMandatoryPhoto ? $jamWib : null,
            'photo_ref' => $fotoRef,
            'foto_gdrive_id' => $fotoGdriveId,
            'foto_gdrive_url' => $fotoGdriveUrl,
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

    public function edit(Request $request, Observation $observation)
    {
        $user = $request->user();

        // Pengamat hanya boleh edit observasi miliknya sendiri
        if ($user->role === 'pengamat' && $observation->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengedit observasi ini.');
        }

        // Revisi per observasi dipertahankan sebagai jalur pengecualian: hanya boleh diedit jika statusnya 'revision' atau 'pending'
        if ($observation->status_approval === 'approved' && $user->role === 'pengamat') {
            return redirect()->route('observations.index')->withErrors([
                'message' => 'Observasi yang sudah disetujui (Approved) tidak dapat diedit kembali.',
            ]);
        }

        $observation->load(['schedule', 'values']);

        $schedules = Schedule::orderBy('jam_wib', 'asc')->get();
        $instruments = Instrument::with(['parameters' => function ($q) {
            $q->orderBy('urutan');
        }])
        ->orderBy('urutan_form')->get();

        $parameterOptions = \App\Models\ParameterOption::orderBy('urutan')->get()->groupBy('parameter_kode');

        $settings = [
            'jam_mulai' => (int) Setting::get('jam_mulai', 7),
            'jam_selesai' => (int) Setting::get('jam_selesai', 22),
            'foto_slots' => config('silap.foto_slots', ['07:00', '17:00']),
        ];

        // Format existing values: { [paramId]: { aws: '', manual: '' } }
        $existingValues = [];
        foreach ($observation->values as $val) {
            $existingValues[$val->parameter_id] = [
                'aws' => $val->nilai_aws,
                'manual' => $val->nilai_manual,
            ];
        }

        return Inertia::render('Observations/Edit', [
            'observation' => $observation,
            'existingValues' => $existingValues,
            'schedules' => $schedules,
            'instruments' => $instruments,
            'parameterOptions' => $parameterOptions,
            'settings' => $settings,
        ]);
    }

    public function update(Request $request, Observation $observation)
    {
        $user = $request->user();

        if ($user->role === 'pengamat' && $observation->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah observasi ini.');
        }

        if ($observation->status_approval === 'approved' && $user->role === 'pengamat') {
            return redirect()->route('observations.index')->withErrors([
                'message' => 'Observasi yang sudah disetujui (Approved) tidak dapat diubah.',
            ]);
        }

        $validated = $request->validate([
            'schedule_id' => 'required|exists:schedules,id',
            'tanggal' => 'required|date',
            'status_pengamatan' => 'required|in:lengkap,dibatalkan',
            'alasan_batal' => 'nullable|required_if:status_pengamatan,dibatalkan|string',
            'foto' => 'nullable|string',
            'values' => 'nullable|array',
        ]);

        $schedule = Schedule::findOrFail($validated['schedule_id']);
        $jamWib = substr((string) $schedule->jam_wib, 0, 5);
        $isMandatoryPhoto = in_array($jamWib, config('silap.foto_slots', ['07:00', '17:00']), true) || $schedule->is_synoptic;

        if ($isMandatoryPhoto && empty($validated['foto']) && empty($observation->foto_path) && $validated['status_pengamatan'] === 'lengkap') {
            return back()->withErrors([
                'foto' => 'Foto bukti pengamatan wajib diambil pada slot pengamatan 07:00 WIB dan 17:00 WIB.',
            ])->withInput();
        }

        // Validasi Fisika Cuaca & Meteorologi (dilewati jika nilai kosong)
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

            // 1. Suhu bola basah <= Suhu bola kering (Sangkar)
            $dryKey = isset($valsByCode['suhu_bola_kering']) ? 'suhu_bola_kering' : (isset($valsByCode['suhu_udara_aws']) ? 'suhu_udara_aws' : null);
            if (isset($valsByCode['suhu_bola_basah']) && $dryKey && isset($valsByCode[$dryKey])) {
                $tBasah = $valsByCode['suhu_bola_basah'];
                $tKering = $valsByCode[$dryKey];
                if ($tBasah > $tKering) {
                    return back()->withErrors([
                        'values' => "Validasi Fisika: Suhu bola basah ({$tBasah}°C) tidak boleh lebih tinggi dari suhu bola kering ({$tKering}°C).",
                    ])->withInput();
                }
            }

            // 2. Assman: TBB <= TBK di tiap ketinggian
            foreach ([5, 10, 20, 50, 100, 150, 200] as $h) {
                $tbkKey = "assman_tbk_{$h}cm";
                $tbbKey = "assman_tbb_{$h}cm";
                if (isset($valsByCode[$tbbKey]) && isset($valsByCode[$tbkKey])) {
                    if ($valsByCode[$tbbKey] > $valsByCode[$tbkKey]) {
                        return back()->withErrors([
                            'values' => "Validasi Fisika Assman: TBB {$h} cm ({$valsByCode[$tbbKey]}°C) tidak boleh lebih tinggi dari TBK {$h} cm ({$valsByCode[$tbkKey]}°C).",
                        ])->withInput();
                    }
                }
            }

            // 3. Suhu Air Min <= Suhu Air Maks
            if (isset($valsByCode['suhu_air_min']) && isset($valsByCode['suhu_air_maks'])) {
                if ($valsByCode['suhu_air_min'] > $valsByCode['suhu_air_maks']) {
                    return back()->withErrors([
                        'values' => "Validasi Fisika: Suhu air minimum ({$valsByCode['suhu_air_min']}°C) tidak boleh lebih tinggi dari suhu air maksimum ({$valsByCode['suhu_air_maks']}°C).",
                    ])->withInput();
                }
            }
        }

        $fotoPath = $observation->foto_path;
        $fotoGdriveId = $observation->foto_gdrive_id;
        $fotoGdriveUrl = $observation->foto_gdrive_url;
        $fotoRef = $observation->photo_ref;

        if (!empty($validated['foto'])) {
            $imageData = $validated['foto'];
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $imageData = base64_decode($imageData);

                if ($imageData !== false) {
                    $filename = 'obs_' . time() . '_' . uniqid() . '.webp';

                    $storage = app(\App\Services\PhotoStorage\PhotoStorageInterface::class);
                    $saved = $storage->store($imageData, $filename, 'image/webp');
                    $fotoPath = $saved['url'] ?? null;
                    $fotoRef = $saved['ref'] ?? null;
                    if ($saved['disk'] === 'drive') {
                        $fotoGdriveId = $saved['ref'];
                        $fotoGdriveUrl = $saved['url'];
                    }
                }
            }
        }

        $shift = (int) substr($schedule->jam_wib, 0, 2) < 15 ? 'pagi' : 'siang';

        // Simpan perubahan: status kembali ke pending untuk ditinjau penyelia ulang
        $observation->update([
            'schedule_id' => $validated['schedule_id'],
            'tanggal' => $validated['tanggal'],
            'status_pengamatan' => $validated['status_pengamatan'],
            'alasan_batal' => $validated['alasan_batal'] ?? null,
            'shift' => $shift,
            'foto_path' => $fotoPath,
            'photo_slot' => $isMandatoryPhoto ? $jamWib : null,
            'photo_ref' => $fotoRef,
            'foto_gdrive_id' => $fotoGdriveId,
            'foto_gdrive_url' => $fotoGdriveUrl,
            'status_approval' => 'pending',
            'catatan_supervisor' => null, // reset catatan revisi setelah diperbaiki
        ]);

        // Re-sync values
        if (!empty($validated['values']) && is_array($validated['values'])) {
            ObservationValue::where('observation_id', $observation->id)->delete();

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

        return redirect()->route('observations.index')->with('message', 'Perbaikan data observasi berhasil disimpan dan dikirim kembali untuk validasi penyelia.');
    }

    public function downloadHourlyPdf(Request $request, Observation $observation)
    {
        $user = $request->user();

        // Hak akses: Pengamat hanya bisa miliknya, Admin/Penyelia semua
        if ($user->role === 'pengamat' && $observation->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses untuk mengunduh laporan ini.');
        }

        $observation->load(['schedule', 'user', 'values.parameter']);

        $jamWib = substr($observation->schedule->jam_wib ?? '07:00', 0, 5);

        $parameters = InstrumentParameter::orderBy('urutan')
            ->get()
            ->filter(function ($param) use ($jamWib) {
                return $param->isScheduledForSlot($jamWib);
            });

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.observation_hourly', [
            'observation' => $observation,
            'parameters'  => $parameters,
        ]);

        $fileName = 'Observasi_' . str_replace(':', '', $jamWib) . 'WIB_' . $observation->tanggal . '.pdf';
        return $pdf->stream($fileName);
    }

    public function exportCsv(Request $request)
    {
        $tanggal = $request->input('tanggal', date('Y-m-d'));
        $user = $request->user();

        $query = Observation::with(['schedule', 'user', 'values.parameter'])
            ->where('tanggal', $tanggal)
            ->orderBy('schedule_id', 'asc');

        if ($user->role === 'pengamat') {
            $query->where('user_id', $user->id);
        }

        $observations = $query->get();

        // Parameter order: Kartu 1-7 lalu Kartu 8
        $allParams = InstrumentParameter::orderBy('urutan')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"Observasi_FormNasional_{$tanggal}.csv\"",
        ];

        $callback = function () use ($observations, $allParams, $tanggal) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header baris 1
            $csvHeader = ['Tanggal', 'Jam_WIB', 'Kelompok', 'Status', 'Pengamat'];
            foreach ($allParams as $p) {
                $csvHeader[] = $p->kode . '_manual';
                $csvHeader[] = $p->kode . '_aws';
            }
            fputcsv($handle, $csvHeader);

            foreach ($observations as $obs) {
                $jamWib = substr($obs->schedule->jam_wib ?? '', 0, 5);
                $kelompok = $obs->schedule->kelompok ?? '';
                $valsByParam = $obs->values->keyBy('parameter_id');

                $row = [
                    $obs->tanggal,
                    $jamWib,
                    $kelompok,
                    $obs->status_pengamatan,
                    $obs->user->nama ?? '',
                ];

                foreach ($allParams as $p) {
                    $valObj = $valsByParam->get($p->id);
                    $manual = $valObj->nilai_manual ?? null;
                    $aws = $valObj->nilai_aws ?? null;

                    // Nonaktif atau null dicetak 9999 untuk form nasional
                    if (!$p->is_active || ($manual === null && $p->sifat !== 'dihitung_nasional')) {
                        $valManualStr = ($manual === null) ? '9999' : $manual;
                    } else {
                        $valManualStr = ($p->sifat === 'dihitung_nasional') ? 'otomatis' : $manual;
                    }

                    if ($aws === null) {
                        $valAwsStr = '9999';
                    } else {
                        $valAwsStr = $aws;
                    }

                    $row[] = $valManualStr;
                    $row[] = $valAwsStr;
                }

                fputcsv($handle, $row);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }


    public function downloadShiftImage(Request $request, Observation $observation)
    {
        $user = $request->user();

        if ($user->role === 'pengamat' && $observation->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses untuk mengunduh laporan ini.');
        }

        $observation->load(['schedule', 'user', 'values.parameter']);

        $service = new \App\Services\ShiftReportImageService();
        $imagePath = $service->generate($observation);

        $fileName = 'Laporan_Cuaca_Shift_' . $observation->id . '_' . $observation->tanggal . '.png';

        return response()->download($imagePath, $fileName);
    }

    public function viewPhoto(Request $request, Observation $observation)
    {
        $user = $request->user();

        if ($user->role === 'pengamat' && $observation->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses untuk melihat foto observasi ini.');
        }

        if (!empty($observation->foto_gdrive_url)) {
            return redirect()->away($observation->foto_gdrive_url);
        }

        if (!empty($observation->foto_path) && file_exists(public_path($observation->foto_path))) {
            return response()->file(public_path($observation->foto_path));
        }

        if (!empty($observation->foto_gdrive_id)) {
            $gdriveService = app(\App\Services\GoogleDriveService::class);
            $content = $gdriveService->getFileContent($observation->foto_gdrive_id);
            if ($content) {
                return response($content)->header('Content-Type', 'image/webp');
            }
        }

        abort(404, 'Foto observasi tidak ditemukan.');
    }
}

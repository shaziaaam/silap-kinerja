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

        // Field "Sebelum" = bacaan terakhir field sumbernya (Counter Dibaca, Tinggi Air
        // Dibaca, Piche Sekarang, Gunn-Bellani hari sebelumnya)
        $previousValues = app(\App\Services\ObservationRules::class)->nilaiSebelum();

        // Slots already filled today (station-wide): the form picks the nearest empty one.
        $hariIni = now('Asia/Jakarta')->toDateString();
        $slotTerisi = Observation::whereDate('tanggal', $hariIni)->pluck('schedule_id')->unique()->values();

        $settings = [
            'jam_mulai' => (int) Setting::get('jam_mulai', 7),
            'jam_selesai' => (int) Setting::get('jam_selesai', 22),
            'foto_slots' => config('silap.foto_slots', ['07:00', '17:00']),
            'geotag' => config('silap.geotag'),
        ];

        return Inertia::render('Observations/Create', [
            'schedules' => $schedules,
            'instruments' => $instruments,
            'parameterOptions' => $parameterOptions,
            'previousValues' => $previousValues,
            'slotTerisi' => $slotTerisi,
            'hariIni' => $hariIni,
            'settings' => $settings,
            'aturanFisika' => $this->aturanFisikaUntukForm(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'schedule_id' => 'required|exists:schedules,id',
            'tanggal' => 'required|date|before_or_equal:' . now('Asia/Jakarta')->toDateString(),
            'status_pengamatan' => 'required|in:lengkap,dibatalkan',
            'alasan_batal' => 'nullable|required_if:status_pengamatan,dibatalkan|string',
            'foto' => 'nullable|string',
            'foto_sumber' => 'nullable|in:kamera,galeri',
            'values' => 'nullable|array',
        ], $this->pesanValidasi());

        $schedule = Schedule::findOrFail($validated['schedule_id']);
        $jamWib = substr((string) $schedule->jam_wib, 0, 5);
        $isMandatoryPhoto = in_array($jamWib, config('silap.foto_slots', ['07:00', '17:00']), true);

        if ($pesan = $this->slotSudahTerisi($validated['tanggal'], $schedule)) {
            return back()->withErrors(['schedule_id' => $pesan])->withInput();
        }

        if ($isMandatoryPhoto && empty($validated['foto']) && $validated['status_pengamatan'] === 'lengkap') {
            return back()->withErrors([
                'foto' => 'Foto bukti pengamatan wajib diambil pada slot pengamatan 07:00 WIB dan 17:00 WIB.',
            ])->withInput();
        }

        [$values, $fisikaErrors] = $this->olahNilai($validated['values'] ?? [], $validated['status_pengamatan']);
        if ($fisikaErrors) {
            return back()->withErrors($fisikaErrors)->withInput();
        }

        $fotoRef = $this->simpanFoto($validated['foto'] ?? null, $validated['tanggal']);
        if ($isMandatoryPhoto && !$fotoRef && $validated['status_pengamatan'] === 'lengkap') {
            return back()->withErrors(['foto' => 'Foto tidak terbaca. Ambil ulang foto dengan kamera lalu simpan kembali.'])->withInput();
        }

        $shift = (int) substr($schedule->jam_wib, 0, 2) < 15 ? 'pagi' : 'siang';

        $observation = Observation::create([
            'user_id' => $request->user()->id,
            'schedule_id' => $validated['schedule_id'],
            'tanggal' => $validated['tanggal'],
            'status_pengamatan' => $validated['status_pengamatan'],
            'alasan_batal' => $validated['alasan_batal'] ?? null,
            'shift' => $shift,
            'foto_path' => $fotoRef,
            'photo_slot' => $isMandatoryPhoto ? $jamWib : null,
            'photo_ref' => $fotoRef,
            'foto_sumber' => $fotoRef ? ($validated['foto_sumber'] ?? 'kamera') : null,
            'status_approval' => 'pending',
        ]);

        $this->simpanNilai($observation, $values);
        $this->antrekanUploadDrive($observation);

        return redirect()->route('observations.index')->with('message', 'Data observasi berhasil dicatat.');
    }

    /**
     * Normalise 9999, recompute the app-calculated fields server-side, then run the
     * physics checks. Returns [values keyed by parameter id, errors].
     */
    protected function olahNilai(array $values, string $statusPengamatan): array
    {
        foreach ($values as $paramId => $valData) {
            foreach (['manual', 'aws'] as $sumber) {
                $v = $valData[$sumber] ?? null;
                if (is_array($v)) {
                    $v = json_encode($v);
                }
                $values[$paramId][$sumber] = $this->normalkanTidakDiukur($v);
            }
        }

        if ($statusPengamatan !== 'lengkap') {
            return [$values, []];
        }

        $rules = app(\App\Services\ObservationRules::class);
        $params = InstrumentParameter::all();
        $values = $rules->hitungUlang($values, $params);

        return [$values, $rules->periksa($values, $params)];
    }

    protected function simpanNilai(Observation $observation, array $values): void
    {
        foreach ($values as $paramId => $valData) {
            $nilaiAws = $valData['aws'] ?? null;
            $nilaiManual = $valData['manual'] ?? null;

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

    protected function pesanValidasi(): array
    {
        return [
            'tanggal.before_or_equal' => 'Tanggal pengamatan tidak boleh melebihi hari ini.',
            'tanggal.required' => 'Tanggal pengamatan wajib diisi.',
            'schedule_id.required' => 'Slot jadwal pengamatan wajib dipilih.',
            'alasan_batal.required_if' => 'Alasan pembatalan wajib diisi.',
        ];
    }

    /**
     * One observation per slot per date for the whole station, like the national form
     * (one entry per station per hour). Returns the reason when the slot is taken.
     */
    protected function slotSudahTerisi(string $tanggal, Schedule $schedule, ?int $kecuali = null): ?string
    {
        $ada = Observation::with('user')
            ->whereDate('tanggal', $tanggal)
            ->where('schedule_id', $schedule->id)
            ->when($kecuali, fn ($q) => $q->where('id', '!=', $kecuali))
            ->first();

        if (!$ada) {
            return null;
        }

        $jam = str_replace(':', '.', substr((string) $schedule->jam_wib, 0, 5));
        $tgl = \Carbon\Carbon::parse($tanggal)->format('d/m/Y');

        return "Slot {$jam} WIB tanggal {$tgl} sudah diisi oleh " . ($ada->user->nama ?? 'pengamat lain')
            . '. Bila ada yang perlu diperbaiki, ubah observasi tersebut.';
    }

    /**
     * Store a captured photo (base64 data URL) on the server under tahun/bulan/tanggal,
     * the same folder layout used on Google Drive. Returns the storage ref.
     */
    protected function simpanFoto(?string $dataUrl, string $tanggal): ?string
    {
        if (empty($dataUrl) || !preg_match('/^data:image\/(\w+);base64,/', $dataUrl)) {
            return null;
        }

        $bytes = base64_decode(substr($dataUrl, strpos($dataUrl, ',') + 1), true);
        if ($bytes === false || $bytes === '') {
            return null;
        }

        $nama = \Carbon\Carbon::parse($tanggal)->format('Y/m/d') . '/obs_' . time() . '_' . uniqid() . '.webp';

        return app(\App\Services\PhotoStorage\PhotoStorageInterface::class)->store($bytes, $nama, 'image/webp')['ref'];
    }

    /** With PHOTO_DISK=drive, move the server copy to the Shared Drive in the background. */
    protected function antrekanUploadDrive(Observation $observation): void
    {
        if (config('silap.photo_disk') === 'drive' && \App\Services\PhotoStorage\LocalPhotoStorage::isLocalRef($observation->photo_ref)) {
            \App\Jobs\UploadObservationPhoto::dispatch($observation->id, $observation->photo_ref);
        }
    }

    /**
     * The national form uses 9999 as the "not measured" sentinel. Keep that out of the
     * database so aggregates and validation never treat it as a real reading; PDF and
     * CSV print 9999 again.
     */
    protected function normalkanTidakDiukur($nilai)
    {
        if ($nilai === null || $nilai === '') {
            return null;
        }

        return (is_numeric($nilai) && (float) $nilai == 9999.0) ? null : $nilai;
    }

    /**
     * Rules the form mirrors client-side; the server stays authoritative.
     */
    protected function aturanFisikaUntukForm(): array
    {
        return [
            'tidak_lebih_dari' => config('silap.aturan_fisika.tidak_lebih_dari'),
            'sebelum' => config('silap.aturan_fisika.sebelum'),
            'sebelum_boleh_turun' => config('silap.aturan_fisika.sebelum_boleh_turun'),
            'tidak_negatif' => config('silap.aturan_fisika.tidak_negatif'),
            'batas_aws' => config('silap.batas_aws'),
            'gunn_bellani_koefisien_default' => config('silap.gunn_bellani_koefisien_default'),
        ];
    }

    public function edit(Request $request, Observation $observation)
    {
        $user = $request->user();

        // Pengamat hanya boleh edit observasi miliknya sendiri
        if ($user->role === 'pengamat' && $observation->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengedit observasi ini.');
        }

        // Revisi per observasi dipertahankan sebagai jalur pengecualian: hanya boleh diedit jika statusnya 'revision' atau 'pending'
        // Setelah triwulan di-ACC data terkunci untuk semua peran; hanya admin yang bisa
        // membuka kunci triwulan (antrean validasi > Buka Kunci).
        if ($observation->status_approval === 'approved') {
            return redirect()->route('observations.index')->withErrors([
                'message' => 'Observasi ini terkunci karena triwulannya sudah di-ACC. Minta admin membuka kunci triwulan bila perlu diperbaiki.',
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
            'geotag' => config('silap.geotag'),
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
            'aturanFisika' => $this->aturanFisikaUntukForm(),
        ]);
    }

    public function update(Request $request, Observation $observation)
    {
        $user = $request->user();

        if ($user->role === 'pengamat' && $observation->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah observasi ini.');
        }

        if ($observation->status_approval === 'approved') {
            return redirect()->route('observations.index')->withErrors([
                'message' => 'Observasi ini terkunci karena triwulannya sudah di-ACC. Minta admin membuka kunci triwulan bila perlu diperbaiki.',
            ]);
        }

        $validated = $request->validate([
            'schedule_id' => 'required|exists:schedules,id',
            'tanggal' => 'required|date|before_or_equal:' . now('Asia/Jakarta')->toDateString(),
            'status_pengamatan' => 'required|in:lengkap,dibatalkan',
            'alasan_batal' => 'nullable|required_if:status_pengamatan,dibatalkan|string',
            'foto' => 'nullable|string',
            'foto_sumber' => 'nullable|in:kamera,galeri',
            'values' => 'nullable|array',
        ], $this->pesanValidasi());

        $schedule = Schedule::findOrFail($validated['schedule_id']);
        $jamWib = substr((string) $schedule->jam_wib, 0, 5);
        $isMandatoryPhoto = in_array($jamWib, config('silap.foto_slots', ['07:00', '17:00']), true);

        if ($pesan = $this->slotSudahTerisi($validated['tanggal'], $schedule, $observation->id)) {
            return back()->withErrors(['schedule_id' => $pesan])->withInput();
        }

        if ($isMandatoryPhoto && empty($validated['foto']) && empty($observation->foto_path) && $validated['status_pengamatan'] === 'lengkap') {
            return back()->withErrors([
                'foto' => 'Foto bukti pengamatan wajib diambil pada slot pengamatan 07:00 WIB dan 17:00 WIB.',
            ])->withInput();
        }

        [$values, $fisikaErrors] = $this->olahNilai($validated['values'] ?? [], $validated['status_pengamatan']);
        if ($fisikaErrors) {
            return back()->withErrors($fisikaErrors)->withInput();
        }

        // A new photo replaces the old one; otherwise the stored photo is kept as is.
        $fotoBaru = $this->simpanFoto($validated['foto'] ?? null, $validated['tanggal']);
        $kolomFoto = $fotoBaru ? [
            'foto_path' => $fotoBaru,
            'photo_ref' => $fotoBaru,
            'foto_sumber' => $validated['foto_sumber'] ?? 'kamera',
            'foto_gdrive_id' => null,
            'foto_gdrive_url' => null,
        ] : [];

        $shift = (int) substr($schedule->jam_wib, 0, 2) < 15 ? 'pagi' : 'siang';

        // Simpan perubahan: status kembali ke pending untuk ditinjau penyelia ulang
        $observation->update([
            'schedule_id' => $validated['schedule_id'],
            'tanggal' => $validated['tanggal'],
            'status_pengamatan' => $validated['status_pengamatan'],
            'alasan_batal' => $validated['alasan_batal'] ?? null,
            'shift' => $shift,
            'photo_slot' => $isMandatoryPhoto ? $jamWib : null,
            'status_approval' => 'pending',
            'catatan_supervisor' => null, // reset catatan revisi setelah diperbaiki
        ] + $kolomFoto);

        if ($fotoBaru) {
            $this->antrekanUploadDrive($observation);
        }

        // Re-sync values
        if (!empty($validated['values']) && is_array($validated['values'])) {
            ObservationValue::where('observation_id', $observation->id)->delete();
            $this->simpanNilai($observation, $values);
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

        // Ordered the way the national form (BMKGSoft v2 > Klimatologi > FDIH) lays its
        // cards out, so the sheet can be read straight down while typing there.
        $parameters = InstrumentParameter::orderBy('kartu')
            ->orderBy('urutan')
            ->get()
            ->filter(function ($param) use ($jamWib) {
                return $param->isScheduledForSlot($jamWib);
            });

        $nilai = [];
        foreach ($observation->values as $v) {
            if ($v->parameter?->kode) {
                $nilai[$v->parameter->kode] = [
                    'manual' => $v->nilai_manual,
                    'aws' => $v->nilai_aws,
                ];
            }
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.observation_hourly', [
            'observation' => $observation,
            'parameters'  => $parameters,
            'kartu'       => $parameters->groupBy(fn ($p) => $p->kartu ?? 8),
            'nilai'       => $nilai,
            'jamWib'      => $jamWib,
        ])->setPaper('a4', 'portrait');

        $fileName = 'Observasi_' . str_replace(':', '', $jamWib) . 'WIB_' . $observation->tanggal . '.pdf';
        return $pdf->stream($fileName);
    }

    public function viewPhoto(Request $request, Observation $observation)
    {
        $user = $request->user();

        if ($user->role === 'pengamat' && $observation->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses untuk melihat foto observasi ini.');
        }

        // Streamed through the server: the local copy is private and the Drive folder
        // has no public access, so neither can be linked to directly.
        $ref = $observation->photo_ref ?: $observation->foto_path ?: $observation->foto_gdrive_id;
        $bytes = $ref ? app(\App\Services\PhotoStorage\PhotoStorageInterface::class)->get($ref) : null;

        if ($bytes === null && $ref && !\App\Services\PhotoStorage\LocalPhotoStorage::isLocalRef($ref)) {
            $bytes = app(\App\Services\GoogleDriveService::class)->getFileContent($ref);
        }

        if ($bytes === null || $bytes === '') {
            abort(404, 'Foto observasi tidak ditemukan.');
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes) ?: 'image/webp';

        return response($bytes)
            ->header('Content-Type', $mime)
            ->header('Cache-Control', 'private, max-age=3600');
    }
}

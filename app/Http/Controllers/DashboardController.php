<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\InstrumentParameter;
use App\Models\Observation;
use App\Models\ParameterOption;
use App\Models\RekapSkpTriwulan;
use App\Models\Schedule;
use App\Models\User;
use App\Services\GoogleDriveService;
use App\Services\ShiftReportImageService;
use App\Services\SkpPdfBuilder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Throwable;

/**
 * Task-oriented dashboards (one per role). Every slot list comes from the schedules
 * table, so the page follows the station's real timetable (currently 16 full hours +
 * 3 AGM 1-B slots) without hard-coded counts.
 */
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $sekarang = now('Asia/Jakarta');
        $hariIni = $sekarang->toDateString();
        $schedules = Schedule::orderBy('jam_wib')->get();
        $triwulan = 'T' . (intdiv($sekarang->month - 1, 3) + 1);

        $data = match ($user->role) {
            'pengamat' => $this->dataPengamat($user, $sekarang, $schedules, $triwulan),
            'penyelia' => $this->dataPenyelia($sekarang, $schedules, $triwulan),
            'admin' => $this->dataAdmin(),
            default => [],
        };

        return Inertia::render('Dashboard', $data + [
            'user' => $user,
            'hariIni' => $hariIni,
            'triwulan' => $triwulan,
            'tahun' => $sekarang->year,
            'periodeLabel' => SkpReportController::getPeriodeLabel($triwulan),
        ]);
    }

    // ---- Pengamat: what should I do now ------------------------------------------

    protected function dataPengamat(User $user, Carbon $sekarang, Collection $schedules, string $triwulan): array
    {
        $hariIni = $sekarang->toDateString();
        $obsHariIni = Observation::with('user:id,nama')->whereDate('tanggal', $hariIni)->get()->keyBy('schedule_id');
        $menitSekarang = $sekarang->hour * 60 + $sekarang->minute;

        $slot = $schedules->map(function ($s) use ($obsHariIni, $user, $menitSekarang) {
            $o = $obsHariIni->get($s->id);
            [$j, $m] = array_map('intval', explode(':', substr((string) $s->jam_wib, 0, 5)));
            return [
                'id' => $s->id,
                'jam' => substr((string) $s->jam_wib, 0, 5),
                'kelompok' => $s->kelompok,
                'shift' => $s->shift,
                'wajibFoto' => (bool) $s->is_mandatory_photo,
                'lewat' => $j * 60 + $m <= $menitSekarang,
                'observasi' => $o ? [
                    'id' => $o->id,
                    'oleh' => $o->user->nama ?? '-',
                    'milikSaya' => $o->user_id === $user->id,
                    'status' => $o->status_approval,
                    'dibatalkan' => $o->status_pengamatan === 'dibatalkan',
                    'adaFoto' => !empty($o->photo_ref) || !empty($o->foto_path),
                ] : null,
            ];
        })->values();

        // Next slot to fill: the earliest empty slot whose time has come, else the next one.
        $kosong = $slot->filter(fn ($s) => !$s['observasi']);
        $berikutnya = $kosong->first(fn ($s) => $s['lewat']) ?? $kosong->first();

        $revisi = Observation::with('schedule')
            ->where('user_id', $user->id)
            ->where('status_approval', 'revision')
            ->orderBy('tanggal')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'tanggal' => Carbon::parse($o->tanggal)->format('Y-m-d'),
                'jam' => substr((string) $o->schedule?->jam_wib, 0, 5),
                'catatan' => $o->catatan_supervisor,
            ]);

        // Current shift summary, the same numbers as the shift report image.
        $shiftSekarang = $sekarang->hour < 15 ? 'pagi' : 'siang';
        $ringkasanShift = null;
        $acuan = Observation::with(['schedule', 'values.parameter'])
            ->whereDate('tanggal', $hariIni)->where('shift', $shiftSekarang)->first();
        if ($acuan) {
            try {
                $ringkasanShift = collect(app(ShiftReportImageService::class)->dataShift($acuan, $shiftSekarang))
                    ->except('waktu_input')->all();
            } catch (Throwable) {
                $ringkasanShift = null;
            }
        }

        return [
            'slotHariIni' => $slot,
            'slotBerikutnya' => $berikutnya,
            'kelengkapanHariIni' => $this->kelengkapan($slot),
            'perluDiperbaiki' => $revisi,
            'shiftSekarang' => $shiftSekarang,
            'ringkasanShift' => $ringkasanShift,
            'triwulanSaya' => $this->triwulanPegawai($user, $sekarang->year, $triwulan),
        ];
    }

    /** Daily completeness: full-hour slots and AGM 1-B slots counted separately. */
    protected function kelengkapan(Collection $slot): array
    {
        $hitung = fn (string $k) => [
            'terisi' => $slot->filter(fn ($s) => $s['kelompok'] === $k && $s['observasi'])->count(),
            'total' => $slot->where('kelompok', $k)->count(),
        ];

        return ['jamPenuh' => $hitung('JAM_PENUH'), 'agm1b' => $hitung('AGM1B')];
    }

    /**
     * One employee's quarter so far. Before ACC everything is still pending, so the
     * completeness uses every recorded observation; the SKP itself counts approved only.
     */
    protected function triwulanPegawai(User $pegawai, int $tahun, string $triwulan): array
    {
        $obs = $this->observasiTriwulan($tahun, $triwulan)->with('schedule')->where('user_id', $pegawai->id)->get();
        $recap = RekapSkpTriwulan::where('user_id', $pegawai->id)->where('tahun', $tahun)->where('triwulan', $triwulan)->first();
        $r = app(SkpPdfBuilder::class)->ringkasan($obs);

        return [
            'pegawai' => ['id' => $pegawai->id, 'nama' => $pegawai->nama, 'nip' => $pegawai->nip],
            'jumlahObservasi' => $obs->count(),
            'jadwal' => $r['jadwal'],
            'kelengkapan' => $r['kepatuhan'],
            'fotoTerpenuhi' => $r['fotoTerpenuhi'],
            'fotoWajib' => $r['fotoWajib'],
            'revisi' => $obs->where('status_approval', 'revision')->count(),
            'fotoGaleri' => $obs->where('foto_sumber', 'galeri')->count(),
            'statusAcc' => $recap?->status === 'approved' ? 'approved' : 'pending',
            'tanggalAcc' => $recap?->approved_at?->toDateString(),
            'recapId' => $recap?->status === 'approved' ? $recap->id : null,
        ];
    }

    protected function observasiTriwulan(int $tahun, string $triwulan)
    {
        $awal = Carbon::create($tahun, (int) substr($triwulan, 1) * 3 - 2, 1);

        return Observation::query()
            ->where('tanggal', '>=', $awal->toDateString())
            ->where('tanggal', '<', $awal->copy()->addMonths(3)->toDateString());
    }

    // ---- Penyelia: what do I need to verify --------------------------------------

    protected function dataPenyelia(Carbon $sekarang, Collection $schedules, string $triwulan): array
    {
        $statusPegawai = User::where('role', 'pengamat')->orderBy('nama')->get()
            ->map(function ($p) use ($sekarang, $triwulan) {
                $t = $this->triwulanPegawai($p, $sekarang->year, $triwulan);
                $t['siapAcc'] = $t['statusAcc'] !== 'approved' && $t['revisi'] === 0 && $t['jumlahObservasi'] > 0;
                return $t;
            });

        return [
            'statusTriwulan' => $statusPegawai,
            'kalender' => $this->kalenderBulanIni($sekarang, $schedules),
            'shiftTanpaFoto' => $this->shiftTanpaFoto($sekarang, $schedules),
        ];
    }

    /** Station completeness per day this month: full-hour and AGM 1-B slots filled. */
    protected function kalenderBulanIni(Carbon $sekarang, Collection $schedules): array
    {
        $awal = $sekarang->copy()->startOfMonth();
        $kelompok = $schedules->pluck('kelompok', 'id');
        $total = ['JAM_PENUH' => $kelompok->filter(fn ($k) => $k === 'JAM_PENUH')->count(), 'AGM1B' => $kelompok->filter(fn ($k) => $k === 'AGM1B')->count()];

        $terisi = Observation::where('tanggal', '>=', $awal->toDateString())
            ->where('tanggal', '<', $awal->copy()->addMonth()->toDateString())
            ->get(['tanggal', 'schedule_id'])
            ->groupBy(fn ($o) => Carbon::parse($o->tanggal)->toDateString());

        $hari = [];
        for ($d = $awal->copy(); $d->month === $awal->month; $d->addDay()) {
            $slotHari = ($terisi[$d->toDateString()] ?? collect())->pluck('schedule_id')->unique();
            $jp = $slotHari->filter(fn ($id) => ($kelompok[$id] ?? null) === 'JAM_PENUH')->count();
            $hari[] = [
                'tanggal' => $d->toDateString(),
                'hari' => $d->day,
                'hariMinggu' => $d->dayOfWeekIso, // 1 = Senin
                'jamPenuh' => $jp,
                'agm1b' => $slotHari->filter(fn ($id) => ($kelompok[$id] ?? null) === 'AGM1B')->count(),
                'persen' => $total['JAM_PENUH'] ? (int) round($jp / $total['JAM_PENUH'] * 100) : 0,
                'nanti' => $d->toDateString() > $sekarang->toDateString(),
                'hariIni' => $d->toDateString() === $sekarang->toDateString(),
            ];
        }

        return ['hari' => $hari, 'totalJamPenuh' => $total['JAM_PENUH'], 'totalAgm1b' => $total['AGM1B']];
    }

    /** Photo slots of this month whose time has passed but have no photo (or no entry). */
    protected function shiftTanpaFoto(Carbon $sekarang, Collection $schedules): array
    {
        $slotFoto = $schedules->filter(fn ($s) => $s->is_mandatory_photo);
        $awal = $sekarang->copy()->startOfMonth();
        $obs = Observation::with('user:id,nama')
            ->whereIn('schedule_id', $slotFoto->pluck('id'))
            ->where('tanggal', '>=', $awal->toDateString())
            ->where('tanggal', '<=', $sekarang->toDateString() . ' 23:59:59')
            ->get()
            ->keyBy(fn ($o) => Carbon::parse($o->tanggal)->toDateString() . '|' . $o->schedule_id);

        $hasil = [];
        for ($d = $awal->copy(); $d->lte($sekarang); $d->addDay()) {
            foreach ($slotFoto as $s) {
                $jam = substr((string) $s->jam_wib, 0, 5);
                if ($d->isSameDay($sekarang) && $jam > $sekarang->format('H:i')) {
                    continue; // not due yet
                }
                $o = $obs->get($d->toDateString() . '|' . $s->id);
                if ($o && (!empty($o->photo_ref) || !empty($o->foto_path) || $o->status_pengamatan === 'dibatalkan')) {
                    continue;
                }
                $hasil[] = [
                    'tanggal' => $d->toDateString(),
                    'jam' => $jam,
                    'shift' => $s->shift,
                    'keterangan' => $o ? 'Tersimpan tanpa foto (' . ($o->user->nama ?? '-') . ')' : 'Slot belum diisi',
                ];
            }
        }

        return array_reverse($hasil);
    }

    // ---- Admin: is the system healthy --------------------------------------------

    protected function dataAdmin(): array
    {
        $driveAktif = config('silap.photo_disk') === 'drive';
        try {
            $driveTerkonfigurasi = app(GoogleDriveService::class)->isConfigured();
        } catch (Throwable) {
            $driveTerkonfigurasi = false;
        }

        $gagal = DB::table('failed_jobs')->orderByDesc('failed_at')->limit(5)->get(['id', 'queue', 'payload', 'exception', 'failed_at'])
            ->map(fn ($j) => [
                'id' => $j->id,
                'job' => class_basename(json_decode($j->payload, true)['displayName'] ?? 'Job'),
                'pesan' => mb_substr(strtok((string) $j->exception, "\n"), 0, 200),
                'waktu' => $j->failed_at,
            ]);

        $pilihanKosong = InstrumentParameter::where('tipe_input', 'select')->get(['kode', 'label'])
            ->filter(fn ($p) => !ParameterOption::where('parameter_kode', $p->kode)->exists())
            ->values();

        return [
            'sistem' => [
                'photoDisk' => config('silap.photo_disk'),
                'driveAktif' => $driveAktif,
                'driveTerkonfigurasi' => $driveTerkonfigurasi,
                'fotoMenungguUpload' => $driveAktif
                    ? Observation::whereNotNull('photo_ref')->whereNull('foto_gdrive_id')->where('photo_ref', 'like', '%/%')->count()
                    : 0,
                'queueConnection' => config('queue.default'),
                'jobAntre' => DB::table('jobs')->count(),
                'jobGagal' => DB::table('failed_jobs')->count(),
                'jobGagalTerbaru' => $gagal,
            ],
            'akunBelumGantiPassword' => User::where('must_change_password', true)->orderBy('nama')->get(['id', 'nama', 'nip', 'role']),
            'riwayatBukaKunci' => RekapSkpTriwulan::with(['user:id,nama'])
                ->whereNotNull('dibuka_at')->orderByDesc('dibuka_at')->limit(10)->get()
                ->map(fn ($r) => [
                    'pegawai' => $r->user->nama ?? '-',
                    'periode' => $r->triwulan . ' ' . $r->tahun,
                    'oleh' => User::find($r->dibuka_oleh)?->nama ?? '-',
                    'waktu' => $r->dibuka_at?->toDateTimeString(),
                    'alasan' => $r->alasan_buka,
                ]),
            'konfigurasi' => [
                'pilihanKosong' => $pilihanKosong,
                'parameterNonaktif' => InstrumentParameter::where('is_active', false)->orderBy('kartu')->orderBy('urutan')->get(['id', 'label', 'kartu']),
                'alatNonaktif' => Instrument::where('is_active', false)->get(['id', 'nama']),
                'jumlahPengguna' => User::selectRaw('role, COUNT(*) as n')->groupBy('role')->pluck('n', 'role'),
            ],
        ];
    }
}

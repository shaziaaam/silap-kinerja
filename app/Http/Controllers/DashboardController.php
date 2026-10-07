<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\Observation;
use App\Models\PhenologyEntry;
use App\Models\PhenologyPlant;
use App\Models\Schedule;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $today = now()->format('Y-m-d');
        $nowWib = now()->timezone('Asia/Jakarta');
        $currentWibHour = (int) $nowWib->format('H');
        $currentWibMinute = (int) $nowWib->format('i');

        $settings = [
            'jam_mulai' => (int) Setting::get('jam_mulai', 7),
            'jam_selesai' => (int) Setting::get('jam_selesai', 22),
            'hujan_slot_awal' => (int) Setting::get('hujan_slot_awal', 8),
        ];

        // Next slot logic: if minute >= 30, round to next hour (matching form auto-selection)
        $targetSlotHour = $currentWibHour;
        if ($currentWibMinute >= 30) {
            $targetSlotHour++;
        }

        if ($targetSlotHour < $settings['jam_mulai']) {
            $targetSlotHour = $settings['jam_mulai'];
        } elseif ($targetSlotHour > $settings['jam_selesai']) {
            $targetSlotHour = $settings['jam_selesai'];
        }

        // Standard timeline 16 slots (07 to 22)
        $schedules = Schedule::orderBy('jam_utc', 'asc')->get();

        // Check today's submitted observations
        $todayObservations = Observation::with(['schedule', 'values.parameter'])
            ->where('tanggal', $today)
            ->get();

        $submittedScheduleIds = $todayObservations->pluck('schedule_id')->toArray();

        // Find next un-submitted schedule starting from targetSlotHour
        $nextSchedule = null;
        foreach ($schedules as $s) {
            $h = (int) substr($s->jam_wib, 0, 2);
            if ($h >= $targetSlotHour && !in_array($s->id, $submittedScheduleIds, true)) {
                $nextSchedule = $s;
                break;
            }
        }

        // Fallback to targetSlotHour or last operational slot if all are submitted
        if (!$nextSchedule) {
            $nextSchedule = $schedules->firstWhere('jam_wib', sprintf('%02d:00:00', $targetSlotHour))
                ?? $schedules->firstWhere('jam_wib', sprintf('%02d:00:00', $settings['jam_selesai']));
        }

        // Hourly rainfall & cumulative
        $rainHourlyData = [];
        $cumulativeRain = 0;
        $latestRainHour = null;
        $latestSuhuAws = null;
        $latestSuhuHour = null;
        $latestQff = null;
        $latestQffHour = null;

        // Wind direction frequencies
        $windDirections = ['U' => 0, 'TL' => 0, 'T' => 0, 'BD' => 0, 'S' => 0, 'BD2' => 0, 'B' => 0, 'BL' => 0];

        foreach ($schedules as $s) {
            $h = (int) substr($s->jam_wib, 0, 2);
            $obs = $todayObservations->firstWhere('schedule_id', $s->id);

            $rainVal = 0;
            if ($obs) {
                foreach ($obs->values as $valObj) {
                    $code = $valObj->parameter->kode ?? '';
                    if ($code === 'curah_hujan_jam') {
                        $rainVal = (float) ($valObj->nilai_aws ?? $valObj->nilai_manual ?? 0);
                    }
                    if ($code === 'suhu_udara_aws' || $code === 'suhu_bola_kering') {
                        $latestSuhuAws = (float) ($valObj->nilai_aws ?? $valObj->nilai_manual);
                        $latestSuhuHour = $h;
                    }
                    if ($code === 'tekanan_qff') {
                        $latestQff = (float) ($valObj->nilai_aws ?? $valObj->nilai_manual);
                        $latestQffHour = $h;
                    }
                    if (str_starts_with($code, 'arah_angin')) {
                        $deg = (float) ($valObj->nilai_aws ?? $valObj->nilai_manual);
                        if ($deg > 0) {
                            $dirKey = $this->degToDirection($deg);
                            if (isset($windDirections[$dirKey])) {
                                $windDirections[$dirKey]++;
                            }
                        }
                    }
                }
            }

            if ($h >= $settings['hujan_slot_awal']) {
                $cumulativeRain += $rainVal;
            }

            $rainHourlyData[] = [
                'hour' => $h,
                'label' => sprintf('%02d.00', $h),
                'rain' => $rainVal,
                'cumulative' => $h >= $settings['hujan_slot_awal'] ? $cumulativeRain : null,
                'isAccumulated' => $h >= $settings['hujan_slot_awal'],
                'hasInput' => $obs !== null,
            ];

            if ($obs) {
                $latestRainHour = $h;
            }
        }

        // Soil temperatures for depths [0, 5, 10, 20, 50, 100]
        $depths = [0, 5, 10, 20, 50, 100];
        $latestObs = $todayObservations->sortByDesc('created_at')->first();
        $soilTempGundul = [];
        $soilTempRumput = [];

        foreach ($depths as $d) {
            $gundulVal = null;
            $rumputVal = null;
            if ($latestObs) {
                foreach ($latestObs->values as $v) {
                    $c = $v->parameter->kode ?? '';
                    if ($c === "suhu_tanah_gundul_{$d}cm") $gundulVal = (float) ($v->nilai_aws ?? $v->nilai_manual);
                    if ($c === "suhu_tanah_rumput_{$d}cm") $rumputVal = (float) ($v->nilai_aws ?? $v->nilai_manual);
                }
            }
            $soilTempGundul[] = ['depth' => $d, 'val' => $gundulVal];
            $soilTempRumput[] = ['depth' => $d, 'val' => $rumputVal];
        }

        // 2. PENYELIA DATA
        $pendingCount = Observation::where('status_approval', 'pending')->count();
        $approvedTodayCount = Observation::where('status_approval', 'approved')->where('tanggal', $today)->count();
        $revisionCount = Observation::where('status_approval', 'revision')->count();

        // Queue per observer
        $observers = User::where('role', 'pengamat')->get();
        $observerQueue = [];
        foreach ($observers as $obsUser) {
            $userPending = Observation::where('user_id', $obsUser->id)->where('status_approval', 'pending')->count();
            $userTodayFilled = Observation::where('user_id', $obsUser->id)->where('tanggal', $today)->count();
            $observerQueue[] = [
                'id' => $obsUser->id,
                'nama' => $obsUser->nama,
                'nip' => $obsUser->nip,
                'pendingCount' => $userPending,
                'todaySlots' => $userTodayFilled,
                'isComplete' => $userTodayFilled === 16,
            ];
        }

        // Calendar Heatmap data (Current Month)
        $daysInMonth = now()->daysInMonth;
        $heatmapData = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dateStr = sprintf('%04d-%02d-%02d', now()->year, now()->month, $d);
            $cnt = Observation::where('tanggal', $dateStr)->count();
            $percentage = round(($cnt / 16) * 100);
            $heatmapData[] = [
                'day' => $d,
                'dateStr' => $dateStr,
                'count' => $cnt,
                'percentage' => $percentage,
                'isToday' => $dateStr === $today,
                'isFuture' => $dateStr > $today,
            ];
        }

        // 3. ADMIN DATA
        $totalInstruments = Instrument::count();
        $activeInstruments = Instrument::where('is_active', true)->count();
        $roleBreakdown = [
            'pengamat' => User::where('role', 'pengamat')->count(),
            'penyelia' => User::where('role', 'penyelia')->count(),
            'admin'    => User::where('role', 'admin')->count(),
        ];
        $totalPlants = PhenologyPlant::where('is_active', true)->count();
        $phenoTodayCount = PhenologyEntry::where('tanggal', $today)->count();

        // Instrument status grid
        $instruments = Instrument::with('parameters')->get();
        $instrumentStatusGrid = [];
        foreach ($instruments as $inst) {
            $lastInput = Observation::whereHas('values.parameter', function ($q) use ($inst) {
                $q->where('instrument_id', $inst->id);
            })->orderBy('tanggal', 'desc')->first();

            $status = 'aktif';
            $statusText = 'Aktif & Berfungsi';

            if (!$inst->is_active) {
                $status = 'nonaktif';
                $statusText = 'Nonaktif';
            } elseif (!$lastInput || Carbon::parse($lastInput->tanggal)->diffInDays(now()) >= 2) {
                $status = 'perlu_perhatian';
                $statusText = 'belum diisi 2 hari';
            }

            $instrumentStatusGrid[] = [
                'id' => $inst->id,
                'nama' => $inst->nama,
                'kategori' => $inst->kategori,
                'isActive' => $inst->is_active,
                'status' => $status,
                'statusText' => $statusText,
                'paramCount' => $inst->parameters->count(),
            ];
        }

        // Phenology Tracker per plant
        $plants = PhenologyPlant::where('is_active', true)->get();
        $phenoTracker = [];
        foreach ($plants as $pl) {
            $entryToday = PhenologyEntry::with('entryPhases.phase')->where('plant_id', $pl->id)->where('tanggal', $today)->first();
            $lastEntry = PhenologyEntry::with('entryPhases.phase')->where('plant_id', $pl->id)->orderBy('tanggal', 'desc')->first();

            $targetEntry = $entryToday ?: $lastEntry;
            $phasesData = [];
            $allPhases = \App\Models\PhenologyPhase::where('is_active', true)->orderBy('urutan')->get();

            $currentStageText = 'belum diisi';
            $isTodayFilled = $entryToday !== null;

            foreach ($allPhases as $ph) {
                $ep = $targetEntry ? $targetEntry->entryPhases->firstWhere('phase_id', $ph->id) : null;
                $phasesData[] = [
                    'phaseId' => $ph->id,
                    'phaseNama' => $ph->nama,
                    'isReached' => $ep !== null,
                    'tahap' => $ep ? $ep->tahap : null,
                ];
                if ($ep) {
                    $currentStageText = "{$ph->nama}: {$ep->tahap}";
                }
            }

            $phenoTracker[] = [
                'plantId' => $pl->id,
                'plantNama' => $pl->nama,
                'isTodayFilled' => $isTodayFilled,
                'stageText' => $currentStageText,
                'phases' => $phasesData,
            ];
        }

        return Inertia::render('Dashboard', [
            'user' => $user,
            'settings' => $settings,
            'today' => $today,
            'currentWibHour' => $currentWibHour,
            'nextSchedule' => $nextSchedule,
            'schedules' => $schedules,
            'todayObservations' => $todayObservations,
            'rainHourlyData' => $rainHourlyData,
            'totalRainToday' => $cumulativeRain,
            'latestRainHour' => $latestRainHour,
            'latestSuhuAws' => $latestSuhuAws,
            'latestSuhuHour' => $latestSuhuHour,
            'latestQff' => $latestQff,
            'latestQffHour' => $latestQffHour,
            'soilTempGundul' => $soilTempGundul,
            'soilTempRumput' => $soilTempRumput,
            'windDirections' => $windDirections,
            'pendingCount' => $pendingCount,
            'approvedTodayCount' => $approvedTodayCount,
            'revisionCount' => $revisionCount,
            'observerQueue' => $observerQueue,
            'heatmapData' => $heatmapData,
            'totalInstruments' => $totalInstruments,
            'activeInstruments' => $activeInstruments,
            'roleBreakdown' => $roleBreakdown,
            'totalPlants' => $totalPlants,
            'phenoTodayCount' => $phenoTodayCount,
            'instrumentStatusGrid' => $instrumentStatusGrid,
            'phenoTracker' => $phenoTracker,
        ]);
    }

    private function degToDirection(float $deg): string
    {
        $deg = fmod($deg, 360);
        if ($deg < 0) $deg += 360;

        if ($deg >= 337.5 || $deg < 22.5) return 'U';
        if ($deg >= 22.5 && $deg < 67.5) return 'TL';
        if ($deg >= 67.5 && $deg < 112.5) return 'T';
        if ($deg >= 112.5 && $deg < 157.5) return 'BD';
        if ($deg >= 157.5 && $deg < 202.5) return 'S';
        if ($deg >= 202.5 && $deg < 247.5) return 'BD2';
        if ($deg >= 247.5 && $deg < 292.5) return 'B';
        return 'BL';
    }
}

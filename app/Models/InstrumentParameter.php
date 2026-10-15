<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstrumentParameter extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'jadwal_baca' => 'array',
        'batas_min' => 'float',
        'batas_max' => 'float',
        'urutan' => 'integer',
        'faktor_konversi' => 'float',
        'is_active' => 'boolean',
    ];

    public function instrument()
    {
        return $this->belongsTo(Instrument::class);
    }

    public function observationValues()
    {
        return $this->hasMany(ObservationValue::class, 'parameter_id');
    }

    public function isScheduledForSlot(string $jamWib, ?string $kelompok = null): bool
    {
        $jam5 = substr($jamWib, 0, 5); // e.g. "07:00", "07:30"
        $isAgm1bSlot = in_array($jam5, ['07:30', '13:30', '17:30'], true);

        $jb = $this->jadwal_baca;
        if (empty($jb)) {
            return ($this->kartu !== null && $this->kartu <= 7) ? $isAgm1bSlot : !$isAgm1bSlot;
        }

        if (is_array($jb)) {
            if (in_array('AGM1B', $jb, true)) {
                return $isAgm1bSlot;
            }
            if (in_array('HARIAN_0700', $jb, true)) {
                return $jam5 === '07:00';
            }
            if (in_array('JAM_PENUH', $jb, true)) {
                return !$isAgm1bSlot;
            }
            $wibHour = (int) substr($jamWib, 0, 2);
            return in_array($wibHour, $jb, true);
        }

        if ($jb === 'AGM1B') {
            return $isAgm1bSlot;
        }
        if ($jb === 'HARIAN_0700') {
            return $jam5 === '07:00';
        }
        if ($jb === 'JAM_PENUH') {
            return !$isAgm1bSlot;
        }

        return true;
    }

    public function isScheduledFor($wibHourOrJam): bool
    {
        if (is_string($wibHourOrJam) && str_contains($wibHourOrJam, ':')) {
            return $this->isScheduledForSlot($wibHourOrJam);
        }
        $jamStr = sprintf('%02d:00', (int) $wibHourOrJam);
        return $this->isScheduledForSlot($jamStr);
    }
}

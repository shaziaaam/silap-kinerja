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

    public function isScheduledFor(int $wibHour): bool
    {
        if ($this->jadwal_baca === null) {
            return true;
        }
        return in_array($wibHour, $this->jadwal_baca);
    }
}

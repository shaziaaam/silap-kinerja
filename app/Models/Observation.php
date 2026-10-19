<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Observation extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class, 'schedule_id');
    }

    public function values()
    {
        return $this->hasMany(ObservationValue::class)->with('parameter');
    }

    protected $appends = ['foto_url', 'shift_name'];

    /** Photos are private: always served through the authenticated route. */
    public function getFotoUrlAttribute(): ?string
    {
        $adaFoto = $this->photo_ref || $this->foto_path || $this->foto_gdrive_id;

        return $adaFoto && $this->exists ? route('observations.photo', $this->id) : null;
    }

    public function getShiftNameAttribute(): string
    {
        if (!empty($this->shift)) {
            return $this->shift === 'pagi' ? 'Shift Pagi' : 'Shift Siang';
        }
        return ($this->schedule?->shift ?? 'pagi') === 'pagi' ? 'Shift Pagi' : 'Shift Siang';
    }

    /**
     * Get a specific parameter value by parameter code.
     */
    public function getValue(string $parameterKode): ?ObservationValue
    {
        return $this->values->first(fn($v) => $v->parameter?->kode === $parameterKode);
    }
}

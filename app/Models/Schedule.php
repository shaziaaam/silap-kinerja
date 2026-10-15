<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'jam_utc',
        'jam_wib',
        'is_synoptic',
        'kelompok',
        'shift',
        'is_mandatory_photo',
    ];

    protected $casts = [
        'is_synoptic' => 'boolean',
        'is_mandatory_photo' => 'boolean',
    ];

    public function getIsMandatoryPhotoAttribute($value): bool
    {
        if ($value !== null) {
            return (bool) $value;
        }
        $jam = substr((string) $this->jam_wib, 0, 5);
        return in_array($jam, ['07:00', '17:00'], true);
    }

    public function getKelompokAttribute($value): string
    {
        if (!empty($value)) {
            return $value;
        }
        $jam = substr((string) $this->jam_wib, 0, 5);
        return in_array($jam, ['07:30', '13:30', '17:30'], true) ? 'AGM1B' : 'JAM_PENUH';
    }

    public function getShiftAttribute($value): string
    {
        if (!empty($value)) {
            return $value;
        }
        $hour = (int) substr((string) $this->jam_wib, 0, 2);
        return $hour < 15 ? 'pagi' : 'siang';
    }

    public function observations()
    {
        return $this->hasMany(Observation::class);
    }
}

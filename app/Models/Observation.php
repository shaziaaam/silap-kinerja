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

    /**
     * Get a specific parameter value by parameter code.
     */
    public function getValue(string $parameterKode): ?ObservationValue
    {
        return $this->values->first(fn($v) => $v->parameter?->kode === $parameterKode);
    }
}

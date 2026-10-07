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
    ];

    protected $casts = [
        'is_synoptic' => 'boolean',
    ];

    public function observations()
    {
        return $this->hasMany(Observation::class);
    }
}

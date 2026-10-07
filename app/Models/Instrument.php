<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Instrument extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'urutan_form' => 'integer',
    ];

    public function parameters()
    {
        return $this->hasMany(InstrumentParameter::class)->orderBy('urutan_form');
    }

    public function activeParameters()
    {
        return $this->hasMany(InstrumentParameter::class)->orderBy('urutan_form');
    }
}

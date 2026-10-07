<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ObservationValue extends Model
{
    protected $guarded = ['id'];

    public function observation()
    {
        return $this->belongsTo(Observation::class);
    }

    public function parameter()
    {
        return $this->belongsTo(InstrumentParameter::class, 'parameter_id');
    }
}

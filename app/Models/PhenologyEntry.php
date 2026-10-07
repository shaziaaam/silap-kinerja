<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhenologyEntry extends Model
{
    protected $guarded = ['id'];
    protected $casts = ['tanggal' => 'date'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plant()
    {
        return $this->belongsTo(PhenologyPlant::class, 'plant_id');
    }

    public function entryPhases()
    {
        return $this->hasMany(PhenologyEntryPhase::class, 'entry_id')->with('phase');
    }
}

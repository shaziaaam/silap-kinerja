<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhenologyEntryPhase extends Model
{
    protected $guarded = ['id'];

    public function entry()
    {
        return $this->belongsTo(PhenologyEntry::class, 'entry_id');
    }

    public function phase()
    {
        return $this->belongsTo(PhenologyPhase::class, 'phase_id');
    }
}

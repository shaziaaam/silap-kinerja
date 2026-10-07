<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'nama',
        'nip',
        'email',
        'role',
        'password',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'must_change_password' => 'boolean',
    ];

    public function observations()
    {
        return $this->hasMany(Observation::class, 'user_id');
    }

    public function approvedObservations()
    {
        return $this->hasMany(Observation::class, 'approved_by');
    }

    public function skpRecaps()
    {
        return $this->hasMany(RekapSkpTriwulan::class, 'user_id');
    }
}

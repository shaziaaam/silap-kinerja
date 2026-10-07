<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RekapSkpTriwulan extends Model
{
    use HasFactory;

    protected $table = 'rekap_skp_triwulan';

    protected $fillable = [
        'user_id',
        'tahun',
        'triwulan',
        'total_pengamatan_valid',
        'file_pdf_path',
        'tanggal_generate',
    ];

    protected $casts = [
        'tanggal_generate' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

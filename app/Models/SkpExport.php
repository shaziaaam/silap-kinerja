<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SkpExport extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'selesai_pada' => 'datetime',
    ];

    protected $appends = ['periode_label', 'sedang_berjalan'];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    public function getPeriodeLabelAttribute(): string
    {
        return \App\Http\Controllers\SkpReportController::getPeriodeLabel($this->periode);
    }

    public function getSedangBerjalanAttribute(): bool
    {
        return in_array($this->status, ['antre', 'proses'], true);
    }

    public function siapDiunduh(): bool
    {
        return $this->status === 'selesai'
            && !empty($this->file_path)
            && is_file(storage_path('app/' . $this->file_path));
    }
}

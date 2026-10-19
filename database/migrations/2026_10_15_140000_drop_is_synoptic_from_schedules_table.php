<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The "foto wajib di jam sinoptik UTC 00/03/06/09/12/15" rule was cancelled by the
     * revision notes; mandatory photo slots now come from config('silap.foto_slots').
     */
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (Schema::hasColumn('schedules', 'is_synoptic')) {
                $table->dropColumn('is_synoptic');
            }
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('schedules', 'is_synoptic')) {
                $table->boolean('is_synoptic')->default(false)->after('jam_wib');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Records whether the evidence photo was taken live or picked from the gallery
     * (emergency mode), so a supervisor can weigh it during validation.
     */
    public function up(): void
    {
        Schema::table('observations', function (Blueprint $table) {
            if (!Schema::hasColumn('observations', 'foto_sumber')) {
                $table->enum('foto_sumber', ['kamera', 'galeri'])->nullable()->after('photo_ref');
            }
        });
    }

    public function down(): void
    {
        Schema::table('observations', function (Blueprint $table) {
            if (Schema::hasColumn('observations', 'foto_sumber')) {
                $table->dropColumn('foto_sumber');
            }
        });
    }
};

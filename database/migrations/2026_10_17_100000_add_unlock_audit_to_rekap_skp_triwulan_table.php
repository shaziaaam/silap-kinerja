<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jejak audit "buka kunci" ACC triwulan oleh admin (catatan revisi Fase 5:
     * setelah ACC data terkunci, buka kunci hanya oleh admin).
     */
    public function up(): void
    {
        Schema::table('rekap_skp_triwulan', function (Blueprint $table) {
            $table->foreignId('dibuka_oleh')->nullable()->after('catatan')->constrained('users')->nullOnDelete();
            $table->timestamp('dibuka_at')->nullable()->after('dibuka_oleh');
            $table->text('alasan_buka')->nullable()->after('dibuka_at');
        });
    }

    public function down(): void
    {
        Schema::table('rekap_skp_triwulan', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dibuka_oleh');
            $table->dropColumn(['dibuka_at', 'alasan_buka']);
        });
    }
};

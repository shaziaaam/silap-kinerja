<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('observations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('schedule_id')->constrained('schedules')->onDelete('cascade');
            $table->date('tanggal');
            $table->enum('status_pengamatan', ['lengkap', 'dibatalkan'])->default('lengkap');
            $table->text('alasan_batal')->nullable();

            // Foto bukti pengamatan (path ke storage)
            $table->string('foto_path')->nullable();

            // Status approval
            $table->enum('status_approval', ['pending', 'approved', 'revision'])->default('pending');
            $table->text('catatan_supervisor')->nullable();

            // Nilai parameter disimpan di tabel observation_values (skema dinamis)
            // Tidak ada kolom parameter flat di sini

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('observations');
    }
};

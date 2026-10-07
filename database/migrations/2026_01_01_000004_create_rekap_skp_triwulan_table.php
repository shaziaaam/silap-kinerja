<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rekap_skp_triwulan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('tahun');
            $table->enum('triwulan', ['T1', 'T2', 'T3', 'T4']);
            $table->integer('total_pengamatan_valid')->default(0);
            $table->string('file_pdf_path')->nullable();
            $table->timestamp('tanggal_generate')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rekap_skp_triwulan');
    }
};

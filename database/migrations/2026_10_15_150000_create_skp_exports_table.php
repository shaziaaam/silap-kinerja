<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tracks background ZIP exports. Building a quarter's package takes minutes,
     * so it runs on the queue and the supervisor collects the file afterwards.
     */
    public function up(): void
    {
        Schema::create('skp_exports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('target_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('tahun');
            $table->string('periode', 10);
            $table->enum('status', ['antre', 'proses', 'selesai', 'gagal'])->default('antre');
            $table->string('file_path')->nullable();
            $table->unsignedInteger('jumlah_pegawai')->default(0);
            $table->text('pesan_error')->nullable();
            $table->timestamp('selesai_pada')->nullable();
            $table->timestamps();

            $table->index(['requested_by', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skp_exports');
    }
};

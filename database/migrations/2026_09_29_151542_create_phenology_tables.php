<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Master Tanaman (editable admin)
        Schema::create('phenology_plants', function (Blueprint $table) {
            $table->id();
            $table->string('nama')->unique(); // jambu biji, jambu air, kelengkeng, mangga
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Master Fase (editable admin)
        Schema::create('phenology_phases', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();
            $table->string('nama'); // perontokan daun, pertumbuhan daun baru, dsb.
            $table->integer('urutan')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Entri Fenologi Harian (sekali per hari per tanaman)
        Schema::create('phenology_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('plant_id')->constrained('phenology_plants')->onDelete('cascade');
            $table->date('tanggal');
            $table->enum('keadaan', ['sangat_baik', 'baik', 'sedang', 'buruk'])->default('baik');
            $table->text('keterangan')->nullable(); // hama, penyakit, cuaca
            $table->string('foto_path')->nullable();
            $table->timestamps();

            // Satu tanaman hanya 1 entri per hari
            $table->unique(['plant_id', 'tanggal']);
        });

        // Detail Fase per Entri (Bisa lebih dari 1 fase)
        Schema::create('phenology_entry_phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained('phenology_entries')->onDelete('cascade');
            $table->foreignId('phase_id')->constrained('phenology_phases')->onDelete('cascade');
            $table->enum('tahap', ['mulai', 'sedang', 'selesai'])->default('sedang'); // mulai <25%, sedang 25-75%, selesai >75%
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phenology_entry_phases');
        Schema::dropIfExists('phenology_entries');
        Schema::dropIfExists('phenology_phases');
        Schema::dropIfExists('phenology_plants');
    }
};

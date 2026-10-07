<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instrument_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instrument_id')->constrained('instruments')->onDelete('cascade');
            $table->string('kode')->unique();
            $table->string('label');
            $table->string('satuan')->nullable();
            $table->enum('tipe_input', ['number', 'select', 'text', 'multicheck', 'integer'])->default('number');
            $table->decimal('batas_min', 10, 4)->nullable();
            $table->decimal('batas_max', 10, 4)->nullable();
            $table->enum('sumber', ['aws', 'manual', 'keduanya'])->default('keduanya');
            $table->json('jadwal_baca')->nullable();
            $table->integer('urutan')->default(0);
            $table->decimal('faktor_konversi', 10, 4)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instrument_parameters');
    }
};

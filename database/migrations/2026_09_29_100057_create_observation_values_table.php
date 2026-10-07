<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('observation_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('observation_id')->constrained('observations')->onDelete('cascade');
            $table->foreignId('parameter_id')->constrained('instrument_parameters')->onDelete('cascade');
            // Setiap parameter menyimpan nilai AWS dan/atau nilai Manual
            $table->string('nilai_aws')->nullable();    // string agar bisa simpan numerik, teks, JSON
            $table->string('nilai_manual')->nullable(); // string agar bisa simpan numerik, teks, JSON
            $table->timestamps();

            // Satu observasi tidak boleh punya duplikat parameter
            $table->unique(['observation_id', 'parameter_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('observation_values');
    }
};

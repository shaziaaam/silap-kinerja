<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instruments', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->enum('kategori', ['aws', 'taman_alat', 'fenologi'])->default('taman_alat');
            $table->boolean('is_active')->default(true);
            $table->integer('urutan_form')->default(0); // urutan tampil di form observasi
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instruments');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('observations', function (Blueprint $table) {
            $table->string('foto_gdrive_id')->nullable()->after('foto_path');
            $table->text('foto_gdrive_url')->nullable()->after('foto_gdrive_id');
        });
    }

    public function down(): void
    {
        Schema::table('observations', function (Blueprint $table) {
            $table->dropColumn(['foto_gdrive_id', 'foto_gdrive_url']);
        });
    }
};

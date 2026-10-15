<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop old phenology tables if they exist
        Schema::dropIfExists('phenology_entry_phases');
        Schema::dropIfExists('phenology_entries');
        Schema::dropIfExists('phenology_phases');
        Schema::dropIfExists('phenology_plants');

        // 2. Create parameter_options table for dropdown fields (Keadaan Tanah, Keadaan Hujan)
        if (!Schema::hasTable('parameter_options')) {
            Schema::create('parameter_options', function (Blueprint $table) {
                $table->id();
                $table->string('parameter_kode')->index();
                $table->string('nilai');
                $table->string('label')->nullable();
                $table->integer('urutan')->default(0);
                $table->timestamps();
            });
        }

        // 3. Update schedules table
        Schema::table('schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('schedules', 'kelompok')) {
                $table->enum('kelompok', ['JAM_PENUH', 'AGM1B'])->default('JAM_PENUH')->after('jam_wib');
            }
            if (!Schema::hasColumn('schedules', 'shift')) {
                $table->enum('shift', ['pagi', 'siang'])->default('pagi')->after('kelompok');
            }
            if (!Schema::hasColumn('schedules', 'is_mandatory_photo')) {
                $table->boolean('is_mandatory_photo')->default(false)->after('shift');
            }
        });

        // 4. Update instrument_parameters table
        Schema::table('instrument_parameters', function (Blueprint $table) {
            if (!Schema::hasColumn('instrument_parameters', 'kartu')) {
                $table->unsignedTinyInteger('kartu')->default(8)->after('satuan');
            }
            if (!Schema::hasColumn('instrument_parameters', 'sifat')) {
                $table->enum('sifat', ['input', 'sebelum', 'dihitung_app', 'dihitung_nasional'])->default('input')->after('kartu');
            }
            if (!Schema::hasColumn('instrument_parameters', 'kode_aws')) {
                $table->string('kode_aws')->nullable()->after('sifat');
            }
            if (!Schema::hasColumn('instrument_parameters', 'koefisien')) {
                $table->decimal('koefisien', 8, 4)->nullable()->after('kode_aws');
            }
            if (!Schema::hasColumn('instrument_parameters', 'opsional')) {
                $table->boolean('opsional')->default(false)->after('koefisien');
            }
        });

        // 5. Update observations table
        Schema::table('observations', function (Blueprint $table) {
            if (!Schema::hasColumn('observations', 'shift')) {
                $table->enum('shift', ['pagi', 'siang'])->default('pagi')->after('status_pengamatan');
            }
            if (!Schema::hasColumn('observations', 'photo_slot')) {
                $table->string('photo_slot', 10)->nullable()->after('foto_path');
            }
            if (!Schema::hasColumn('observations', 'photo_ref')) {
                $table->string('photo_ref')->nullable()->after('photo_slot');
            }
        });

        // 6. Update rekap_skp_triwulan table
        Schema::table('rekap_skp_triwulan', function (Blueprint $table) {
            if (!Schema::hasColumn('rekap_skp_triwulan', 'status')) {
                $table->enum('status', ['pending', 'approved', 'revision'])->default('pending')->after('total_pengamatan_valid');
            }
            if (!Schema::hasColumn('rekap_skp_triwulan', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('status');
            }
            if (!Schema::hasColumn('rekap_skp_triwulan', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (!Schema::hasColumn('rekap_skp_triwulan', 'catatan')) {
                $table->text('catatan')->nullable()->after('approved_at');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parameter_options');
    }
};

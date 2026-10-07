<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Schedule;
use Database\Seeders\InstrumentSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Users list according to SRS / Discussion rules:
        // Admin: A001, Password: password123, must_change_password: true
        // Penyelia: P001 (Richardus Teguh Prayitno), Password: password123, must_change_password: true
        // Pengamat: P002 to P007, Password: password123, must_change_password: true
        $users = [
            [
                'nip' => 'A001',
                'nama' => 'Admin SILAP BMKG',
                'email' => 'admin@bmkg.go.id',
                'role' => 'admin',
            ],
            [
                'nip' => 'P001',
                'nama' => 'Richardus Teguh Prayitno',
                'email' => 'teguh@bmkg.go.id',
                'role' => 'penyelia',
            ],
            [
                'nip' => 'P002',
                'nama' => 'Achmad Sulistyo E.P',
                'email' => 'achmad@bmkg.go.id',
                'role' => 'pengamat',
            ],
            [
                'nip' => 'P003',
                'nama' => 'Edy Susanto',
                'email' => 'edy@bmkg.go.id',
                'role' => 'pengamat',
            ],
            [
                'nip' => 'P004',
                'nama' => 'Eko Taufiq Suharmanto',
                'email' => 'eko@bmkg.go.id',
                'role' => 'pengamat',
            ],
            [
                'nip' => 'P005',
                'nama' => 'Muryanti',
                'email' => 'muryanti@bmkg.go.id',
                'role' => 'pengamat',
            ],
            [
                'nip' => 'P006',
                'nama' => 'Shandy Al Mughozali',
                'email' => 'shandy@bmkg.go.id',
                'role' => 'pengamat',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['nip' => $userData['nip']],
                [
                    'nama' => $userData['nama'],
                    'email' => $userData['email'],
                    'role' => $userData['role'],
                    'password' => Hash::make('password123'),
                    'must_change_password' => true,
                ]
            );
        }

        // Seed Hourly UTC & WIB Schedules (07:00 WIB / 00:00 UTC to 22:00 WIB / 15:00 UTC)
        // Mandatory photo hours: 07:00 WIB (00:00 UTC) & 17:00 WIB (10:00 UTC)
        for ($utcHour = 0; $utcHour <= 15; $utcHour++) {
            $wibHour = ($utcHour + 7) % 24;
            $jamUtc = sprintf('%02d:00:00', $utcHour);
            $jamWib = sprintf('%02d:00:00', $wibHour);
            $isMandatoryPhoto = ($wibHour == 7 || $wibHour == 17);

            Schedule::updateOrCreate(
                ['jam_utc' => $jamUtc],
                [
                    'jam_utc' => $jamUtc,
                    'jam_wib' => $jamWib,
                    'is_synoptic' => $isMandatoryPhoto,
                ]
            );
        }

        // Seed alat & parameter pengamatan
        $this->call(InstrumentSeeder::class);

        // Seed master tanaman & fase fenologi
        $this->call(PhenologySeeder::class);
    }
}

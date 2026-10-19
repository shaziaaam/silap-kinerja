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
        // Pengamat: P002 to P008 (7 Pengamat: Achmad Sulistyo E.P, Edy Susanto, Eko Taufiq Suharmanto, Joko Cahyono, Muryanti, Nursamsiah, S.Si., M.Si., Shandy Al Mughozali)
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
                'nama' => 'Joko Cahyono',
                'email' => 'joko@bmkg.go.id',
                'role' => 'pengamat',
            ],
            [
                'nip' => 'P006',
                'nama' => 'Muryanti',
                'email' => 'muryanti@bmkg.go.id',
                'role' => 'pengamat',
            ],
            [
                'nip' => 'P007',
                'nama' => 'Nursamsiah, S.Si., M.Si.',
                'email' => 'nursamsiah@bmkg.go.id',
                'role' => 'pengamat',
            ],
            [
                'nip' => 'P008',
                'nama' => 'Shandy Al Mughozali',        
                'email' => 'shandy@bmkg.go.id',
                'role' => 'pengamat',
            ],
        ];

        // Geser akun Shandy ke P008 terlebih dahulu jika sebelumnya terdaftar dengan P007 agar tidak terjadi konflik NIP
        User::where('email', 'shandy@bmkg.go.id')->update(['nip' => 'P008']);

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

        // Seed Schedules (16 slot JAM_PENUH: 07:00 - 22:00 WIB & 3 slot AGM1B: 07:30, 13:30, 17:30 WIB)
        // Foto HANYA 2 kali sehari: slot 07.00 WIB (shift pagi) dan 17.00 WIB (shift siang).
        $slots = [
            // JAM_PENUH
            ['wib' => '07:00:00', 'utc' => '00:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'foto' => true],
            ['wib' => '07:30:00', 'utc' => '00:30:00', 'kelompok' => 'AGM1B',     'shift' => 'pagi', 'foto' => false],
            ['wib' => '08:00:00', 'utc' => '01:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'foto' => false],
            ['wib' => '09:00:00', 'utc' => '02:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'foto' => false],
            ['wib' => '10:00:00', 'utc' => '03:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'foto' => false],
            ['wib' => '11:00:00', 'utc' => '04:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'foto' => false],
            ['wib' => '12:00:00', 'utc' => '05:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'foto' => false],
            ['wib' => '13:00:00', 'utc' => '06:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'foto' => false],
            ['wib' => '13:30:00', 'utc' => '06:30:00', 'kelompok' => 'AGM1B',     'shift' => 'pagi', 'foto' => false],
            ['wib' => '14:00:00', 'utc' => '07:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'pagi', 'foto' => false],
            ['wib' => '15:00:00', 'utc' => '08:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'siang', 'foto' => false],
            ['wib' => '16:00:00', 'utc' => '09:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'siang', 'foto' => false],
            ['wib' => '17:00:00', 'utc' => '10:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'siang', 'foto' => true],
            ['wib' => '17:30:00', 'utc' => '10:30:00', 'kelompok' => 'AGM1B',     'shift' => 'siang', 'foto' => false],
            ['wib' => '18:00:00', 'utc' => '11:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'siang', 'foto' => false],
            ['wib' => '19:00:00', 'utc' => '12:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'siang', 'foto' => false],
            ['wib' => '20:00:00', 'utc' => '13:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'siang', 'foto' => false],
            ['wib' => '21:00:00', 'utc' => '14:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'siang', 'foto' => false],
            ['wib' => '22:00:00', 'utc' => '15:00:00', 'kelompok' => 'JAM_PENUH', 'shift' => 'siang', 'foto' => false],
        ];

        foreach ($slots as $slot) {
            Schedule::updateOrCreate(
                ['jam_wib' => $slot['wib']],
                [
                    'jam_utc' => $slot['utc'],
                    'jam_wib' => $slot['wib'],
                    'kelompok' => $slot['kelompok'],
                    'shift' => $slot['shift'],
                    'is_mandatory_photo' => $slot['foto'],
                ]
            );
        }

        // Seed alat & parameter pengamatan
        $this->call(InstrumentSeeder::class);
    }
}

<?php

namespace Database\Seeders;

use App\Models\CivilianProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class CivilianProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            ['email' => 'ahmad.k@mail.com',   'dob' => '1985-03-15', 'gender' => 'male',   'location' => 'Beirut, Hamra',       'notes' => 'Family of 3. Diabetic.'],
            ['email' => 'mona.r@mail.com',    'dob' => '1992-07-22', 'gender' => 'female', 'location' => 'Beirut, Ain El Remmaneh'],
            ['email' => 'joseph.a@mail.com',  'dob' => '1978-11-08', 'gender' => 'male',   'location' => 'Metn, Beirut suburbs', 'notes' => 'Requires wheelchair access.'],
            ['email' => 'hana.d@mail.com',    'dob' => '1990-05-30', 'gender' => 'female', 'location' => 'Tripoli, Al Qobbeh'],
            ['email' => 'mahmoud.s@mail.com', 'dob' => '1975-09-12', 'gender' => 'male',   'location' => 'Tripoli, Bab Al Tabbaneh'],
            ['email' => 'bilal.h@mail.com',   'dob' => '1988-01-25', 'gender' => 'male',   'location' => 'Zahlé, Bekaa'],
            ['email' => 'carla.s@mail.com',   'dob' => '1995-06-03', 'gender' => 'female', 'location' => 'Chtaura, Bekaa'],
            ['email' => 'khaled.a@mail.com',  'dob' => '1983-12-17', 'gender' => 'male',   'location' => 'Sidon, Old City'],
            ['email' => 'dina.h@mail.com',    'dob' => '1999-04-09', 'gender' => 'female', 'location' => 'Sidon, Abra'],
            ['email' => 'walid.b@mail.com',   'dob' => '1970-08-20', 'gender' => 'male',   'location' => 'Jounieh, Kaslik'],
            ['email' => 'nour.m@mail.com',    'dob' => '2001-02-14', 'gender' => 'female', 'location' => 'Jounieh Centre'],
        ];

        foreach ($profiles as $p) {
            $user = User::where('email', $p['email'])->first();
            if (! $user) continue;

            CivilianProfile::firstOrCreate(['user_id' => $user->id], [
                'date_of_birth'    => $p['dob'],
                'gender'           => $p['gender'],
                'current_location' => $p['location'] ?? null,
                'notes'            => $p['notes'] ?? null,
            ]);
        }
    }
}

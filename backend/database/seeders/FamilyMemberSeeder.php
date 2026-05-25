<?php

namespace Database\Seeders;

use App\Models\FamilyMember;
use App\Models\User;
use Illuminate\Database\Seeder;

class FamilyMemberSeeder extends Seeder
{
    public function run(): void
    {
        // ── Ali Haddad (civilian@nuzuh.com) — full family ────────────────────
        $ali = User::where('email', 'civilian@nuzuh.com')->first();
        if ($ali) {
            $members = [
                [
                    'name'          => 'Rima Haddad',
                    'relationship'  => 'spouse',
                    'date_of_birth' => '1990-06-18',
                    'gender'        => 'female',
                    'id_type'       => 'national_id',
                    'id_number'     => 'LB-1990-551234',
                ],
                [
                    'name'          => 'Youssef Haddad',
                    'relationship'  => 'child',
                    'date_of_birth' => '2015-09-04',
                    'gender'        => 'male',
                    'id_type'       => null,
                    'id_number'     => null,
                    'notes'         => 'Age 10. Enrolled in temporary schooling.',
                ],
                [
                    'name'          => 'Nour Haddad',
                    'relationship'  => 'child',
                    'date_of_birth' => '2018-02-22',
                    'gender'        => 'female',
                    'id_type'       => null,
                    'id_number'     => null,
                    'notes'         => 'Age 7.',
                ],
                [
                    'name'          => 'Nasser Haddad',
                    'relationship'  => 'parent',
                    'date_of_birth' => '1958-11-30',
                    'gender'        => 'male',
                    'id_type'       => 'national_id',
                    'id_number'     => 'LB-1958-112233',
                    'notes'         => 'Elderly. Requires regular medical check-ups.',
                ],
            ];
            foreach ($members as $data) {
                FamilyMember::firstOrCreate(
                    ['user_id' => $ali->id, 'name' => $data['name']],
                    array_merge($data, ['user_id' => $ali->id])
                );
            }
        }

        // ── Fatima Hassan — one family member ────────────────────────────────
        $fatima = User::where('email', 'fatima.hassan@gmail.com')->first();
        if ($fatima) {
            FamilyMember::firstOrCreate(
                ['user_id' => $fatima->id, 'name' => 'Kareem Hassan'],
                [
                    'user_id'       => $fatima->id,
                    'name'          => 'Kareem Hassan',
                    'relationship'  => 'child',
                    'date_of_birth' => '2019-04-11',
                    'gender'        => 'male',
                ]
            );
        }

        // ── Omar Haddad — spouse ─────────────────────────────────────────────
        $omar = User::where('email', 'omar.haddad@gmail.com')->first();
        if ($omar) {
            FamilyMember::firstOrCreate(
                ['user_id' => $omar->id, 'name' => 'Samira Haddad'],
                [
                    'user_id'       => $omar->id,
                    'name'          => 'Samira Haddad',
                    'relationship'  => 'spouse',
                    'date_of_birth' => '1985-07-20',
                    'gender'        => 'female',
                    'id_type'       => 'national_id',
                    'id_number'     => 'LB-1985-779988',
                ]
            );
        }
    }
}

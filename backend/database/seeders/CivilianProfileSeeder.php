<?php

namespace Database\Seeders;

use App\Models\CivilianPrivateHousing;
use App\Models\CivilianProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class CivilianProfileSeeder extends Seeder
{
    public function run(): void
    {
        $civilians = User::where('role', 'civilian')->get();

        $genders    = ['male', 'female'];
        $idTypes    = ['national_id', 'passport', 'residency'];
        $locations  = [
            'Hamra, Beirut', 'Achrafieh, Beirut', 'Verdun, Beirut',
            'Jounieh, Mount Lebanon', 'Dbayeh, Mount Lebanon',
            'Tripoli, North Lebanon', 'Koura, North Lebanon',
            'Saida, South Lebanon', 'Tyre, South Lebanon',
            'Zahle, Bekaa', 'Baalbek, Bekaa',
            'Halba, Akkar', 'Nabatieh',
        ];
        $notes = [
            'Arrived with family of 4.',
            'Medical condition — needs ground floor.',
            'Has infant child.',
            'Needs translation assistance.',
            'Elder with mobility issues.',
            null, null, null,  // most have no notes
        ];

        foreach ($civilians as $i => $civilian) {
            $hasId    = $i % 3 !== 0;      // ~2/3 have ID on file
            $isPrivate = $civilian->shelter_id === null && $i % 3 === 0; // some unassigned have private housing

            $profile = CivilianProfile::firstOrCreate(['user_id' => $civilian->id], [
                'date_of_birth'    => now()->subYears(rand(18, 65))->subDays(rand(0, 364))->format('Y-m-d'),
                'gender'           => $genders[$i % 2],
                'current_location' => $locations[$i % count($locations)],
                'notes'            => $notes[$i % count($notes)],
                'id_type'          => $hasId ? $idTypes[$i % count($idTypes)] : null,
                'id_number'        => $hasId ? sprintf('%08d', 10000000 + $i) : null,
                'housing_status'   => $isPrivate ? 'private' : 'seeking',
            ]);

            // Create private housing record for civilians with private accommodation
            if ($isPrivate && $civilian->shelter_id === null) {
                CivilianPrivateHousing::firstOrCreate(['civilian_id' => $civilian->id], [
                    'property_type'    => ['apartment', 'house', 'room'][$i % 3],
                    'address'          => $locations[$i % count($locations)] . ', Building ' . (100 + $i),
                    'governorate'      => explode(', ', $locations[$i % count($locations)])[1] ?? 'Beirut',
                    'landlord_name'    => 'Ahmad Khalil',
                    'landlord_phone'   => '+961 3 ' . sprintf('%06d', rand(100000, 999999)),
                    'monthly_rent'     => [300, 400, 500, 600, 350][$i % 5],
                    'lease_start_date' => now()->subMonths(rand(1, 6))->format('Y-m-d'),
                    'notes'            => null,
                ]);
            }
        }
    }
}

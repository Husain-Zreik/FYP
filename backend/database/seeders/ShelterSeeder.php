<?php

namespace Database\Seeders;

use App\Models\Shelter;
use Illuminate\Database\Seeder;

class ShelterSeeder extends Seeder
{
    public function run(): void
    {
        $shelters = [
            [
                'name'        => 'Shelter Al Arz',
                'code'        => 'BEY-001',
                'governorate' => 'Beirut',
                'district'    => 'Achrafieh',
                'address'     => 'Rue de Damas, Achrafieh, Beirut',
                'latitude'    => 33.8875,
                'longitude'   => 35.5074,
                'capacity'    => 200,
                'rooms'       => 50,
                'status'      => 'active',
                'phone'       => '+961 1 200 001',
                'email'       => 'alarz@nuzuh.lb',
                'notes'       => 'Ground floor fully accessible. Medical clinic on site.',
            ],
            [
                'name'        => 'Shelter Al Nahr',
                'code'        => 'TRP-001',
                'governorate' => 'North Lebanon',
                'district'    => 'Tripoli',
                'address'     => 'Al Mina Road, Tripoli',
                'latitude'    => 34.4367,
                'longitude'   => 35.8493,
                'capacity'    => 320,
                'rooms'       => 80,
                'status'      => 'active',
                'phone'       => '+961 6 300 001',
                'email'       => 'alnahr@nuzuh.lb',
                'notes'       => 'Adjacent to Al Mina port. Large outdoor area available.',
            ],
            [
                'name'        => 'Shelter Bekaa Valley',
                'code'        => 'BEK-001',
                'governorate' => 'Bekaa',
                'district'    => 'Zahlé',
                'address'     => 'Taanayel Road, Zahlé, Bekaa',
                'latitude'    => 33.8469,
                'longitude'   => 35.9029,
                'capacity'    => 150,
                'rooms'       => 38,
                'status'      => 'active',
                'phone'       => '+961 8 200 001',
                'email'       => 'bekaa@nuzuh.lb',
                'notes'       => 'Former school building. Heating system installed for winter.',
            ],
            [
                'name'        => 'Shelter Al Janoub',
                'code'        => 'SID-001',
                'governorate' => 'South Lebanon',
                'district'    => 'Sidon',
                'address'     => 'Saida Old Souq District, Sidon',
                'latitude'    => 33.5632,
                'longitude'   => 35.3704,
                'capacity'    => 120,
                'rooms'       => 30,
                'status'      => 'full',
                'phone'       => '+961 7 100 001',
                'email'       => 'janoub@nuzuh.lb',
                'notes'       => 'Currently at full capacity. Redirect new arrivals to SID-002.',
            ],
            [
                'name'        => 'Shelter Jounieh',
                'code'        => 'MTL-001',
                'governorate' => 'Mount Lebanon',
                'district'    => 'Jounieh',
                'address'     => 'Jounieh Bay Road, Jounieh',
                'latitude'    => 33.9815,
                'longitude'   => 35.6179,
                'capacity'    => 180,
                'rooms'       => 45,
                'status'      => 'active',
                'phone'       => '+961 9 600 001',
                'email'       => 'jounieh@nuzuh.lb',
                'notes'       => 'Sea-facing facility. Good ventilation and natural light.',
            ],
            [
                'name'        => 'Shelter Nabatieh',
                'code'        => 'NAB-001',
                'governorate' => 'Nabatieh',
                'district'    => 'Nabatieh',
                'address'     => 'Central Square, Nabatieh',
                'latitude'    => 33.3772,
                'longitude'   => 35.4836,
                'capacity'    => 90,
                'rooms'       => 22,
                'status'      => 'under_maintenance',
                'phone'       => '+961 7 400 001',
                'email'       => 'nabatieh@nuzuh.lb',
                'notes'       => 'Electrical upgrade in progress. Expected back online in 2 weeks.',
            ],
        ];

        foreach ($shelters as $data) {
            Shelter::firstOrCreate(['code' => $data['code']], $data);
        }
    }
}

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
                'name' => 'Maarad Exhibition Center', 'code' => 'BEY-001',
                'governorate' => 'Beirut', 'district' => 'Beirut Central',
                'address' => 'Martyrs Square, Beirut',
                'latitude' => 33.8938, 'longitude' => 35.5018,
                'capacity' => 30, 'rooms' => 12,
                'phone' => '+961 1 980 000', 'email' => 'maarad@nuzuh.lb',
                'status' => 'active',
            ],
            [
                'name' => 'Sports City Complex', 'code' => 'BEY-002',
                'governorate' => 'Beirut', 'district' => 'Beirut South',
                'address' => 'Cola Street, Beirut',
                'latitude' => 33.8731, 'longitude' => 35.4944,
                'capacity' => 50, 'rooms' => 20,
                'phone' => '+961 1 840 000', 'email' => 'sportscity@nuzuh.lb',
                'status' => 'active',
            ],
            [
                'name' => 'Ghazir Public School', 'code' => 'MTL-001',
                'governorate' => 'Mount Lebanon', 'district' => 'Keserwan',
                'address' => 'Main Road, Ghazir',
                'latitude' => 33.9950, 'longitude' => 35.6164,
                'capacity' => 40, 'rooms' => 15,
                'phone' => '+961 9 230 000', 'email' => 'ghazir@nuzuh.lb',
                'status' => 'active',
            ],
            [
                'name' => 'Tripoli Secondary School', 'code' => 'NOR-001',
                'governorate' => 'North Lebanon', 'district' => 'Tripoli',
                'address' => 'Al-Mina Road, Tripoli',
                'latitude' => 34.4367, 'longitude' => 35.8497,
                'capacity' => 35, 'rooms' => 14,
                'phone' => '+961 6 430 000', 'email' => 'tripoli@nuzuh.lb',
                'status' => 'active',
            ],
            [
                'name' => 'Koura Community Hall', 'code' => 'NOR-002',
                'governorate' => 'North Lebanon', 'district' => 'Koura',
                'address' => 'Amioun Village, Koura',
                'latitude' => 34.2969, 'longitude' => 35.7253,
                'capacity' => 20, 'rooms' => 8,
                'phone' => '+961 6 950 000', 'email' => 'koura@nuzuh.lb',
                'status' => 'active',
            ],
            [
                'name' => 'Saida Cultural Center', 'code' => 'SOU-001',
                'governorate' => 'South Lebanon', 'district' => 'Sidon',
                'address' => 'Riad El Solh Street, Saida',
                'latitude' => 33.5571, 'longitude' => 35.3729,
                'capacity' => 45, 'rooms' => 18,
                'phone' => '+961 7 720 000', 'email' => 'saida@nuzuh.lb',
                'status' => 'active',
            ],
            [
                'name' => 'Chtoura Sports Hall', 'code' => 'BEK-001',
                'governorate' => 'Bekaa', 'district' => 'Zahle',
                'address' => 'Chtoura Main Road, Bekaa',
                'latitude' => 33.8136, 'longitude' => 35.8547,
                'capacity' => 60, 'rooms' => 24,
                'phone' => '+961 8 540 000', 'email' => 'chtoura@nuzuh.lb',
                'status' => 'active',
            ],
            [
                'name' => 'Halba Municipal Center', 'code' => 'AKK-001',
                'governorate' => 'Akkar', 'district' => 'Akkar',
                'address' => 'Halba Town Square, Akkar',
                'latitude' => 34.5514, 'longitude' => 36.0803,
                'capacity' => 25, 'rooms' => 10,
                'phone' => '+961 6 690 000', 'email' => 'halba@nuzuh.lb',
                'status' => 'active',
            ],
        ];

        foreach ($shelters as $data) {
            Shelter::firstOrCreate(['code' => $data['code']], $data);
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ShelterSeeder::class,
            UserSeeder::class,
            CivilianProfileSeeder::class,
            RoleCapabilitySeeder::class,
            AidCategorySeeder::class,
            AidBatchSeeder::class,
            AidRequestSeeder::class,
            CivilianNeedSeeder::class,
            AidScheduleSeeder::class,
            AidDispatchSeeder::class,
            ShelterRequestSeeder::class,
            MediaSeeder::class,
        ]);
    }
}

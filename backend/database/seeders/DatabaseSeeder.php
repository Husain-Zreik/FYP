<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ShelterSeeder::class,           // shelters first (civilians reference them)
            UserSeeder::class,              // users + sync shelter statuses
            CivilianProfileSeeder::class,   // profiles, IDs, private housing
            RoleCapabilitySeeder::class,    // default staff capabilities
            AidCategorySeeder::class,       // aid category reference data
            ShelterRequestSeeder::class,    // pending invitations & join requests
            MediaSeeder::class,             // shelter cover images + civilian ID documents
        ]);
    }
}

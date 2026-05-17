<?php

namespace Database\Seeders;

use App\Models\RoleCapability;
use Illuminate\Database\Seeder;

class RoleCapabilitySeeder extends Seeder
{
    public function run(): void
    {
        $config = config('capabilities');

        foreach ($config as $role => $capabilities) {
            foreach ($capabilities as $cap) {
                RoleCapability::firstOrCreate(
                    ['role' => $role, 'capability' => $cap['key']],
                    ['enabled' => true]
                );
            }
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@nuzuh.com'],
            [
                'name'      => 'Government Admin',
                'password'  => Hash::make('password'),
                'role'      => 'government_admin',
                'is_active' => true,
            ]
        );
    }
}

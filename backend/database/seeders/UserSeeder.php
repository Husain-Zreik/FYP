<?php

namespace Database\Seeders;

use App\Models\Shelter;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $shelters = Shelter::orderBy('id')->get()->keyBy('code');

        // ── Government admin (primary — never delete) ─────────────────────────
        User::firstOrCreate(['email' => 'admin@nuzuh.com'], [
            'name'      => 'Government Admin',
            'password'  => Hash::make('password'),
            'role'      => 'government_admin',
            'is_active' => true,
        ]);

        // ── Government staff ──────────────────────────────────────────────────
        $govStaff = [
            ['name' => 'Rania Mansour',  'email' => 'rania@nuzuh.com'],
            ['name' => 'Karim Abi Nader','email' => 'karim@nuzuh.com'],
        ];
        foreach ($govStaff as $u) {
            User::firstOrCreate(['email' => $u['email']], array_merge($u, [
                'password'  => Hash::make('password'),
                'role'      => 'government_staff',
                'is_active' => true,
            ]));
        }

        // ── Shelter admins (one per shelter) ──────────────────────────────────
        $admins = [
            ['name' => 'Ali Hassan',    'email' => 'ali.hassan@nuzuh.com',    'code' => 'BEY-001', 'phone' => '+961 70 100 001'],
            ['name' => 'Fatima Khalil', 'email' => 'fatima.khalil@nuzuh.com', 'code' => 'TRP-001', 'phone' => '+961 70 100 002'],
            ['name' => 'Omar Nassar',   'email' => 'omar.nassar@nuzuh.com',   'code' => 'BEK-001', 'phone' => '+961 70 100 003'],
            ['name' => 'Maya Salam',    'email' => 'maya.salam@nuzuh.com',    'code' => 'SID-001', 'phone' => '+961 70 100 004'],
            ['name' => 'Ziad Frem',     'email' => 'ziad.frem@nuzuh.com',     'code' => 'MTL-001', 'phone' => '+961 70 100 005'],
        ];
        foreach ($admins as $u) {
            $shelter = $shelters->get($u['code']);
            User::firstOrCreate(['email' => $u['email']], [
                'name'       => $u['name'],
                'password'   => Hash::make('password'),
                'phone'      => $u['phone'],
                'role'       => 'shelter_admin',
                'shelter_id' => $shelter?->id,
                'is_active'  => true,
            ]);
        }

        // ── Shelter staff (2 per shelter) ─────────────────────────────────────
        $staff = [
            ['name' => 'Nadia Fares',    'email' => 'nadia.fares@nuzuh.com',   'code' => 'BEY-001'],
            ['name' => 'Hassan Moussa',  'email' => 'hassan.moussa@nuzuh.com', 'code' => 'BEY-001'],
            ['name' => 'Lara Gemayel',   'email' => 'lara.gemayel@nuzuh.com',  'code' => 'TRP-001'],
            ['name' => 'Tarek Khoury',   'email' => 'tarek.khoury@nuzuh.com',  'code' => 'TRP-001'],
            ['name' => 'Sara Haddad',    'email' => 'sara.haddad@nuzuh.com',   'code' => 'BEK-001'],
            ['name' => 'Maroun Bou Eid', 'email' => 'maroun.boeid@nuzuh.com',  'code' => 'BEK-001'],
            ['name' => 'Rouba Jaber',    'email' => 'rouba.jaber@nuzuh.com',   'code' => 'SID-001'],
            ['name' => 'Chadi Yammine',  'email' => 'chadi.yammine@nuzuh.com', 'code' => 'MTL-001'],
        ];
        foreach ($staff as $u) {
            $shelter = $shelters->get($u['code']);
            User::firstOrCreate(['email' => $u['email']], [
                'name'       => $u['name'],
                'password'   => Hash::make('password'),
                'role'       => 'shelter_staff',
                'shelter_id' => $shelter?->id,
                'is_active'  => true,
            ]);
        }

        // ── Civilians ─────────────────────────────────────────────────────────
        $civilians = [
            ['name' => 'Ahmad Khalil',    'email' => 'ahmad.k@mail.com',   'phone' => '+961 71 200 001', 'code' => 'BEY-001'],
            ['name' => 'Mona Rizk',       'email' => 'mona.r@mail.com',    'phone' => '+961 71 200 002', 'code' => 'BEY-001'],
            ['name' => 'Joseph Azar',     'email' => 'joseph.a@mail.com',  'phone' => '+961 71 200 003', 'code' => 'BEY-001'],
            ['name' => 'Hana Diab',       'email' => 'hana.d@mail.com',    'phone' => '+961 71 200 004', 'code' => 'TRP-001'],
            ['name' => 'Mahmoud Saleh',   'email' => 'mahmoud.s@mail.com', 'phone' => '+961 71 200 005', 'code' => 'TRP-001'],
            ['name' => 'Rita Nasr',       'email' => 'rita.n@mail.com',    'phone' => '+961 71 200 006', 'code' => 'TRP-001'],
            ['name' => 'Bilal Hamdan',    'email' => 'bilal.h@mail.com',   'phone' => '+961 71 200 007', 'code' => 'BEK-001'],
            ['name' => 'Carla Saad',      'email' => 'carla.s@mail.com',   'phone' => '+961 71 200 008', 'code' => 'BEK-001'],
            ['name' => 'Khaled Aoun',     'email' => 'khaled.a@mail.com',  'phone' => '+961 71 200 009', 'code' => 'SID-001'],
            ['name' => 'Dina Habib',      'email' => 'dina.h@mail.com',    'phone' => '+961 71 200 010', 'code' => 'SID-001'],
            ['name' => 'Walid Barakat',   'email' => 'walid.b@mail.com',   'phone' => '+961 71 200 011', 'code' => 'MTL-001'],
            ['name' => 'Nour El Mawla',   'email' => 'nour.m@mail.com',    'phone' => '+961 71 200 012', 'code' => 'MTL-001'],
            // Unassigned civilians (no shelter yet)
            ['name' => 'Samer Hanna',     'email' => 'samer.h@mail.com',   'phone' => '+961 71 200 013', 'code' => null],
            ['name' => 'Joelle Karam',    'email' => 'joelle.k@mail.com',  'phone' => '+961 71 200 014', 'code' => null],
            ['name' => 'Firas Takieddine','email' => 'firas.t@mail.com',   'phone' => '+961 71 200 015', 'code' => null],
        ];

        foreach ($civilians as $u) {
            $shelter = $u['code'] ? $shelters->get($u['code']) : null;
            User::firstOrCreate(['email' => $u['email']], [
                'name'       => $u['name'],
                'password'   => Hash::make('password'),
                'phone'      => $u['phone'],
                'role'       => 'civilian',
                'shelter_id' => $shelter?->id,
                'is_active'  => true,
            ]);
        }
    }
}

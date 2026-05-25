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
        // ── PRIMARY SHOWCASE ACCOUNTS ─────────────────────────────────────────
        // These easy-to-remember logins are for demo/testing purposes.

        // Government Admin
        User::firstOrCreate(['email' => 'admin@nuzuh.com'], [
            'name'      => 'Karim Mansour',
            'password'  => Hash::make('password'),
            'phone'     => '+961 70 100 001',
            'role'      => 'government_admin',
            'is_active' => true,
        ]);

        // Government Staff (primary showcase)
        User::firstOrCreate(['email' => 'govstaff@nuzuh.com'], [
            'name'      => 'Rania Haddad',
            'password'  => Hash::make('password'),
            'phone'     => '+961 70 100 002',
            'role'      => 'government_staff',
            'is_active' => true,
        ]);

        $shelter1 = Shelter::where('code', 'BEY-001')->first();

        // Shelter Admin (primary showcase — Maarad Exhibition Center)
        User::firstOrCreate(['email' => 'shelter@nuzuh.com'], [
            'name'       => 'Walid Saleh',
            'password'   => Hash::make('password'),
            'phone'      => '+961 71 300 001',
            'role'       => 'shelter_admin',
            'shelter_id' => $shelter1?->id,
            'is_active'  => true,
        ]);

        // Shelter Staff (primary showcase — same shelter)
        User::firstOrCreate(['email' => 'shelterstaff@nuzuh.com'], [
            'name'       => 'Lara Nasser',
            'password'   => Hash::make('password'),
            'phone'      => '+961 71 300 002',
            'role'       => 'shelter_staff',
            'shelter_id' => $shelter1?->id,
            'is_active'  => true,
        ]);

        // Civilian (primary showcase — housed at shelter 1, complete profile)
        User::firstOrCreate(['email' => 'civilian@nuzuh.com'], [
            'name'       => 'Ali Haddad',
            'password'   => Hash::make('password'),
            'phone'      => '+961 76 500 001',
            'role'       => 'civilian',
            'shelter_id' => $shelter1?->id,
            'is_active'  => true,
        ]);

        // Civilian 2 (primary showcase — private housing)
        User::firstOrCreate(['email' => 'civilian2@nuzuh.com'], [
            'name'      => 'Mariam Saad',
            'password'  => Hash::make('password'),
            'phone'     => '+961 76 500 002',
            'role'      => 'civilian',
            'is_active' => true,
        ]);

        // Civilian 3 (primary showcase — seeking shelter)
        User::firstOrCreate(['email' => 'civilian3@nuzuh.com'], [
            'name'      => 'Ahmad Fares',
            'password'  => Hash::make('password'),
            'phone'     => '+961 76 500 003',
            'role'      => 'civilian',
            'is_active' => true,
        ]);

        // ── ADDITIONAL GOVERNMENT STAFF ───────────────────────────────────────
        User::firstOrCreate(['email' => 'fadi.khoury@nuzuh.lb'], [
            'name'      => 'Fadi Khoury',
            'password'  => Hash::make('password'),
            'phone'     => '+961 70 200 002',
            'role'      => 'government_staff',
            'is_active' => true,
        ]);

        // ── SHELTER ADMINS & STAFF (one per remaining shelter) ────────────────
        $shelterStaff = [
            'BEY-002' => [
                'admin' => ['name' => 'Georges Sfeir', 'email' => 'georges.sfeir@nuzuh.lb', 'phone' => '+961 71 310 001'],
                'staff' => ['name' => 'Maya Rahhal',   'email' => 'maya.rahhal@nuzuh.lb',   'phone' => '+961 71 310 002'],
            ],
            'MTL-001' => [
                'admin' => ['name' => 'Tony Gemayel',  'email' => 'tony.gemayel@nuzuh.lb',  'phone' => '+961 71 320 001'],
                'staff' => ['name' => 'Carine Khalil', 'email' => 'carine.khalil@nuzuh.lb', 'phone' => '+961 71 320 002'],
            ],
            'NOR-001' => [
                'admin' => ['name' => 'Hassan Ibrahim', 'email' => 'hassan.ibrahim@nuzuh.lb', 'phone' => '+961 71 330 001'],
                'staff' => ['name' => 'Zeina Moussa',   'email' => 'zeina.moussa@nuzuh.lb',   'phone' => '+961 71 330 002'],
            ],
            'NOR-002' => [
                'admin' => ['name' => 'Nader Assaf', 'email' => 'nader.assaf@nuzuh.lb', 'phone' => '+961 71 340 001'],
                'staff' => ['name' => 'Rita Hajj',   'email' => 'rita.hajj@nuzuh.lb',   'phone' => '+961 71 340 002'],
            ],
            'SOU-001' => [
                'admin' => ['name' => 'Ali Hassan',  'email' => 'ali.hassan@nuzuh.lb',  'phone' => '+961 71 350 001'],
                'staff' => ['name' => 'Nour Khalil', 'email' => 'nour.khalil@nuzuh.lb', 'phone' => '+961 71 350 002'],
            ],
            'BEK-001' => [
                'admin' => ['name' => 'Youssef Karami', 'email' => 'youssef.karami@nuzuh.lb', 'phone' => '+961 71 360 001'],
                'staff' => ['name' => 'Hoda Zein',      'email' => 'hoda.zein@nuzuh.lb',      'phone' => '+961 71 360 002'],
            ],
            'AKK-001' => [
                'admin' => ['name' => 'Rami Moussa', 'email' => 'rami.moussa@nuzuh.lb', 'phone' => '+961 71 370 001'],
                'staff' => ['name' => 'Sara Akl',    'email' => 'sara.akl@nuzuh.lb',    'phone' => '+961 71 370 002'],
            ],
        ];

        foreach ($shelterStaff as $code => $roles) {
            $shelter = Shelter::where('code', $code)->first();
            if (! $shelter) continue;
            User::firstOrCreate(['email' => $roles['admin']['email']], array_merge($roles['admin'], [
                'password' => Hash::make('password'), 'role' => 'shelter_admin',
                'shelter_id' => $shelter->id, 'is_active' => true,
            ]));
            User::firstOrCreate(['email' => $roles['staff']['email']], array_merge($roles['staff'], [
                'password' => Hash::make('password'), 'role' => 'shelter_staff',
                'shelter_id' => $shelter->id, 'is_active' => true,
            ]));
        }

        // ── CIVILIANS (distributed across shelters) ───────────────────────────
        $civilians = [
            // BEY-001 — Maarad (cap 30, ~15 extra beyond primary accounts)
            ['Fatima Hassan',    'fatima.hassan@gmail.com',   '+961 76 001 002', 'BEY-001'],
            ['Mohammad Saleh',   'mohammad.saleh@gmail.com',  '+961 76 001 003', 'BEY-001'],
            ['Sara Khalil',      'sara.khalil@gmail.com',     '+961 76 001 004', 'BEY-001'],
            ['Rania Nasser',     'rania.nasser@gmail.com',    '+961 76 001 005', 'BEY-001'],
            ['Omar Haddad',      'omar.haddad@gmail.com',     '+961 76 001 006', 'BEY-001'],
            ['Hana Ibrahim',     'hana.ibrahim@gmail.com',    '+961 76 001 007', 'BEY-001'],
            ['Khaled Mansour',   'khaled.mansour@gmail.com',  '+961 76 001 008', 'BEY-001'],
            ['Lina Rahhal',      'lina.rahhal@gmail.com',     '+961 76 001 009', 'BEY-001'],
            ['Tarek Moussa',     'tarek.moussa@gmail.com',    '+961 76 001 010', 'BEY-001'],
            ['Dina Karami',      'dina.karami@gmail.com',     '+961 76 001 011', 'BEY-001'],
            ['Wissam Sfeir',     'wissam.sfeir@gmail.com',   '+961 76 001 012', 'BEY-001'],
            ['Maya Gemayel',     'maya.gemayel@gmail.com',   '+961 76 001 013', 'BEY-001'],
            ['Ramzi Khoury',     'ramzi.khoury@gmail.com',   '+961 76 001 014', 'BEY-001'],
            ['Nada Assaf',       'nada.assaf@gmail.com',     '+961 76 001 015', 'BEY-001'],
            ['Ali Zein',         'ali.zein@gmail.com',       '+961 76 001 016', 'BEY-001'],
            // BEY-002 — Sports City (cap 50)
            ['Hassan Khalil',    'hassan.khalil@gmail.com',  '+961 76 002 001', 'BEY-002'],
            ['Zeina Karami',     'zeina.karami@gmail.com',   '+961 76 002 002', 'BEY-002'],
            ['Ahmad Zein',       'ahmad.zein@gmail.com',     '+961 76 002 003', 'BEY-002'],
            ['Fatima Khoury',    'fatima.khoury@gmail.com',  '+961 76 002 004', 'BEY-002'],
            ['Rami Assaf',       'rami.assaf@gmail.com',     '+961 76 002 005', 'BEY-002'],
            ['Sara Nasser',      'sara.nasser@gmail.com',    '+961 76 002 006', 'BEY-002'],
            ['Omar Ibrahim',     'omar.ibrahim@gmail.com',   '+961 76 002 007', 'BEY-002'],
            ['Hana Mansour',     'hana.mansour@gmail.com',   '+961 76 002 008', 'BEY-002'],
            ['Khaled Haddad',    'khaled.haddad@gmail.com',  '+961 76 002 009', 'BEY-002'],
            ['Lina Saleh',       'lina.saleh@gmail.com',     '+961 76 002 010', 'BEY-002'],
            ['Tarek Hassan',     'tarek.hassan@gmail.com',   '+961 76 002 011', 'BEY-002'],
            ['Dina Khalil',      'dina.khalil@gmail.com',    '+961 76 002 012', 'BEY-002'],
            ['Wissam Rahhal',    'wissam.rahhal@gmail.com',  '+961 76 002 013', 'BEY-002'],
            ['Maya Moussa',      'maya.moussa@gmail.com',    '+961 76 002 014', 'BEY-002'],
            ['Ramzi Sfeir',      'ramzi.sfeir@gmail.com',    '+961 76 002 015', 'BEY-002'],
            // MTL-001 — Ghazir (cap 40)
            ['Nabil Khoury',     'nabil.khoury@gmail.com',   '+961 76 003 001', 'MTL-001'],
            ['Amal Hassan',      'amal.hassan@gmail.com',    '+961 76 003 002', 'MTL-001'],
            ['Jad Ibrahim',      'jad.ibrahim@gmail.com',    '+961 76 003 003', 'MTL-001'],
            ['Lena Khalil',      'lena.khalil@gmail.com',    '+961 76 003 004', 'MTL-001'],
            ['Wael Mansour',     'wael.mansour@gmail.com',   '+961 76 003 005', 'MTL-001'],
            ['Hiba Haddad',      'hiba.haddad@gmail.com',    '+961 76 003 006', 'MTL-001'],
            ['Ziad Saleh',       'ziad.saleh@gmail.com',     '+961 76 003 007', 'MTL-001'],
            ['Dana Hassan',      'dana.hassan@gmail.com',    '+961 76 003 008', 'MTL-001'],
            ['Imad Ibrahim',     'imad.ibrahim@gmail.com',   '+961 76 003 009', 'MTL-001'],
            ['Rima Khalil',      'rima.khalil@gmail.com',    '+961 76 003 010', 'MTL-001'],
            // NOR-001 — Tripoli (cap 35)
            ['Saad Rahhal',      'saad.rahhal@gmail.com',    '+961 76 004 001', 'NOR-001'],
            ['Hana Moussa',      'hana.moussa@gmail.com',    '+961 76 004 002', 'NOR-001'],
            ['Majed Sfeir',      'majed.sfeir@gmail.com',    '+961 76 004 003', 'NOR-001'],
            ['Ines Gemayel',     'ines.gemayel@gmail.com',   '+961 76 004 004', 'NOR-001'],
            ['Wassim Khoury',    'wassim.khoury@gmail.com',  '+961 76 004 005', 'NOR-001'],
            ['Suzanne Assaf',    'suzanne.assaf@gmail.com',  '+961 76 004 006', 'NOR-001'],
            ['Bassel Nasser',    'bassel.nasser@gmail.com',  '+961 76 004 007', 'NOR-001'],
            ['Roula Haddad',     'roula.haddad@gmail.com',   '+961 76 004 008', 'NOR-001'],
            ['Maroun Saleh',     'maroun.saleh@gmail.com',   '+961 76 004 009', 'NOR-001'],
            ['Sohad Hassan',     'sohad.hassan@gmail.com',   '+961 76 004 010', 'NOR-001'],
            // NOR-002 — Koura (cap 20)
            ['Adel Khoury',      'adel.khoury@gmail.com',    '+961 76 005 001', 'NOR-002'],
            ['Rim Assaf',        'rim.assaf@gmail.com',      '+961 76 005 002', 'NOR-002'],
            ['Firas Nasser',     'firas.nasser@gmail.com',   '+961 76 005 003', 'NOR-002'],
            ['Sandra Haddad',    'sandra.haddad@gmail.com',  '+961 76 005 004', 'NOR-002'],
            ['Zaki Saleh',       'zaki.saleh@gmail.com',     '+961 76 005 005', 'NOR-002'],
            ['Alia Hassan',      'alia.hassan@gmail.com',    '+961 76 005 006', 'NOR-002'],
            ['Sami Ibrahim',     'sami.ibrahim@gmail.com',   '+961 76 005 007', 'NOR-002'],
            ['Norma Khalil',     'norma.khalil@gmail.com',   '+961 76 005 008', 'NOR-002'],
            // SOU-001 — Saida (cap 45)
            ['Hani Mansour',     'hani.mansour@gmail.com',   '+961 76 006 001', 'SOU-001'],
            ['Leila Haddad',     'leila.haddad@gmail.com',   '+961 76 006 002', 'SOU-001'],
            ['Mazen Saleh',      'mazen.saleh@gmail.com',    '+961 76 006 003', 'SOU-001'],
            ['Chloe Hassan',     'chloe.hassan@gmail.com',   '+961 76 006 004', 'SOU-001'],
            ['Tamer Ibrahim',    'tamer.ibrahim@gmail.com',  '+961 76 006 005', 'SOU-001'],
            ['Vera Khalil',      'vera.khalil@gmail.com',    '+961 76 006 006', 'SOU-001'],
            ['Nadal Mansour',    'nadal.mansour@gmail.com',  '+961 76 006 007', 'SOU-001'],
            ['Dima Haddad',      'dima.haddad@gmail.com',    '+961 76 006 008', 'SOU-001'],
            ['Ramez Saleh',      'ramez.saleh@gmail.com',    '+961 76 006 009', 'SOU-001'],
            ['Christelle Hassan','christelle.hassan@gmail.com', '+961 76 006 010', 'SOU-001'],
            // BEK-001 — Chtoura (cap 60)
            ['Ismail Karami',    'ismail.karami@gmail.com',  '+961 76 007 001', 'BEK-001'],
            ['Rosy Zein',        'rosy.zein@gmail.com',      '+961 76 007 002', 'BEK-001'],
            ['Tariq Khoury',     'tariq.khoury@gmail.com',   '+961 76 007 003', 'BEK-001'],
            ['Petra Assaf',      'petra.assaf@gmail.com',    '+961 76 007 004', 'BEK-001'],
            ['Ahmad Nasser',     'ahmad.nasser@gmail.com',   '+961 76 007 005', 'BEK-001'],
            ['Suha Haddad',      'suha.haddad@gmail.com',    '+961 76 007 006', 'BEK-001'],
            ['Hasan Saleh',      'hasan.saleh@gmail.com',    '+961 76 007 007', 'BEK-001'],
            ['Tamara Hassan',    'tamara.hassan@gmail.com',  '+961 76 007 008', 'BEK-001'],
            ['Jihad Ibrahim',    'jihad.ibrahim@gmail.com',  '+961 76 007 009', 'BEK-001'],
            ['Mirna Khalil',     'mirna.khalil@gmail.com',   '+961 76 007 010', 'BEK-001'],
            // AKK-001 — Halba (cap 25)
            ['Samir Mansour',    'samir.mansour@gmail.com',  '+961 76 008 001', 'AKK-001'],
            ['Heba Haddad',      'heba.haddad@gmail.com',    '+961 76 008 002', 'AKK-001'],
            ['Fawzi Saleh',      'fawzi.saleh@gmail.com',    '+961 76 008 003', 'AKK-001'],
            ['Nayla Hassan',     'nayla.hassan@gmail.com',   '+961 76 008 004', 'AKK-001'],
            ['Makram Ibrahim',   'makram.ibrahim@gmail.com', '+961 76 008 005', 'AKK-001'],
            ['Rawan Khalil',     'rawan.khalil@gmail.com',   '+961 76 008 006', 'AKK-001'],
            ['Hicham Mansour',   'hicham.mansour@gmail.com', '+961 76 008 007', 'AKK-001'],
            ['Abla Haddad',      'abla.haddad@gmail.com',    '+961 76 008 008', 'AKK-001'],
            ['Faisal Saleh',     'faisal.saleh@gmail.com',   '+961 76 008 009', 'AKK-001'],
            ['Nadia Hassan',     'nadia.hassan@gmail.com',   '+961 76 008 010', 'AKK-001'],
            // Unassigned civilians (seeking)
            ['Rabih Haddad',     'rabih.haddad@gmail.com',   '+961 76 009 001', null],
            ['Sanaa Saleh',      'sanaa.saleh@gmail.com',    '+961 76 009 002', null],
            ['Naser Hassan',     'naser.hassan@gmail.com',   '+961 76 009 003', null],
        ];

        $shelterCache = [];
        foreach ($civilians as [$name, $email, $phone, $code]) {
            if ($code && ! isset($shelterCache[$code])) {
                $shelterCache[$code] = Shelter::where('code', $code)->value('id');
            }
            User::firstOrCreate(['email' => $email], [
                'name'       => $name,
                'password'   => Hash::make('password'),
                'phone'      => $phone,
                'role'       => 'civilian',
                'shelter_id' => $code ? ($shelterCache[$code] ?? null) : null,
                'is_active'  => true,
            ]);
        }

        // ── Sync shelter status based on actual occupancy ─────────────────────
        foreach (Shelter::all() as $shelter) {
            $count = User::where('shelter_id', $shelter->id)->where('role', 'civilian')->count();
            $shelter->update(['status' => ($shelter->capacity > 0 && $count >= $shelter->capacity) ? 'full' : 'active']);
        }
    }
}

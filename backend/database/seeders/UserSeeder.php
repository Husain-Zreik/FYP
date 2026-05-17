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
        // ─── Government admin ─────────────────────────────────────────────
        User::firstOrCreate(['email' => 'admin@nuzuh.com'], [
            'name'      => 'Karim Mansour',
            'password'  => Hash::make('password'),
            'phone'     => '+961 70 100 001',
            'role'      => 'government_admin',
            'is_active' => true,
        ]);

        // ─── Government staff ─────────────────────────────────────────────
        $govStaff = [
            ['name' => 'Rania Haddad',   'email' => 'rania.haddad@nuzuh.lb',   'phone' => '+961 70 200 001'],
            ['name' => 'Fadi Khoury',    'email' => 'fadi.khoury@nuzuh.lb',    'phone' => '+961 70 200 002'],
        ];
        foreach ($govStaff as $u) {
            User::firstOrCreate(['email' => $u['email']], array_merge($u, [
                'password' => Hash::make('password'), 'role' => 'government_staff', 'is_active' => true,
            ]));
        }

        // ─── Shelter admins & staff ───────────────────────────────────────
        $shelterStaff = [
            'BEY-001' => [
                'admin' => ['name' => 'Walid Saleh',   'email' => 'walid.saleh@nuzuh.lb',   'phone' => '+961 71 300 001'],
                'staff' => ['name' => 'Lara Nasser',   'email' => 'lara.nasser@nuzuh.lb',   'phone' => '+961 71 300 002'],
            ],
            'BEY-002' => [
                'admin' => ['name' => 'Georges Sfeir',  'email' => 'georges.sfeir@nuzuh.lb', 'phone' => '+961 71 310 001'],
                'staff' => ['name' => 'Maya Rahhal',    'email' => 'maya.rahhal@nuzuh.lb',   'phone' => '+961 71 310 002'],
            ],
            'MTL-001' => [
                'admin' => ['name' => 'Tony Gemayel',   'email' => 'tony.gemayel@nuzuh.lb',  'phone' => '+961 71 320 001'],
                'staff' => ['name' => 'Carine Khalil',  'email' => 'carine.khalil@nuzuh.lb', 'phone' => '+961 71 320 002'],
            ],
            'NOR-001' => [
                'admin' => ['name' => 'Hassan Ibrahim',  'email' => 'hassan.ibrahim@nuzuh.lb', 'phone' => '+961 71 330 001'],
                'staff' => ['name' => 'Zeina Moussa',    'email' => 'zeina.moussa@nuzuh.lb',   'phone' => '+961 71 330 002'],
            ],
            'NOR-002' => [
                'admin' => ['name' => 'Nader Assaf',    'email' => 'nader.assaf@nuzuh.lb',   'phone' => '+961 71 340 001'],
                'staff' => ['name' => 'Rita Hajj',      'email' => 'rita.hajj@nuzuh.lb',     'phone' => '+961 71 340 002'],
            ],
            'SOU-001' => [
                'admin' => ['name' => 'Ali Hassan',     'email' => 'ali.hassan@nuzuh.lb',    'phone' => '+961 71 350 001'],
                'staff' => ['name' => 'Nour Khalil',    'email' => 'nour.khalil@nuzuh.lb',   'phone' => '+961 71 350 002'],
            ],
            'BEK-001' => [
                'admin' => ['name' => 'Youssef Karami', 'email' => 'youssef.karami@nuzuh.lb','phone' => '+961 71 360 001'],
                'staff' => ['name' => 'Hoda Zein',      'email' => 'hoda.zein@nuzuh.lb',     'phone' => '+961 71 360 002'],
            ],
            'AKK-001' => [
                'admin' => ['name' => 'Rami Moussa',    'email' => 'rami.moussa@nuzuh.lb',   'phone' => '+961 71 370 001'],
                'staff' => ['name' => 'Sara Akl',       'email' => 'sara.akl@nuzuh.lb',      'phone' => '+961 71 370 002'],
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

        // ─── Civilians (distributed to fill shelters realistically) ──────
        $civilianPool = [
            // name, email, phone, shelter_code (null = unassigned)
            ['Ahmad Al-Khatib',    'ahmad.khatib@gmail.com',    '+961 76 001 001', 'BEY-001'],
            ['Fatima Hassan',      'fatima.hassan@gmail.com',   '+961 76 001 002', 'BEY-001'],
            ['Mohammad Saleh',     'mohammad.saleh@gmail.com',  '+961 76 001 003', 'BEY-001'],
            ['Sara Khalil',        'sara.khalil@gmail.com',     '+961 76 001 004', 'BEY-001'],
            ['Rania Nasser',       'rania.nasser@gmail.com',    '+961 76 001 005', 'BEY-001'],
            ['Omar Haddad',        'omar.haddad@gmail.com',     '+961 76 001 006', 'BEY-001'],
            ['Hana Ibrahim',       'hana.ibrahim@gmail.com',    '+961 76 001 007', 'BEY-001'],
            ['Khaled Mansour',     'khaled.mansour@gmail.com',  '+961 76 001 008', 'BEY-001'],
            ['Lina Rahhal',        'lina.rahhal@gmail.com',     '+961 76 001 009', 'BEY-001'],
            ['Tarek Moussa',       'tarek.moussa@gmail.com',    '+961 76 001 010', 'BEY-001'],
            ['Dina Karami',        'dina.karami@gmail.com',     '+961 76 001 011', 'BEY-001'],
            ['Wissam Sfeir',       'wissam.sfeir@gmail.com',    '+961 76 001 012', 'BEY-001'],
            ['Maya Gemayel',       'maya.gemayel@gmail.com',    '+961 76 001 013', 'BEY-001'],
            ['Ramzi Khoury',       'ramzi.khoury@gmail.com',    '+961 76 001 014', 'BEY-001'],
            ['Nada Assaf',         'nada.assaf@gmail.com',      '+961 76 001 015', 'BEY-001'],
            ['Ali Zein',           'ali.zein@gmail.com',        '+961 76 001 016', 'BEY-001'],
            ['Mira Hajj',          'mira.hajj@gmail.com',       '+961 76 001 017', 'BEY-001'],
            ['Samir Akl',          'samir.akl@gmail.com',       '+961 76 001 018', 'BEY-001'],
            ['Rola Khalil2',       'rola.khalil2@gmail.com',    '+961 76 001 019', 'BEY-001'],
            ['Karim Nasser2',      'karim.nasser2@gmail.com',   '+961 76 001 020', 'BEY-001'],
            ['Nour Haddad',        'nour.haddad@gmail.com',     '+961 76 001 021', 'BEY-001'],
            ['Bassem Ibrahim2',    'bassem.ibrahim2@gmail.com', '+961 76 001 022', 'BEY-001'],
            ['Lara Hassan2',       'lara.hassan2@gmail.com',    '+961 76 001 023', 'BEY-001'],
            ['Fares Saleh2',       'fares.saleh2@gmail.com',    '+961 76 001 024', 'BEY-001'],
            ['Celine Moussa2',     'celine.moussa2@gmail.com',  '+961 76 001 025', 'BEY-001'],
            ['Tony Rahhal2',       'tony.rahhal2@gmail.com',    '+961 76 001 026', 'BEY-001'],
            ['Nadia Sfeir2',       'nadia.sfeir2@gmail.com',    '+961 76 001 027', 'BEY-001'],
            ['Elie Gemayel2',      'elie.gemayel2@gmail.com',   '+961 76 001 028', 'BEY-001'],
            // BEY-002 (cap=50, will be FULL at 50)
            ['Hassan Khalil3',     'hassan.khalil3@gmail.com',  '+961 76 002 001', 'BEY-002'],
            ['Zeina Karami2',      'zeina.karami2@gmail.com',   '+961 76 002 002', 'BEY-002'],
            ['Ahmad Zein2',        'ahmad.zein2@gmail.com',     '+961 76 002 003', 'BEY-002'],
            ['Fatima Khoury2',     'fatima.khoury2@gmail.com',  '+961 76 002 004', 'BEY-002'],
            ['Rami Assaf2',        'rami.assaf2@gmail.com',     '+961 76 002 005', 'BEY-002'],
            ['Sara Nasser3',       'sara.nasser3@gmail.com',    '+961 76 002 006', 'BEY-002'],
            ['Omar Ibrahim3',      'omar.ibrahim3@gmail.com',   '+961 76 002 007', 'BEY-002'],
            ['Hana Mansour2',      'hana.mansour2@gmail.com',   '+961 76 002 008', 'BEY-002'],
            ['Khaled Haddad2',     'khaled.haddad2@gmail.com',  '+961 76 002 009', 'BEY-002'],
            ['Lina Saleh3',        'lina.saleh3@gmail.com',     '+961 76 002 010', 'BEY-002'],
            ['Tarek Hassan3',      'tarek.hassan3@gmail.com',   '+961 76 002 011', 'BEY-002'],
            ['Dina Khalil4',       'dina.khalil4@gmail.com',    '+961 76 002 012', 'BEY-002'],
            ['Wissam Rahhal3',     'wissam.rahhal3@gmail.com',  '+961 76 002 013', 'BEY-002'],
            ['Maya Moussa3',       'maya.moussa3@gmail.com',    '+961 76 002 014', 'BEY-002'],
            ['Ramzi Sfeir3',       'ramzi.sfeir3@gmail.com',    '+961 76 002 015', 'BEY-002'],
            ['Nada Ibrahim4',      'nada.ibrahim4@gmail.com',   '+961 76 002 016', 'BEY-002'],
            ['Ali Hassan4',        'ali.hassan4@gmail.com',     '+961 76 002 017', 'BEY-002'],
            ['Mira Karami3',       'mira.karami3@gmail.com',    '+961 76 002 018', 'BEY-002'],
            ['Samir Zein3',        'samir.zein3@gmail.com',     '+961 76 002 019', 'BEY-002'],
            ['Rola Khoury3',       'rola.khoury3@gmail.com',    '+961 76 002 020', 'BEY-002'],
            ['Karim Assaf3',       'karim.assaf3@gmail.com',    '+961 76 002 021', 'BEY-002'],
            ['Nour Nasser4',       'nour.nasser4@gmail.com',    '+961 76 002 022', 'BEY-002'],
            ['Bassem Haddad3',     'bassem.haddad3@gmail.com',  '+961 76 002 023', 'BEY-002'],
            ['Lara Saleh4',        'lara.saleh4@gmail.com',     '+961 76 002 024', 'BEY-002'],
            ['Fares Hassan5',      'fares.hassan5@gmail.com',   '+961 76 002 025', 'BEY-002'],
            ['Celine Khalil5',     'celine.khalil5@gmail.com',  '+961 76 002 026', 'BEY-002'],
            ['Tony Rahhal5',       'tony.rahhal5@gmail.com',    '+961 76 002 027', 'BEY-002'],
            ['Nadia Moussa5',      'nadia.moussa5@gmail.com',   '+961 76 002 028', 'BEY-002'],
            ['Elie Sfeir5',        'elie.sfeir5@gmail.com',     '+961 76 002 029', 'BEY-002'],
            ['Rita Ibrahim5',      'rita.ibrahim5@gmail.com',   '+961 76 002 030', 'BEY-002'],
            ['Georges Karami5',    'georges.karami5@gmail.com', '+961 76 002 031', 'BEY-002'],
            ['Carole Zein5',       'carole.zein5@gmail.com',    '+961 76 002 032', 'BEY-002'],
            ['Joseph Khoury5',     'joseph.khoury5@gmail.com',  '+961 76 002 033', 'BEY-002'],
            ['Lynn Assaf5',        'lynn.assaf5@gmail.com',     '+961 76 002 034', 'BEY-002'],
            ['Patrick Nasser5',    'patrick.nasser5@gmail.com', '+961 76 002 035', 'BEY-002'],
            ['Maria Haddad5',      'maria.haddad5@gmail.com',   '+961 76 002 036', 'BEY-002'],
            ['Jean Saleh5',        'jean.saleh5@gmail.com',     '+961 76 002 037', 'BEY-002'],
            ['Reem Hassan6',       'reem.hassan6@gmail.com',    '+961 76 002 038', 'BEY-002'],
            ['Jad Khalil6',        'jad.khalil6@gmail.com',     '+961 76 002 039', 'BEY-002'],
            ['Tia Rahhal6',        'tia.rahhal6@gmail.com',     '+961 76 002 040', 'BEY-002'],
            ['Sana Moussa6',       'sana.moussa6@gmail.com',    '+961 76 002 041', 'BEY-002'],
            ['Chadi Sfeir6',       'chadi.sfeir6@gmail.com',    '+961 76 002 042', 'BEY-002'],
            ['Nisrine Ibrahim6',   'nisrine.ibrahim6@gmail.com','+961 76 002 043', 'BEY-002'],
            ['Samer Karami6',      'samer.karami6@gmail.com',   '+961 76 002 044', 'BEY-002'],
            ['Rana Zein6',         'rana.zein6@gmail.com',      '+961 76 002 045', 'BEY-002'],
            ['Elias Khoury6',      'elias.khoury6@gmail.com',   '+961 76 002 046', 'BEY-002'],
            ['Dalia Assaf6',       'dalia.assaf6@gmail.com',    '+961 76 002 047', 'BEY-002'],
            ['Rafiq Nasser6',      'rafiq.nasser6@gmail.com',   '+961 76 002 048', 'BEY-002'],
            ['Hind Haddad6',       'hind.haddad6@gmail.com',    '+961 76 002 049', 'BEY-002'],
            ['Bilal Saleh6',       'bilal.saleh6@gmail.com',    '+961 76 002 050', 'BEY-002'],
            // MTL-001 (cap=40, ~30 civilians)
            ['Nabil Khoury7',      'nabil.khoury7@gmail.com',   '+961 76 003 001', 'MTL-001'],
            ['Amal Hassan7',       'amal.hassan7@gmail.com',    '+961 76 003 002', 'MTL-001'],
            ['Jad Ibrahim7',       'jad.ibrahim7@gmail.com',    '+961 76 003 003', 'MTL-001'],
            ['Lena Khalil7',       'lena.khalil7@gmail.com',    '+961 76 003 004', 'MTL-001'],
            ['Wael Mansour7',      'wael.mansour7@gmail.com',   '+961 76 003 005', 'MTL-001'],
            ['Hiba Haddad7',       'hiba.haddad7@gmail.com',    '+961 76 003 006', 'MTL-001'],
            ['Ziad Saleh7',        'ziad.saleh7@gmail.com',     '+961 76 003 007', 'MTL-001'],
            ['Dana Hassan8',       'dana.hassan8@gmail.com',    '+961 76 003 008', 'MTL-001'],
            ['Imad Ibrahim8',      'imad.ibrahim8@gmail.com',   '+961 76 003 009', 'MTL-001'],
            ['Rima Khalil8',       'rima.khalil8@gmail.com',    '+961 76 003 010', 'MTL-001'],
            // NOR-001 (cap=35, FULL at 35)
            ['Saad Rahhal9',       'saad.rahhal9@gmail.com',    '+961 76 004 001', 'NOR-001'],
            ['Hana Moussa9',       'hana.moussa9@gmail.com',    '+961 76 004 002', 'NOR-001'],
            ['Majed Sfeir9',       'majed.sfeir9@gmail.com',    '+961 76 004 003', 'NOR-001'],
            ['Ines Gemayel9',      'ines.gemayel9@gmail.com',   '+961 76 004 004', 'NOR-001'],
            ['Wassim Khoury9',     'wassim.khoury9@gmail.com',  '+961 76 004 005', 'NOR-001'],
            ['Suzanne Assaf9',     'suzanne.assaf9@gmail.com',  '+961 76 004 006', 'NOR-001'],
            ['Bassel Nasser9',     'bassel.nasser9@gmail.com',  '+961 76 004 007', 'NOR-001'],
            ['Roula Haddad9',      'roula.haddad9@gmail.com',   '+961 76 004 008', 'NOR-001'],
            ['Maroun Saleh9',      'maroun.saleh9@gmail.com',   '+961 76 004 009', 'NOR-001'],
            ['Sohad Hassan10',     'sohad.hassan10@gmail.com',  '+961 76 004 010', 'NOR-001'],
            ['Yara Ibrahim10',     'yara.ibrahim10@gmail.com',  '+961 76 004 011', 'NOR-001'],
            ['Naji Khalil10',      'naji.khalil10@gmail.com',   '+961 76 004 012', 'NOR-001'],
            ['Faten Mansour10',    'faten.mansour10@gmail.com', '+961 76 004 013', 'NOR-001'],
            ['Dory Haddad10',      'dory.haddad10@gmail.com',   '+961 76 004 014', 'NOR-001'],
            ['Abir Saleh10',       'abir.saleh10@gmail.com',    '+961 76 004 015', 'NOR-001'],
            ['Ihab Hassan11',      'ihab.hassan11@gmail.com',   '+961 76 004 016', 'NOR-001'],
            ['Najwa Ibrahim11',    'najwa.ibrahim11@gmail.com', '+961 76 004 017', 'NOR-001'],
            ['Fayez Khalil11',     'fayez.khalil11@gmail.com',  '+961 76 004 018', 'NOR-001'],
            ['Samia Mansour11',    'samia.mansour11@gmail.com', '+961 76 004 019', 'NOR-001'],
            ['Nadim Haddad11',     'nadim.haddad11@gmail.com',  '+961 76 004 020', 'NOR-001'],
            ['Siham Saleh11',      'siham.saleh11@gmail.com',   '+961 76 004 021', 'NOR-001'],
            ['Walid Hassan12',     'walid.hassan12@gmail.com',  '+961 76 004 022', 'NOR-001'],
            ['Rasha Ibrahim12',    'rasha.ibrahim12@gmail.com', '+961 76 004 023', 'NOR-001'],
            ['Emile Khalil12',     'emile.khalil12@gmail.com',  '+961 76 004 024', 'NOR-001'],
            ['Widad Mansour12',    'widad.mansour12@gmail.com', '+961 76 004 025', 'NOR-001'],
            ['Charbel Haddad12',   'charbel.haddad12@gmail.com','+961 76 004 026', 'NOR-001'],
            ['Ghada Saleh12',      'ghada.saleh12@gmail.com',   '+961 76 004 027', 'NOR-001'],
            ['Nazih Hassan13',     'nazih.hassan13@gmail.com',  '+961 76 004 028', 'NOR-001'],
            ['Hiyam Ibrahim13',    'hiyam.ibrahim13@gmail.com', '+961 76 004 029', 'NOR-001'],
            ['Michel Khalil13',    'michel.khalil13@gmail.com', '+961 76 004 030', 'NOR-001'],
            ['Rana Mansour13',     'rana.mansour13@gmail.com',  '+961 76 004 031', 'NOR-001'],
            ['Camille Haddad13',   'camille.haddad13@gmail.com','+961 76 004 032', 'NOR-001'],
            ['Bayan Saleh13',      'bayan.saleh13@gmail.com',   '+961 76 004 033', 'NOR-001'],
            ['Antoun Hassan14',    'antoun.hassan14@gmail.com', '+961 76 004 034', 'NOR-001'],
            ['Viviane Ibrahim14',  'viviane.ibrahim14@gmail.com','+961 76 004 035','NOR-001'],
            // NOR-002 (cap=20, ~12 civilians)
            ['Adel Khoury15',      'adel.khoury15@gmail.com',   '+961 76 005 001', 'NOR-002'],
            ['Rim Assaf15',        'rim.assaf15@gmail.com',     '+961 76 005 002', 'NOR-002'],
            ['Firas Nasser15',     'firas.nasser15@gmail.com',  '+961 76 005 003', 'NOR-002'],
            ['Sandra Haddad15',    'sandra.haddad15@gmail.com', '+961 76 005 004', 'NOR-002'],
            ['Zaki Saleh15',       'zaki.saleh15@gmail.com',    '+961 76 005 005', 'NOR-002'],
            ['Alia Hassan16',      'alia.hassan16@gmail.com',   '+961 76 005 006', 'NOR-002'],
            ['Sami Ibrahim16',     'sami.ibrahim16@gmail.com',  '+961 76 005 007', 'NOR-002'],
            ['Norma Khalil16',     'norma.khalil16@gmail.com',  '+961 76 005 008', 'NOR-002'],
            // SOU-001 (cap=45, ~35 civilians)
            ['Hani Mansour17',     'hani.mansour17@gmail.com',  '+961 76 006 001', 'SOU-001'],
            ['Leila Haddad17',     'leila.haddad17@gmail.com',  '+961 76 006 002', 'SOU-001'],
            ['Mazen Saleh17',      'mazen.saleh17@gmail.com',   '+961 76 006 003', 'SOU-001'],
            ['Chloe Hassan18',     'chloe.hassan18@gmail.com',  '+961 76 006 004', 'SOU-001'],
            ['Tamer Ibrahim18',    'tamer.ibrahim18@gmail.com', '+961 76 006 005', 'SOU-001'],
            ['Vera Khalil18',      'vera.khalil18@gmail.com',   '+961 76 006 006', 'SOU-001'],
            ['Nadal Mansour18',    'nadal.mansour18@gmail.com', '+961 76 006 007', 'SOU-001'],
            ['Dima Haddad18',      'dima.haddad18@gmail.com',   '+961 76 006 008', 'SOU-001'],
            ['Ramez Saleh18',      'ramez.saleh18@gmail.com',   '+961 76 006 009', 'SOU-001'],
            ['Christelle Hassan19','christelle.h19@gmail.com',  '+961 76 006 010', 'SOU-001'],
            // BEK-001 (cap=60, ~40 civilians)
            ['Ismail Karami20',    'ismail.karami20@gmail.com', '+961 76 007 001', 'BEK-001'],
            ['Rosy Zein20',        'rosy.zein20@gmail.com',     '+961 76 007 002', 'BEK-001'],
            ['Tariq Khoury20',     'tariq.khoury20@gmail.com',  '+961 76 007 003', 'BEK-001'],
            ['Petra Assaf20',      'petra.assaf20@gmail.com',   '+961 76 007 004', 'BEK-001'],
            ['Ahmad Nasser21',     'ahmad.nasser21@gmail.com',  '+961 76 007 005', 'BEK-001'],
            ['Suha Haddad21',      'suha.haddad21@gmail.com',   '+961 76 007 006', 'BEK-001'],
            ['Hasan Saleh21',      'hasan.saleh21@gmail.com',   '+961 76 007 007', 'BEK-001'],
            ['Tamara Hassan22',    'tamara.hassan22@gmail.com', '+961 76 007 008', 'BEK-001'],
            ['Jihad Ibrahim22',    'jihad.ibrahim22@gmail.com', '+961 76 007 009', 'BEK-001'],
            ['Mirna Khalil22',     'mirna.khalil22@gmail.com',  '+961 76 007 010', 'BEK-001'],
            // AKK-001 (cap=25, FULL at 25)
            ['Samir Mansour23',    'samir.mansour23@gmail.com', '+961 76 008 001', 'AKK-001'],
            ['Heba Haddad23',      'heba.haddad23@gmail.com',   '+961 76 008 002', 'AKK-001'],
            ['Fawzi Saleh23',      'fawzi.saleh23@gmail.com',   '+961 76 008 003', 'AKK-001'],
            ['Nayla Hassan24',     'nayla.hassan24@gmail.com',  '+961 76 008 004', 'AKK-001'],
            ['Makram Ibrahim24',   'makram.ibrahim24@gmail.com','+961 76 008 005', 'AKK-001'],
            ['Rawan Khalil24',     'rawan.khalil24@gmail.com',  '+961 76 008 006', 'AKK-001'],
            ['Hicham Mansour24',   'hicham.mansour24@gmail.com','+961 76 008 007', 'AKK-001'],
            ['Abla Haddad24',      'abla.haddad24@gmail.com',   '+961 76 008 008', 'AKK-001'],
            ['Faisal Saleh24',     'faisal.saleh24@gmail.com',  '+961 76 008 009', 'AKK-001'],
            ['Nadia Hassan25',     'nadia.hassan25@gmail.com',  '+961 76 008 010', 'AKK-001'],
            ['Walaa Ibrahim25',    'walaa.ibrahim25@gmail.com', '+961 76 008 011', 'AKK-001'],
            ['Suhair Khalil25',    'suhair.khalil25@gmail.com', '+961 76 008 012', 'AKK-001'],
            ['Mohamad Mansour25',  'mohamad.mansour25@gmail.com','+961 76 008 013','AKK-001'],
            ['Salwa Haddad25',     'salwa.haddad25@gmail.com',  '+961 76 008 014', 'AKK-001'],
            ['Ghassan Saleh25',    'ghassan.saleh25@gmail.com', '+961 76 008 015', 'AKK-001'],
            ['Randa Hassan26',     'randa.hassan26@gmail.com',  '+961 76 008 016', 'AKK-001'],
            ['Elham Ibrahim26',    'elham.ibrahim26@gmail.com', '+961 76 008 017', 'AKK-001'],
            ['Habib Khalil26',     'habib.khalil26@gmail.com',  '+961 76 008 018', 'AKK-001'],
            ['Soad Mansour26',     'soad.mansour26@gmail.com',  '+961 76 008 019', 'AKK-001'],
            ['Toufic Haddad26',    'toufic.haddad26@gmail.com', '+961 76 008 020', 'AKK-001'],
            ['Ines Saleh26',       'ines.saleh26@gmail.com',    '+961 76 008 021', 'AKK-001'],
            ['Aziz Hassan27',      'aziz.hassan27@gmail.com',   '+961 76 008 022', 'AKK-001'],
            ['Huda Ibrahim27',     'huda.ibrahim27@gmail.com',  '+961 76 008 023', 'AKK-001'],
            ['Fouad Khalil27',     'fouad.khalil27@gmail.com',  '+961 76 008 024', 'AKK-001'],
            ['Noha Mansour27',     'noha.mansour27@gmail.com',  '+961 76 008 025', 'AKK-001'],
            // Unassigned civilians (seeking shelter)
            ['Rabih Haddad28',     'rabih.haddad28@gmail.com',  '+961 76 009 001', null],
            ['Sanaa Saleh28',      'sanaa.saleh28@gmail.com',   '+961 76 009 002', null],
            ['Naser Hassan28',     'naser.hassan28@gmail.com',  '+961 76 009 003', null],
            ['Aline Ibrahim28',    'aline.ibrahim28@gmail.com', '+961 76 009 004', null],
            ['Oussama Khalil28',   'oussama.khalil28@gmail.com','+961 76 009 005', null],
        ];

        $shelterCache = [];
        foreach ($civilianPool as $i => [$name, $email, $phone, $shelterCode]) {
            if ($shelterCode && ! isset($shelterCache[$shelterCode])) {
                $shelterCache[$shelterCode] = Shelter::where('code', $shelterCode)->value('id');
            }
            $shelterId = $shelterCode ? ($shelterCache[$shelterCode] ?? null) : null;

            User::firstOrCreate(['email' => $email], [
                'name'       => $name,
                'password'   => Hash::make('password'),
                'phone'      => $phone,
                'role'       => 'civilian',
                'shelter_id' => $shelterId,
                'is_active'  => true,
            ]);
        }

        // ─── Sync shelter statuses based on actual occupancy ──────────────
        foreach (Shelter::all() as $shelter) {
            $count = User::where('shelter_id', $shelter->id)->where('role', 'civilian')->count();
            if ($shelter->capacity > 0) {
                $shelter->update(['status' => $count >= $shelter->capacity ? 'full' : 'active']);
            }
        }
    }
}

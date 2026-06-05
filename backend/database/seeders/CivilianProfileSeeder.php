<?php

namespace Database\Seeders;

use App\Models\CivilianPrivateHousing;
use App\Models\User;
use Illuminate\Database\Seeder;

class CivilianProfileSeeder extends Seeder
{
    public function run(): void
    {
        // ── Primary showcase civilian — Ali Haddad (complete profile, shelter) ──
        $ali = User::where('email', 'civilian@nuzuh.com')->first();
        if ($ali) {
            $ali->civilianProfile()->updateOrCreate(['user_id' => $ali->id], [
                'date_of_birth'    => '1988-03-15',
                'gender'           => 'male',
                'current_location' => 'Martyrs Square Shelter, Beirut',
                'notes'            => 'Family of 3. Displaced from South Beirut.',
                'id_type'          => 'national_id',
                'id_number'        => 'LB-1988-441823',
                'housing_status'   => 'shelter',
            ]);
        }

        // ── Primary showcase civilian 2 — Mariam Saad (private housing) ────────
        $mariam = User::where('email', 'civilian2@nuzuh.com')->first();
        if ($mariam) {
            $mariam->civilianProfile()->updateOrCreate(['user_id' => $mariam->id], [
                'date_of_birth'    => '1992-07-22',
                'gender'           => 'female',
                'current_location' => 'Hamra, Beirut',
                'notes'            => 'Renting a small apartment in Hamra district.',
                'id_type'          => 'national_id',
                'id_number'        => 'LB-1992-338871',
                'housing_status'   => 'private',
            ]);
            CivilianPrivateHousing::updateOrCreate(['civilian_id' => $mariam->id], [
                'property_type'    => 'apartment',
                'address'          => 'Rue Hamra, Building 14, Apt 3',
                'governorate'      => 'Beirut',
                'district'         => 'Ras Beirut',
                'landlord_name'    => 'Joseph Khoury',
                'landlord_phone'   => '+961 70 888 777',
                'monthly_rent'     => 350.00,
                'lease_start_date' => '2025-11-01',
                'notes'            => 'Month-to-month lease.',
            ]);
        }

        // ── Primary showcase civilian 3 — Ahmad Fares (seeking) ─────────────────
        $ahmad = User::where('email', 'civilian3@nuzuh.com')->first();
        if ($ahmad) {
            $ahmad->civilianProfile()->updateOrCreate(['user_id' => $ahmad->id], [
                'date_of_birth'    => '1995-01-10',
                'gender'           => 'male',
                'current_location' => 'Staying with relatives in Bourj Hammoud',
                'notes'            => 'Looking for a permanent shelter placement.',
                'id_type'          => 'passport',
                'id_number'        => 'PAS-2019-LB-88762',
                'housing_status'   => 'seeking',
            ]);
        }

        // ── BEY-001 civilians ─────────────────────────────────────────────────
        $profiles = [
            ['fatima.hassan@gmail.com',  '1990-05-12', 'female', 'Maarad Shelter, Beirut',  'national_id', 'LB-1990-112233', 'shelter'],
            ['mohammad.saleh@gmail.com', '1985-09-03', 'male',   'Maarad Shelter, Beirut',  'national_id', 'LB-1985-445566', 'shelter'],
            ['sara.khalil@gmail.com',    '1993-12-18', 'female', 'Maarad Shelter, Beirut',  'passport',    'PAS-2020-LB-11223', 'shelter'],
            ['rania.nasser@gmail.com',   '1987-04-25', 'female', 'Maarad Shelter, Beirut',  'national_id', 'LB-1987-778899', 'shelter'],
            ['omar.haddad@gmail.com',    '1982-11-07', 'male',   'Maarad Shelter, Beirut',  'national_id', 'LB-1982-334455', 'shelter'],
            ['hana.ibrahim@gmail.com',   '1996-08-14', 'female', 'Maarad Shelter, Beirut',  'national_id', 'LB-1996-556677', 'shelter'],
            ['khaled.mansour@gmail.com', '1979-02-28', 'male',   'Maarad Shelter, Beirut',  'national_id', 'LB-1979-889900', 'shelter'],
            ['lina.rahhal@gmail.com',    '1998-06-05', 'female', 'Maarad Shelter, Beirut',  'national_id', 'LB-1998-221144', 'shelter'],
            ['tarek.moussa@gmail.com',   '1983-10-19', 'male',   'Maarad Shelter, Beirut',  'passport',    'PAS-2018-LB-55678', 'shelter'],
            ['dina.karami@gmail.com',    '1991-03-31', 'female', 'Maarad Shelter, Beirut',  'national_id', 'LB-1991-663399', 'shelter'],
            // BEY-002
            ['hassan.khalil@gmail.com',  '1984-07-09', 'male',   'Sports City, Beirut',     'national_id', 'LB-1984-100200', 'shelter'],
            ['zeina.karami@gmail.com',   '1997-02-14', 'female', 'Sports City, Beirut',     'national_id', 'LB-1997-200300', 'shelter'],
            ['ahmad.zein@gmail.com',     '1989-11-20', 'male',   'Sports City, Beirut',     'passport',    'PAS-2019-LB-30040', 'shelter'],
            ['fatima.khoury@gmail.com',  '1994-04-08', 'female', 'Sports City, Beirut',     'national_id', 'LB-1994-400500', 'shelter'],
            ['rami.assaf@gmail.com',     '1980-08-25', 'male',   'Sports City, Beirut',     'national_id', 'LB-1980-500600', 'shelter'],
            // MTL-001
            ['nabil.khoury@gmail.com',   '1975-03-17', 'male',   'Ghazir School, Keserwan', 'national_id', 'LB-1975-600700', 'shelter'],
            ['amal.hassan@gmail.com',    '1999-09-01', 'female', 'Ghazir School, Keserwan', 'national_id', 'LB-1999-700800', 'shelter'],
            ['jad.ibrahim@gmail.com',    '1992-06-12', 'male',   'Ghazir School, Keserwan', 'passport',    'PAS-2021-LB-80090', 'shelter'],
            ['lena.khalil@gmail.com',    '1986-01-28', 'female', 'Ghazir School, Keserwan', 'national_id', 'LB-1986-900100', 'shelter'],
            // NOR-001
            ['saad.rahhal@gmail.com',    '1978-12-05', 'male',   'Tripoli School',          'national_id', 'LB-1978-010203', 'shelter'],
            ['hana.moussa@gmail.com',    '2001-03-22', 'female', 'Tripoli School',          'national_id', 'LB-2001-020304', 'shelter'],
            ['majed.sfeir@gmail.com',    '1987-07-14', 'male',   'Tripoli School',          'passport',    'PAS-2017-LB-30405', 'shelter'],
            ['ines.gemayel@gmail.com',   '1995-10-03', 'female', 'Tripoli School',          'national_id', 'LB-1995-040506', 'shelter'],
            // NOR-002
            ['adel.khoury@gmail.com',    '1983-05-19', 'male',   'Koura Hall, Amioun',      'national_id', 'LB-1983-050607', 'shelter'],
            ['rim.assaf@gmail.com',      '1998-11-07', 'female', 'Koura Hall, Amioun',      'national_id', 'LB-1998-060708', 'shelter'],
            ['firas.nasser@gmail.com',   '1990-02-28', 'male',   'Koura Hall, Amioun',      'passport',    'PAS-2020-LB-70809', 'shelter'],
            // SOU-001
            ['hani.mansour@gmail.com',   '1977-08-11', 'male',   'Saida Cultural Center',   'national_id', 'LB-1977-070809', 'shelter'],
            ['leila.haddad@gmail.com',   '1993-04-16', 'female', 'Saida Cultural Center',   'national_id', 'LB-1993-080910', 'shelter'],
            ['mazen.saleh@gmail.com',    '1985-12-30', 'male',   'Saida Cultural Center',   'national_id', 'LB-1985-091011', 'shelter'],
            ['chloe.hassan@gmail.com',   '2000-07-05', 'female', 'Saida Cultural Center',   'passport',    'PAS-2022-LB-10111', 'shelter'],
            // BEK-001
            ['ismail.karami@gmail.com',  '1981-09-23', 'male',   'Chtoura Sports Hall',     'national_id', 'LB-1981-101112', 'shelter'],
            ['rosy.zein@gmail.com',      '1997-01-15', 'female', 'Chtoura Sports Hall',     'national_id', 'LB-1997-111213', 'shelter'],
            ['tariq.khoury@gmail.com',   '1988-06-07', 'male',   'Chtoura Sports Hall',     'passport',    'PAS-2018-LB-12131', 'shelter'],
            ['petra.assaf@gmail.com',    '1994-03-29', 'female', 'Chtoura Sports Hall',     'national_id', 'LB-1994-121314', 'shelter'],
            ['ahmad.nasser@gmail.com',   '1979-11-18', 'male',   'Chtoura Sports Hall',     'national_id', 'LB-1979-131415', 'shelter'],
            // AKK-001
            ['samir.mansour@gmail.com',  '1976-07-04', 'male',   'Halba Municipal Center',  'national_id', 'LB-1976-141516', 'shelter'],
            ['heba.haddad@gmail.com',    '2002-02-19', 'female', 'Halba Municipal Center',  'national_id', 'LB-2002-151617', 'shelter'],
            ['fawzi.saleh@gmail.com',    '1989-09-09', 'male',   'Halba Municipal Center',  'passport',    'PAS-2019-LB-16171', 'shelter'],
            ['nayla.hassan@gmail.com',   '1996-05-25', 'female', 'Halba Municipal Center',  'national_id', 'LB-1996-161718', 'shelter'],
            // Seeking
            ['rabih.haddad@gmail.com',   '1990-04-12', 'male',   'Bourj Hammoud (temporary)', 'national_id', 'LB-1990-999001', 'seeking'],
            ['sanaa.saleh@gmail.com',    '1985-08-20', 'female', 'Ashrafieh (temporary)',    'national_id', 'LB-1985-999002', 'seeking'],
            ['naser.hassan@gmail.com',   '1993-11-03', 'male',   'Dekwaneh (temporary)',     'passport',    'PAS-2021-LB-99900', 'seeking'],
        ];

        foreach ($profiles as [$email, $dob, $gender, $loc, $idType, $idNum, $housing]) {
            $user = User::where('email', $email)->first();
            if (! $user) continue;
            $user->civilianProfile()->updateOrCreate(['user_id' => $user->id], [
                'date_of_birth'    => $dob,
                'gender'           => $gender,
                'current_location' => $loc,
                'id_type'          => $idType,
                'id_number'        => $idNum,
                'housing_status'   => $housing,
            ]);
        }

        // ── Backfill — every remaining civilian gets a complete profile ────────
        // Guarantees the demo can browse a full profile (and ID document) for
        // every civilian, not just the hand-authored showcase accounts above.
        User::where('role', 'civilian')
            ->whereDoesntHave('civilianProfile')
            ->orderBy('id')
            ->get()
            ->each(function (User $user) {
                $year       = 1972 + ($user->id % 32);
                $month      = str_pad(($user->id % 12) + 1, 2, '0', STR_PAD_LEFT);
                $day        = str_pad(($user->id % 27) + 1, 2, '0', STR_PAD_LEFT);
                $hasShelter = (bool) $user->shelter_id;

                $user->civilianProfile()->create([
                    'date_of_birth'    => "{$year}-{$month}-{$day}",
                    'gender'           => $user->id % 2 === 0 ? 'female' : 'male',
                    'current_location' => $hasShelter ? ($user->shelter?->name ?? 'Assigned shelter') : 'Temporary accommodation',
                    'id_type'          => 'national_id',
                    'id_number'        => 'LB-' . $year . '-' . (800000 + $user->id),
                    'housing_status'   => $hasShelter ? 'shelter' : 'seeking',
                ]);
            });
    }
}

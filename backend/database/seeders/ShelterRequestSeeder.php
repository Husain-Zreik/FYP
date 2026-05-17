<?php

namespace Database\Seeders;

use App\Models\Shelter;
use App\Models\ShelterRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class ShelterRequestSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Invitations — shelter admin invited an unassigned civilian ────
        // These simulate shelters reaching out to known civilians
        $invitations = [
            [
                'shelter_code'   => 'MTL-001', // Ghazir — has space (cap=40, 10 civilians)
                'civilian_email' => 'rabih.haddad28@gmail.com',
                'initiated_by'   => 'tony.gemayel@nuzuh.lb', // Ghazir admin
            ],
            [
                'shelter_code'   => 'SOU-001', // Saida — has space (cap=45, 10 civilians)
                'civilian_email' => 'sanaa.saleh28@gmail.com',
                'initiated_by'   => 'ali.hassan@nuzuh.lb', // Saida admin
            ],
            [
                'shelter_code'   => 'BEK-001', // Chtoura — has space (cap=60, 10 civilians)
                'civilian_email' => 'naser.hassan28@gmail.com',
                'initiated_by'   => 'youssef.karami@nuzuh.lb', // Chtoura admin
            ],
        ];

        foreach ($invitations as $inv) {
            $shelter  = Shelter::where('code', $inv['shelter_code'])->first();
            $civilian = User::where('email', $inv['civilian_email'])->first();
            $admin    = User::where('email', $inv['initiated_by'])->first();

            if (! $shelter || ! $civilian || ! $admin) continue;

            ShelterRequest::firstOrCreate(
                ['civilian_id' => $civilian->id, 'shelter_id' => $shelter->id, 'status' => 'pending'],
                [
                    'type'         => 'invitation',
                    'initiated_by' => $admin->id,
                ]
            );
        }

        // ─── Requests — civilian asked to join a shelter ───────────────────
        // These simulate civilians using the mobile app to request placement
        $requests = [
            [
                'shelter_code'   => 'NOR-002', // Koura — has space (cap=20, 8 civilians)
                'civilian_email' => 'aline.ibrahim28@gmail.com',
            ],
            [
                'shelter_code'   => 'BEK-001', // Chtoura — has space
                'civilian_email' => 'oussama.khalil28@gmail.com',
            ],
        ];

        foreach ($requests as $req) {
            $shelter  = Shelter::where('code', $req['shelter_code'])->first();
            $civilian = User::where('email', $req['civilian_email'])->first();

            if (! $shelter || ! $civilian) continue;

            ShelterRequest::firstOrCreate(
                ['civilian_id' => $civilian->id, 'shelter_id' => $shelter->id, 'status' => 'pending'],
                [
                    'type'         => 'request',
                    'initiated_by' => $civilian->id,
                ]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\CivilianNeed;
use App\Models\Shelter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CivilianNeedSeeder extends Seeder
{
    public function run(): void
    {
        $shelters = Shelter::orderBy('id')->take(4)->get();

        $shelter1 = $shelters->get(0);
        $shelter2 = $shelters->get(1);
        $shelter3 = $shelters->get(2);
        $shelter4 = $shelters->get(3);

        $civilians1 = User::where('role', 'civilian')->where('shelter_id', $shelter1->id)->get();
        $civilians2 = User::where('role', 'civilian')->where('shelter_id', $shelter2->id)->get();
        $civilians3 = User::where('role', 'civilian')->where('shelter_id', $shelter3->id)->get();
        $civilians4 = User::where('role', 'civilian')->where('shelter_id', $shelter4->id)->get();

        $admin1 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter1->id)->first();
        $admin2 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter2->id)->first();
        $admin3 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter3->id)->first();
        $admin4 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter4->id)->first();

        $needs = [
            // 1 — shelter 1, civilian 1
            [
                'civilian_id'   => $civilians1->get(0)?->id,
                'shelter_id'    => $shelter1->id,
                'category'      => 'food',
                'description'   => 'My family of 4 has not received a food parcel in 2 weeks. We are running out of provisions.',
                'urgency'       => 'high',
                'status'        => 'pending',
                'shelter_notes' => null,
                'reviewed_by'   => null,
                'reviewed_at'   => null,
                'created_at'    => Carbon::now()->subDays(3),
            ],
            // 2 — shelter 1, civilian 2
            [
                'civilian_id'   => $civilians1->get(1)?->id,
                'shelter_id'    => $shelter1->id,
                'category'      => 'medical',
                'description'   => 'I have a chronic back condition and need a proper mattress. Currently sleeping on the floor.',
                'urgency'       => 'medium',
                'status'        => 'pending',
                'shelter_notes' => null,
                'reviewed_by'   => null,
                'reviewed_at'   => null,
                'created_at'    => Carbon::now()->subDays(5),
            ],
            // 3 — shelter 2, civilian 1
            [
                'civilian_id'   => $civilians2->get(0)?->id,
                'shelter_id'    => $shelter2->id,
                'category'      => 'clothing',
                'description'   => 'My three children aged 3, 7, and 10 urgently need warm clothing for the winter season.',
                'urgency'       => 'high',
                'status'        => 'in_review',
                'shelter_notes' => 'Checking available clothing donations, will respond by end of week.',
                'reviewed_by'   => $admin2?->id,
                'reviewed_at'   => Carbon::now()->subDays(2),
                'created_at'    => Carbon::now()->subWeek(),
            ],
            // 4 — shelter 2, civilian 2
            [
                'civilian_id'   => $civilians2->get(1)?->id,
                'shelter_id'    => $shelter2->id,
                'category'      => 'bedding',
                'description'   => 'The blanket I was given is torn and no longer provides adequate warmth at night.',
                'urgency'       => 'medium',
                'status'        => 'fulfilled',
                'shelter_notes' => 'Provided 2 blankets and a pillow set from our supply room.',
                'reviewed_by'   => $admin2?->id,
                'reviewed_at'   => Carbon::now()->subWeek(),
                'created_at'    => Carbon::now()->subWeeks(2),
            ],
            // 5 — shelter 3, civilian 1
            [
                'civilian_id'   => $civilians3->get(0)?->id,
                'shelter_id'    => $shelter3->id,
                'category'      => 'hygiene',
                'description'   => 'I have been unable to obtain basic hygiene products for 3 weeks. I need soap, toothpaste and shampoo.',
                'urgency'       => 'medium',
                'status'        => 'pending',
                'shelter_notes' => null,
                'reviewed_by'   => null,
                'reviewed_at'   => null,
                'created_at'    => Carbon::now()->subDays(4),
            ],
            // 6 — shelter 3, civilian 2
            [
                'civilian_id'   => $civilians3->get(1)?->id,
                'shelter_id'    => $shelter3->id,
                'category'      => 'baby_supplies',
                'description'   => 'I have a 4-month-old baby who has run out of formula and diapers. This is urgent.',
                'urgency'       => 'critical',
                'status'        => 'in_review',
                'shelter_notes' => 'Escalated to shelter admin. Sourcing emergency supplies today.',
                'reviewed_by'   => $admin3?->id,
                'reviewed_at'   => Carbon::now()->subDay(),
                'created_at'    => Carbon::now()->subDays(2),
            ],
            // 7 — shelter 4, civilian 1
            [
                'civilian_id'   => $civilians4->get(0)?->id,
                'shelter_id'    => $shelter4->id,
                'category'      => 'medical',
                'description'   => 'I need blood pressure medication (Amlodipine 5mg) — I have been without it for 5 days.',
                'urgency'       => 'critical',
                'status'        => 'pending',
                'shelter_notes' => null,
                'reviewed_by'   => null,
                'reviewed_at'   => null,
                'created_at'    => Carbon::now()->subDay(),
            ],
            // 8 — shelter 4, civilian 2
            [
                'civilian_id'   => $civilians4->get(1)?->id,
                'shelter_id'    => $shelter4->id,
                'category'      => 'food',
                'description'   => 'I am diabetic and require a special diet. The standard food parcels do not accommodate my dietary requirements.',
                'urgency'       => 'high',
                'status'        => 'pending',
                'shelter_notes' => null,
                'reviewed_by'   => null,
                'reviewed_at'   => null,
                'created_at'    => Carbon::now()->subDays(2),
            ],
            // 9 — shelter 1, civilian 3 (fallback to civilian 1)
            [
                'civilian_id'   => ($civilians1->get(2) ?? $civilians1->get(0))?->id,
                'shelter_id'    => $shelter1->id,
                'category'      => 'clothing',
                'description'   => 'I lost all my belongings when I had to evacuate. I need basic clothing items for daily use.',
                'urgency'       => 'medium',
                'status'        => 'fulfilled',
                'shelter_notes' => 'Provided clothing bundle from donations. Civilian confirmed receipt.',
                'reviewed_by'   => $admin1?->id,
                'reviewed_at'   => Carbon::now()->subWeeks(3),
                'created_at'    => Carbon::now()->subWeeks(4),
            ],
            // 10 — shelter 2, civilian 3 (fallback to civilian 1)
            [
                'civilian_id'   => ($civilians2->get(2) ?? $civilians2->get(0))?->id,
                'shelter_id'    => $shelter2->id,
                'category'      => 'other',
                'description'   => 'I need reading glasses — I am visually impaired and cannot function without them. Mine broke during the evacuation.',
                'urgency'       => 'high',
                'status'        => 'pending',
                'shelter_notes' => null,
                'reviewed_by'   => null,
                'reviewed_at'   => null,
                'created_at'    => Carbon::now()->subDays(3),
            ],
        ];

        foreach ($needs as $data) {
            if (! $data['civilian_id']) {
                continue;
            }

            $createdAt = $data['created_at'];
            unset($data['created_at']);

            $need = CivilianNeed::create($data);
            $need->created_at = $createdAt;
            $need->save();
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\AidCategory;
use App\Models\AidSchedule;
use App\Models\Shelter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AidScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $govAdmin = User::where('role', 'government_admin')->first();
        $shelters = Shelter::orderBy('id')->take(3)->get();

        $shelter1 = $shelters->get(0);
        $shelter2 = $shelters->get(1);
        $shelter3 = $shelters->get(2);

        $admin1 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter1->id)->first();
        $admin2 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter2->id)->first();

        $civilian1 = User::where('role', 'civilian')->where('shelter_id', $shelter1->id)->first();
        $civilian2 = User::where('role', 'civilian')->where('shelter_id', $shelter2->id)->first();

        $catFood    = AidCategory::where('name', 'Food Parcels')->first();
        $catHygiene = AidCategory::where('name', 'Hygiene Kits')->first();
        $catWater   = AidCategory::where('name', 'Drinking Water')->first();
        $catBaby    = AidCategory::where('name', 'Baby Supplies')->first();

        $schedules = [
            // 1 — gov → shelter 1, Food Parcels, monthly, active
            [
                'level'           => 'government_shelter',
                'created_by'      => $govAdmin->id,
                'shelter_id'      => $shelter1->id,
                'civilian_id'     => null,
                'aid_category_id' => $catFood->id,
                'quantity'        => 50,
                'frequency'       => 'monthly',
                'notes'           => 'Monthly food parcel allocation for shelter residents',
                'starts_at'       => Carbon::now()->subMonths(3)->toDateString(),
                'ends_at'         => null,
                'is_active'       => true,
                'last_sent_at'    => Carbon::now()->subMonth()->toDateString(),
            ],
            // 2 — gov → shelter 2, Hygiene Kits, monthly, active
            [
                'level'           => 'government_shelter',
                'created_by'      => $govAdmin->id,
                'shelter_id'      => $shelter2->id,
                'civilian_id'     => null,
                'aid_category_id' => $catHygiene->id,
                'quantity'        => 30,
                'frequency'       => 'monthly',
                'notes'           => 'Monthly hygiene kit distribution',
                'starts_at'       => Carbon::now()->subMonths(2)->toDateString(),
                'ends_at'         => null,
                'is_active'       => true,
                'last_sent_at'    => Carbon::now()->subWeeks(3)->toDateString(),
            ],
            // 3 — gov → shelter 3, Drinking Water, weekly, inactive
            [
                'level'           => 'government_shelter',
                'created_by'      => $govAdmin->id,
                'shelter_id'      => $shelter3->id,
                'civilian_id'     => null,
                'aid_category_id' => $catWater->id,
                'quantity'        => 500,
                'frequency'       => 'weekly',
                'notes'           => 'Weekly water supply — currently paused due to municipal supply restoration',
                'starts_at'       => Carbon::now()->subWeeks(6)->toDateString(),
                'ends_at'         => null,
                'is_active'       => false,
                'last_sent_at'    => Carbon::now()->subWeeks(2)->toDateString(),
            ],
            // 4 — shelter 1 admin → civilian 1, Food Parcels, weekly, active
            [
                'level'           => 'shelter_civilian',
                'created_by'      => $admin1?->id,
                'shelter_id'      => $shelter1->id,
                'civilian_id'     => $civilian1?->id,
                'aid_category_id' => $catFood->id,
                'quantity'        => 1,
                'frequency'       => 'weekly',
                'notes'           => 'Weekly food parcel for elderly resident',
                'starts_at'       => Carbon::now()->subWeeks(6)->toDateString(),
                'ends_at'         => null,
                'is_active'       => true,
                'last_sent_at'    => Carbon::now()->subWeek()->toDateString(),
            ],
            // 5 — shelter 2 admin → civilian 2, Baby Supplies, monthly, active
            [
                'level'           => 'shelter_civilian',
                'created_by'      => $admin2?->id,
                'shelter_id'      => $shelter2->id,
                'civilian_id'     => $civilian2?->id,
                'aid_category_id' => $catBaby->id,
                'quantity'        => 1,
                'frequency'       => 'monthly',
                'notes'           => 'Monthly baby supplies for infant care',
                'starts_at'       => Carbon::now()->subMonths(2)->toDateString(),
                'ends_at'         => null,
                'is_active'       => true,
                'last_sent_at'    => Carbon::now()->subWeeks(3)->toDateString(),
            ],
        ];

        foreach ($schedules as $data) {
            if (! $data['created_by'] || ! $data['aid_category_id']) {
                continue;
            }

            AidSchedule::create($data);
        }
    }
}

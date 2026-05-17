<?php

namespace Database\Seeders;

use App\Models\AidCategory;
use App\Models\AidDispatch;
use App\Models\Shelter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AidDispatchSeeder extends Seeder
{
    public function run(): void
    {
        $govAdmin = User::where('role', 'government_admin')->first();
        $shelters = Shelter::orderBy('id')->take(4)->get();

        $shelter1 = $shelters->get(0);
        $shelter2 = $shelters->get(1);
        $shelter3 = $shelters->get(2);

        $admin1 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter1->id)->first();
        $admin2 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter2->id)->first();
        $admin3 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter3->id)->first();

        $civilians1 = User::where('role', 'civilian')->where('shelter_id', $shelter1->id)->take(4)->get();
        $civilians2 = User::where('role', 'civilian')->where('shelter_id', $shelter2->id)->get();
        $civilians3 = User::where('role', 'civilian')->where('shelter_id', $shelter3->id)->get();

        $civilian1a = $civilians1->get(0);
        $civilian1b = $civilians1->get(1);
        $civilian2a = $civilians2->get(0);
        $civilian3a = $civilians3->get(0);

        $catFood    = AidCategory::where('name', 'Food Parcels')->first();
        $catMedical = AidCategory::where('name', 'Medical Kits')->first();
        $catBlanket = AidCategory::where('name', 'Blankets')->first();
        $catHygiene = AidCategory::where('name', 'Hygiene Kits')->first();
        $catBaby    = AidCategory::where('name', 'Baby Supplies')->first();

        $dispatches = [
            // 1 — gov → shelter 1, Food Parcels, accepted
            [
                'level'            => 'government_shelter',
                'dispatched_by'    => $govAdmin->id,
                'shelter_id'       => $shelter1->id,
                'civilian_id'      => null,
                'aid_category_id'  => $catFood->id,
                'quantity'         => 50,
                'notes'            => 'Monthly food allocation',
                'status'           => 'accepted',
                'dispatched_at'    => Carbon::now()->subWeeks(3),
                'responded_at'     => Carbon::now()->subWeeks(3),
                'received_at'      => Carbon::now()->subWeeks(3)->toDateString(),
                'responded_by'     => $admin1?->id,
                'rejection_reason' => null,
            ],
            // 2 — gov → shelter 2, Medical Kits, accepted
            [
                'level'            => 'government_shelter',
                'dispatched_by'    => $govAdmin->id,
                'shelter_id'       => $shelter2->id,
                'civilian_id'      => null,
                'aid_category_id'  => $catMedical->id,
                'quantity'         => 15,
                'notes'            => 'Emergency medical supply replenishment',
                'status'           => 'accepted',
                'dispatched_at'    => Carbon::now()->subWeeks(2),
                'responded_at'     => Carbon::now()->subWeeks(2),
                'received_at'      => Carbon::now()->subWeeks(2)->toDateString(),
                'responded_by'     => $admin2?->id,
                'rejection_reason' => null,
            ],
            // 3 — gov → shelter 3, Blankets, pending
            [
                'level'            => 'government_shelter',
                'dispatched_by'    => $govAdmin->id,
                'shelter_id'       => $shelter3->id,
                'civilian_id'      => null,
                'aid_category_id'  => $catBlanket->id,
                'quantity'         => 100,
                'notes'            => 'Winter preparation — blanket distribution',
                'status'           => 'pending',
                'dispatched_at'    => Carbon::now()->subDays(3),
                'responded_at'     => null,
                'received_at'      => null,
                'responded_by'     => null,
                'rejection_reason' => null,
            ],
            // 4 — gov → shelter 1, Hygiene Kits, rejected
            [
                'level'            => 'government_shelter',
                'dispatched_by'    => $govAdmin->id,
                'shelter_id'       => $shelter1->id,
                'civilian_id'      => null,
                'aid_category_id'  => $catHygiene->id,
                'quantity'         => 40,
                'notes'            => null,
                'status'           => 'rejected',
                'dispatched_at'    => Carbon::now()->subWeek(),
                'responded_at'     => Carbon::now()->subWeek(),
                'received_at'      => null,
                'responded_by'     => $admin1?->id,
                'rejection_reason' => 'Delivery vehicle could not access the shelter due to road closures. Rescheduled.',
            ],
            // 5 — shelter 1 admin → civilian 1a, Food Parcels, accepted
            [
                'level'            => 'shelter_civilian',
                'dispatched_by'    => $admin1?->id,
                'shelter_id'       => $shelter1->id,
                'civilian_id'      => $civilian1a?->id,
                'aid_category_id'  => $catFood->id,
                'quantity'         => 1,
                'notes'            => 'Weekly food parcel',
                'status'           => 'accepted',
                'dispatched_at'    => Carbon::now()->subWeeks(2),
                'responded_at'     => Carbon::now()->subWeeks(2),
                'received_at'      => Carbon::now()->subWeeks(2)->toDateString(),
                'responded_by'     => $civilian1a?->id,
                'rejection_reason' => null,
            ],
            // 6 — shelter 1 admin → civilian 1b, Hygiene Kits, accepted
            [
                'level'            => 'shelter_civilian',
                'dispatched_by'    => $admin1?->id,
                'shelter_id'       => $shelter1->id,
                'civilian_id'      => $civilian1b?->id,
                'aid_category_id'  => $catHygiene->id,
                'quantity'         => 1,
                'notes'            => 'Monthly hygiene kit',
                'status'           => 'accepted',
                'dispatched_at'    => Carbon::now()->subWeek(),
                'responded_at'     => Carbon::now()->subWeek(),
                'received_at'      => Carbon::now()->subWeek()->toDateString(),
                'responded_by'     => $civilian1b?->id,
                'rejection_reason' => null,
            ],
            // 7 — shelter 2 admin → civilian 2a, Baby Supplies, pending
            [
                'level'            => 'shelter_civilian',
                'dispatched_by'    => $admin2?->id,
                'shelter_id'       => $shelter2->id,
                'civilian_id'      => $civilian2a?->id,
                'aid_category_id'  => $catBaby->id,
                'quantity'         => 1,
                'notes'            => 'Emergency baby supply kit',
                'status'           => 'pending',
                'dispatched_at'    => Carbon::now()->subDays(2),
                'responded_at'     => null,
                'received_at'      => null,
                'responded_by'     => null,
                'rejection_reason' => null,
            ],
            // 8 — shelter 3 admin → civilian 3a, Blankets, pending
            [
                'level'            => 'shelter_civilian',
                'dispatched_by'    => $admin3?->id,
                'shelter_id'       => $shelter3->id,
                'civilian_id'      => $civilian3a?->id,
                'aid_category_id'  => $catBlanket->id,
                'quantity'         => 2,
                'notes'            => 'Winter allocation — 2 blankets per family',
                'status'           => 'pending',
                'dispatched_at'    => Carbon::now()->subDay(),
                'responded_at'     => null,
                'received_at'      => null,
                'responded_by'     => null,
                'rejection_reason' => null,
            ],
        ];

        foreach ($dispatches as $data) {
            if (! $data['dispatched_by'] || ! $data['aid_category_id']) {
                continue;
            }

            AidDispatch::create($data);
        }
    }
}

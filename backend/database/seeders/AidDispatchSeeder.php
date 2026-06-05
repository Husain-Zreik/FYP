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
        $govAdmin = User::where('email', 'admin@nuzuh.com')->first();
        $shelterAdmin1 = User::where('email', 'shelter@nuzuh.com')->first(); // BEY-001

        $shelters = Shelter::orderBy('id')->take(4)->get();
        $shelter1 = $shelters->get(0); // BEY-001
        $shelter2 = $shelters->get(1); // BEY-002
        $shelter3 = $shelters->get(2); // MTL-001

        $admin2 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter2->id)->first();
        $admin3 = User::where('role', 'shelter_admin')->where('shelter_id', $shelter3->id)->first();

        // Primary showcase civilian at BEY-001
        $ali = User::where('email', 'civilian@nuzuh.com')->first();
        // Second civilian at BEY-001
        $civilian1b = User::where('role', 'civilian')->where('shelter_id', $shelter1->id)
            ->where('email', '!=', 'civilian@nuzuh.com')->first();

        $civilian2a = User::where('role', 'civilian')->where('shelter_id', $shelter2->id)->first();
        $civilian3a = User::where('role', 'civilian')->where('shelter_id', $shelter3->id)->first();

        $catFood    = AidCategory::where('name', 'Food Parcels')->first();
        $catMedical = AidCategory::where('name', 'Medical Kits')->first();
        $catBlanket = AidCategory::where('name', 'Blankets')->first();
        $catHygiene = AidCategory::where('name', 'Hygiene Kits')->first();
        $catBaby    = AidCategory::where('name', 'Baby Supplies')->first();

        $dispatches = [
            // 1 — gov → shelter 1, Food Parcels, accepted
            [
                'level'                => 'government_shelter',
                'dispatched_by'        => $govAdmin->id,
                'shelter_id'           => $shelter1->id,
                'civilian_id'          => null,
                'aid_category_id'      => $catFood->id,
                'quantity'             => 50,
                'notes'                => 'Monthly food allocation',
                'status'               => 'accepted',
                'dispatched_at'        => Carbon::now()->subWeeks(3),
                'expected_arrival_date'=> Carbon::now()->subWeeks(3)->addDays(3)->toDateString(),
                'responded_at'         => Carbon::now()->subWeeks(3),
                'received_at'          => Carbon::now()->subWeeks(3)->toDateString(),
                'responded_by'         => $shelterAdmin1?->id,
                'rejection_reason'     => null,
            ],
            // 2 — gov → shelter 2, Medical Kits, accepted
            [
                'level'                => 'government_shelter',
                'dispatched_by'        => $govAdmin->id,
                'shelter_id'           => $shelter2->id,
                'civilian_id'          => null,
                'aid_category_id'      => $catMedical->id,
                'quantity'             => 15,
                'notes'                => 'Emergency medical supply replenishment',
                'status'               => 'accepted',
                'dispatched_at'        => Carbon::now()->subWeeks(2),
                'expected_arrival_date'=> Carbon::now()->subWeeks(2)->addDays(2)->toDateString(),
                'responded_at'         => Carbon::now()->subWeeks(2),
                'received_at'          => Carbon::now()->subWeeks(2)->toDateString(),
                'responded_by'         => $admin2?->id,
                'rejection_reason'     => null,
            ],
            // 3 — gov → shelter 3, Blankets, pending
            [
                'level'                => 'government_shelter',
                'dispatched_by'        => $govAdmin->id,
                'shelter_id'           => $shelter3->id,
                'civilian_id'          => null,
                'aid_category_id'      => $catBlanket->id,
                'quantity'             => 100,
                'notes'                => 'Winter preparation — blanket distribution',
                'status'               => 'pending',
                'dispatched_at'        => Carbon::now()->subDays(3),
                'expected_arrival_date'=> Carbon::now()->addDays(5)->toDateString(),
                'responded_at'         => null,
                'received_at'          => null,
                'responded_by'         => null,
                'rejection_reason'     => null,
            ],
            // 4 — gov → shelter 1, Hygiene Kits, rejected
            [
                'level'                => 'government_shelter',
                'dispatched_by'        => $govAdmin->id,
                'shelter_id'           => $shelter1->id,
                'civilian_id'          => null,
                'aid_category_id'      => $catHygiene->id,
                'quantity'             => 40,
                'notes'                => null,
                'status'               => 'rejected',
                'dispatched_at'        => Carbon::now()->subWeek(),
                'expected_arrival_date'=> null,
                'responded_at'         => Carbon::now()->subWeek(),
                'received_at'          => null,
                'responded_by'         => $shelterAdmin1?->id,
                'rejection_reason'     => 'Delivery vehicle could not access the shelter due to road closures. Rescheduled.',
            ],
            // 5 — shelter 1 admin → Ali Haddad (showcase civilian), Food Parcels, accepted
            [
                'level'                => 'shelter_civilian',
                'dispatched_by'        => $shelterAdmin1?->id,
                'shelter_id'           => $shelter1->id,
                'civilian_id'          => $ali?->id,
                'aid_category_id'      => $catFood->id,
                'quantity'             => 1,
                'notes'                => 'Weekly food parcel',
                'status'               => 'accepted',
                'dispatched_at'        => Carbon::now()->subWeeks(2),
                'expected_arrival_date'=> null,
                'responded_at'         => Carbon::now()->subWeeks(2),
                'received_at'          => Carbon::now()->subWeeks(2)->toDateString(),
                'responded_by'         => $ali?->id,
                'rejection_reason'     => null,
            ],
            // 6 — shelter 1 admin → civilian 1b, Hygiene Kits, accepted
            [
                'level'                => 'shelter_civilian',
                'dispatched_by'        => $shelterAdmin1?->id,
                'shelter_id'           => $shelter1->id,
                'civilian_id'          => $civilian1b?->id,
                'aid_category_id'      => $catHygiene->id,
                'quantity'             => 1,
                'notes'                => 'Monthly hygiene kit',
                'status'               => 'accepted',
                'dispatched_at'        => Carbon::now()->subWeek(),
                'expected_arrival_date'=> null,
                'responded_at'         => Carbon::now()->subWeek(),
                'received_at'          => Carbon::now()->subWeek()->toDateString(),
                'responded_by'         => $civilian1b?->id,
                'rejection_reason'     => null,
            ],
            // 7 — shelter 2 admin → civilian 2a, Baby Supplies, pending
            [
                'level'                => 'shelter_civilian',
                'dispatched_by'        => $admin2?->id,
                'shelter_id'           => $shelter2->id,
                'civilian_id'          => $civilian2a?->id,
                'aid_category_id'      => $catBaby->id,
                'quantity'             => 1,
                'notes'                => 'Emergency baby supply kit',
                'status'               => 'pending',
                'dispatched_at'        => Carbon::now()->subDays(2),
                'expected_arrival_date'=> Carbon::now()->addDays(2)->toDateString(),
                'responded_at'         => null,
                'received_at'          => null,
                'responded_by'         => null,
                'rejection_reason'     => null,
            ],
            // 8 — shelter 1 admin → Ali Haddad, Blankets, pending (showcase — visible in mobile app)
            [
                'level'                => 'shelter_civilian',
                'dispatched_by'        => $shelterAdmin1?->id,
                'shelter_id'           => $shelter1->id,
                'civilian_id'          => $ali?->id,
                'aid_category_id'      => $catBlanket->id,
                'quantity'             => 2,
                'notes'                => 'Winter allocation — 2 blankets per family',
                'status'               => 'pending',
                'dispatched_at'        => Carbon::now()->subDay(),
                'expected_arrival_date'=> Carbon::now()->addDays(3)->toDateString(),
                'responded_at'         => null,
                'received_at'          => null,
                'responded_by'         => null,
                'rejection_reason'     => null,
            ],
            // 9 — gov → shelter 1, Food Parcels, pending (showcase shelter — visible in Incoming Aid)
            [
                'level'                => 'government_shelter',
                'dispatched_by'        => $govAdmin->id,
                'shelter_id'           => $shelter1->id,
                'civilian_id'          => null,
                'aid_category_id'      => $catFood->id,
                'quantity'             => 40,
                'notes'                => 'Supplementary food allocation for new arrivals',
                'status'               => 'pending',
                'dispatched_at'        => Carbon::now()->subDays(2),
                'expected_arrival_date'=> Carbon::now()->addDays(4)->toDateString(),
                'responded_at'         => null,
                'received_at'          => null,
                'responded_by'         => null,
                'rejection_reason'     => null,
            ],
            // 10 — shelter 1 admin → Ali Haddad, Medical Kits, rejected (showcase civilian)
            [
                'level'                => 'shelter_civilian',
                'dispatched_by'        => $shelterAdmin1?->id,
                'shelter_id'           => $shelter1->id,
                'civilian_id'          => $ali?->id,
                'aid_category_id'      => $catMedical->id,
                'quantity'             => 1,
                'notes'                => 'General first-aid kit',
                'status'               => 'rejected',
                'dispatched_at'        => Carbon::now()->subDays(5),
                'expected_arrival_date'=> null,
                'responded_at'         => Carbon::now()->subDays(4),
                'received_at'          => null,
                'responded_by'         => $ali?->id,
                'rejection_reason'     => 'Already received a first-aid kit this month from a visiting clinic.',
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

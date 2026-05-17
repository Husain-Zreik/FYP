<?php

namespace Database\Seeders;

use App\Models\AidCategory;
use App\Models\AidRequest;
use App\Models\Shelter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AidRequestSeeder extends Seeder
{
    public function run(): void
    {
        $govAdmin = User::where('role', 'government_admin')->first();
        $shelters = Shelter::orderBy('id')->take(4)->get();

        $shelter1 = $shelters->get(0);
        $shelter2 = $shelters->get(1);
        $shelter3 = $shelters->get(2);
        $shelter4 = $shelters->get(3);

        $staff1 = User::whereIn('role', ['shelter_admin', 'shelter_staff'])->where('shelter_id', $shelter1->id)->first();
        $staff2 = User::whereIn('role', ['shelter_admin', 'shelter_staff'])->where('shelter_id', $shelter2->id)->first();
        $staff3 = User::whereIn('role', ['shelter_admin', 'shelter_staff'])->where('shelter_id', $shelter3->id)->first();
        $staff4 = User::whereIn('role', ['shelter_admin', 'shelter_staff'])->where('shelter_id', $shelter4->id)->first();

        $catFood     = AidCategory::where('name', 'Food Parcels')->first();
        $catMedical  = AidCategory::where('name', 'Medical Kits')->first();
        $catBlankets = AidCategory::where('name', 'Blankets')->first();
        $catMattress = AidCategory::where('name', 'Mattresses')->first();
        $catHygiene  = AidCategory::where('name', 'Hygiene Kits')->first();
        $catCash     = AidCategory::where('name', 'Cash Aid')->first();
        $catBaby     = AidCategory::where('name', 'Baby Supplies')->first();
        $catMedicine = AidCategory::where('name', 'Medicine')->first();

        $requests = [
            // 1 — pending
            [
                'shelter_id'         => $shelter1->id,
                'aid_category_id'    => $catFood->id,
                'quantity_requested' => 50,
                'urgency'            => 'high',
                'reason'             => 'Stock is critically low, we have 45 families with no food allocation for next week.',
                'status'             => 'pending',
                'quantity_approved'  => null,
                'government_notes'   => null,
                'reviewed_by'        => null,
                'reviewed_at'        => null,
                'created_by'         => $staff1->id,
                'created_at'         => Carbon::now()->subDays(5),
            ],
            // 2 — pending
            [
                'shelter_id'         => $shelter2->id,
                'aid_category_id'    => $catMedical->id,
                'quantity_requested' => 20,
                'urgency'            => 'critical',
                'reason'             => 'Two staff members are ill and our medical supplies are exhausted. We need immediate replenishment.',
                'status'             => 'pending',
                'quantity_approved'  => null,
                'government_notes'   => null,
                'reviewed_by'        => null,
                'reviewed_at'        => null,
                'created_by'         => $staff2->id,
                'created_at'         => Carbon::now()->subDays(3),
            ],
            // 3 — pending
            [
                'shelter_id'         => $shelter3->id,
                'aid_category_id'    => $catBlankets->id,
                'quantity_requested' => 80,
                'urgency'            => 'medium',
                'reason'             => 'Temperature dropping, current blanket supply insufficient for all occupants.',
                'status'             => 'pending',
                'quantity_approved'  => null,
                'government_notes'   => null,
                'reviewed_by'        => null,
                'reviewed_at'        => null,
                'created_by'         => $staff3->id,
                'created_at'         => Carbon::now()->subWeek(),
            ],
            // 4 — approved
            [
                'shelter_id'         => $shelter1->id,
                'aid_category_id'    => $catMattress->id,
                'quantity_requested' => 15,
                'urgency'            => 'low',
                'reason'             => 'New occupants arriving next month, need additional sleeping arrangements.',
                'status'             => 'approved',
                'quantity_approved'  => 15,
                'government_notes'   => 'Approved. Mattresses will be dispatched from current inventory within 3 days.',
                'reviewed_by'        => $govAdmin->id,
                'reviewed_at'        => Carbon::now()->subDays(2),
                'created_by'         => $staff1->id,
                'created_at'         => Carbon::now()->subDays(10),
            ],
            // 5 — partially_approved
            [
                'shelter_id'         => $shelter2->id,
                'aid_category_id'    => $catHygiene->id,
                'quantity_requested' => 60,
                'urgency'            => 'high',
                'reason'             => 'Monthly hygiene kit distribution is due, current stock depleted.',
                'status'             => 'partially_approved',
                'quantity_approved'  => 45,
                'government_notes'   => 'Partially approved. 45 kits dispatched immediately, remainder to follow next shipment.',
                'reviewed_by'        => $govAdmin->id,
                'reviewed_at'        => Carbon::now()->subDays(4),
                'created_by'         => $staff2->id,
                'created_at'         => Carbon::now()->subDays(12),
            ],
            // 6 — rejected
            [
                'shelter_id'         => $shelter4->id,
                'aid_category_id'    => $catCash->id,
                'quantity_requested' => 2000,
                'urgency'            => 'medium',
                'reason'             => 'Need funds to cover emergency maintenance repairs and food procurement.',
                'status'             => 'rejected',
                'quantity_approved'  => null,
                'government_notes'   => 'Cash aid requests must go through the Ministry of Finance portal. Please resubmit through official channels.',
                'reviewed_by'        => $govAdmin->id,
                'reviewed_at'        => Carbon::now()->subDays(6),
                'created_by'         => $staff4->id,
                'created_at'         => Carbon::now()->subWeeks(2),
            ],
            // 7 — fulfilled
            [
                'shelter_id'         => $shelter3->id,
                'aid_category_id'    => $catFood->id,
                'quantity_requested' => 30,
                'urgency'            => 'medium',
                'reason'             => 'Weekly food parcel distribution for elderly occupants.',
                'status'             => 'fulfilled',
                'quantity_approved'  => 30,
                'government_notes'   => 'Dispatched and confirmed received.',
                'reviewed_by'        => $govAdmin->id,
                'reviewed_at'        => Carbon::now()->subWeeks(2),
                'created_by'         => $staff3->id,
                'created_at'         => Carbon::now()->subWeeks(3),
            ],
            // 8 — pending
            [
                'shelter_id'         => $shelter1->id,
                'aid_category_id'    => $catBaby->id,
                'quantity_requested' => 10,
                'urgency'            => 'high',
                'reason'             => 'We currently host 8 families with infants and have run out of diapers and formula.',
                'status'             => 'pending',
                'quantity_approved'  => null,
                'government_notes'   => null,
                'reviewed_by'        => null,
                'reviewed_at'        => null,
                'created_by'         => $staff1->id,
                'created_at'         => Carbon::now()->subDays(2),
            ],
            // 9 — pending
            [
                'shelter_id'         => $shelter4->id,
                'aid_category_id'    => $catMedicine->id,
                'quantity_requested' => 25,
                'urgency'            => 'critical',
                'reason'             => 'Three diabetic patients have run out of insulin. This is an emergency medical situation.',
                'status'             => 'pending',
                'quantity_approved'  => null,
                'government_notes'   => null,
                'reviewed_by'        => null,
                'reviewed_at'        => null,
                'created_by'         => $staff4->id,
                'created_at'         => Carbon::now()->subDay(),
            ],
        ];

        foreach ($requests as $data) {
            $createdAt = $data['created_at'];
            unset($data['created_by'], $data['created_at']);

            $request = AidRequest::create($data);
            $request->created_at = $createdAt;
            $request->save();
        }
    }
}

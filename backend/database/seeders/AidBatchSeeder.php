<?php

namespace Database\Seeders;

use App\Models\AidBatch;
use App\Models\AidCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AidBatchSeeder extends Seeder
{
    public function run(): void
    {
        $govAdmin = User::where('role', 'government_admin')->first();

        $batches = [
            [
                'source'     => 'UNHCR',
                'category'   => 'Food Parcels',
                'quantity'   => 600,
                'available'  => 145,
                'received'   => Carbon::now()->subMonths(3)->toDateString(),
                'notes'      => null,
            ],
            [
                'source'     => 'Red Cross / ICRC',
                'category'   => 'Medical Kits',
                'quantity'   => 200,
                'available'  => 88,
                'received'   => Carbon::now()->subWeeks(10)->toDateString(),
                'notes'      => null,
            ],
            [
                'source'     => 'EU Humanitarian Aid',
                'category'   => 'Blankets',
                'quantity'   => 1200,
                'available'  => 520,
                'received'   => Carbon::now()->subMonths(2)->toDateString(),
                'notes'      => null,
            ],
            [
                'source'     => 'Government Budget',
                'category'   => 'Mattresses',
                'quantity'   => 350,
                'available'  => 170,
                'received'   => Carbon::now()->subWeeks(6)->toDateString(),
                'notes'      => null,
            ],
            [
                'source'     => 'UNHCR',
                'category'   => 'Hygiene Kits',
                'quantity'   => 800,
                'available'  => 310,
                'received'   => Carbon::now()->subWeeks(5)->toDateString(),
                'notes'      => null,
            ],
            [
                'source'     => 'Gulf States Aid',
                'category'   => 'Cash Aid',
                'quantity'   => 50000,
                'available'  => 28000,
                'received'   => Carbon::now()->subWeeks(4)->toDateString(),
                'notes'      => 'unit is USD',
            ],
            [
                'source'     => 'Lebanese Red Cross',
                'category'   => 'Baby Supplies',
                'quantity'   => 120,
                'available'  => 65,
                'received'   => Carbon::now()->subWeeks(3)->toDateString(),
                'notes'      => null,
            ],
            [
                'source'     => 'Local NGOs Coalition',
                'category'   => 'Clothing Bundles',
                'quantity'   => 450,
                'available'  => 210,
                'received'   => Carbon::now()->subWeeks(2)->toDateString(),
                'notes'      => null,
            ],
        ];

        foreach ($batches as $data) {
            $cat = AidCategory::where('name', $data['category'])->first();

            if (! $cat) {
                continue;
            }

            AidBatch::updateOrCreate(
                [
                    'source'          => $data['source'],
                    'aid_category_id' => $cat->id,
                ],
                [
                    'quantity'           => $data['quantity'],
                    'available_quantity' => $data['available'],
                    'received_at'        => $data['received'],
                    'notes'              => $data['notes'],
                    'created_by'         => $govAdmin->id,
                ]
            );
        }
    }
}

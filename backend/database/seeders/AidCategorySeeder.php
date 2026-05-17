<?php

namespace Database\Seeders;

use App\Models\AidCategory;
use Illuminate\Database\Seeder;

class AidCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Food Parcels',     'unit' => 'parcels',  'description' => 'Complete food packages for families'],
            ['name' => 'Drinking Water',   'unit' => 'liters',   'description' => 'Bottled or purified water supply'],
            ['name' => 'Medical Kits',     'unit' => 'kits',     'description' => 'First aid and basic medical supplies'],
            ['name' => 'Medicine',         'unit' => 'boxes',    'description' => 'Prescription and over-the-counter medicine'],
            ['name' => 'Mattresses',       'unit' => 'pieces',   'description' => 'Sleeping mattresses for shelter occupants'],
            ['name' => 'Blankets',         'unit' => 'pieces',   'description' => 'Warm blankets and bedding items'],
            ['name' => 'Clothing Bundles', 'unit' => 'bundles',  'description' => 'Mixed clothing for various ages'],
            ['name' => 'Hygiene Kits',     'unit' => 'kits',     'description' => 'Soap, toothpaste, sanitizer and hygiene items'],
            ['name' => 'Baby Supplies',    'unit' => 'kits',     'description' => 'Diapers, formula, and infant care items'],
            ['name' => 'Cash Aid',         'unit' => 'USD',      'description' => 'Emergency monetary assistance'],
            ['name' => 'Generator Fuel',   'unit' => 'liters',   'description' => 'Diesel or gasoline for backup generators'],
            ['name' => 'Other Supplies',   'unit' => 'units',    'description' => 'Miscellaneous supplies not listed above'],
        ];

        foreach ($categories as $category) {
            AidCategory::updateOrCreate(
                ['name' => $category['name']],
                ['unit' => $category['unit'], 'description' => $category['description'], 'is_active' => true]
            );
        }
    }
}

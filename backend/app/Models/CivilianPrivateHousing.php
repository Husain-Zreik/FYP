<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CivilianPrivateHousing extends Model
{
    protected $fillable = [
        'civilian_id', 'property_type', 'address', 'governorate', 'district',
        'landlord_name', 'landlord_phone', 'monthly_rent', 'lease_start_date', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'monthly_rent'     => 'float',
            'lease_start_date' => 'date',
        ];
    }

    public function civilian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'civilian_id');
    }
}

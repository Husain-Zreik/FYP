<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shelter extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'code', 'governorate', 'district', 'address',
        'latitude', 'longitude', 'capacity', 'rooms',
        'status', 'phone', 'email', 'notes', 'image_path',
    ];

    protected function casts(): array
    {
        return [
            'latitude'  => 'float',
            'longitude' => 'float',
            'capacity'  => 'integer',
            'rooms'     => 'integer',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(User::class)
            ->whereIn('role', ['shelter_admin', 'shelter_staff']);
    }

    public function civilians(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'civilian');
    }
}

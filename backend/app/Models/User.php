<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'shelter_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────

    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class);
    }

    public function civilianProfile(): HasOne
    {
        return $this->hasOne(CivilianProfile::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────

    public function scopeForShelter(Builder $query, int $shelterId): Builder
    {
        return $query->where('shelter_id', $shelterId);
    }

    // ─── Helpers ──────────────────────────────────────────────────────

    public function isShelterScoped(): bool
    {
        return $this->hasAnyRole(['shelter_admin', 'shelter_staff']);
    }
}

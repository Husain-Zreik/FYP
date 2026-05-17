<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'shelter_id',
        'role',
        'is_active',
    ];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    // ─── Access point derived from role ───────────────────────────────────

    public function getAccessPointAttribute(): string
    {
        return match(true) {
            in_array($this->role, ['government_admin', 'government_staff']) => 'government',
            in_array($this->role, ['shelter_admin',   'shelter_staff'])     => 'shelter',
            default                                                          => 'civilian',
        };
    }

    // ─── Role helpers ──────────────────────────────────────────────────────

    public function isGovernmentAdmin(): bool { return $this->role === 'government_admin'; }
    public function isShelterScoped(): bool   { return in_array($this->role, ['shelter_admin', 'shelter_staff']); }
    public function isShelterAdmin(): bool    { return $this->role === 'shelter_admin'; }

    // ─── Scopes ────────────────────────────────────────────────────────────

    public function scopeForShelter(Builder $query, int $shelterId): Builder
    {
        return $query->where('shelter_id', $shelterId);
    }

    // ─── Relationships ──────────────────────────────────────────────────────

    public function shelter(): BelongsTo { return $this->belongsTo(Shelter::class); }
    public function civilianProfile(): HasOne { return $this->hasOne(CivilianProfile::class); }
}

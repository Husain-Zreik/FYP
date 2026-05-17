<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class RoleCapability extends Model
{
    protected $fillable = ['role', 'capability', 'enabled'];

    protected function casts(): array
    {
        return ['enabled' => 'boolean'];
    }

    /**
     * Returns the set of enabled capability keys for a given role.
     * Cached for 60 seconds — cache is cleared when capabilities are updated.
     */
    public static function enabledFor(string $role): array
    {
        return Cache::remember("capabilities.{$role}", 60, function () use ($role) {
            return static::where('role', $role)
                ->where('enabled', true)
                ->pluck('capability')
                ->toArray();
        });
    }

    public static function clearCache(string $role): void
    {
        Cache::forget("capabilities.{$role}");
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AidCategory extends Model
{
    protected $fillable = ['name', 'unit', 'description', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function batches(): HasMany
    {
        return $this->hasMany(AidBatch::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(AidRequest::class);
    }
}

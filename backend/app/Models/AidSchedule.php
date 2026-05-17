<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AidSchedule extends Model
{
    protected $fillable = [
        'level',
        'created_by',
        'shelter_id',
        'civilian_id',
        'aid_category_id',
        'quantity',
        'frequency',
        'notes',
        'starts_at',
        'ends_at',
        'is_active',
        'last_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at'    => 'date',
            'ends_at'      => 'date',
            'last_sent_at' => 'date',
            'is_active'    => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class);
    }

    public function civilian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'civilian_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AidCategory::class, 'aid_category_id');
    }

    public function dispatches(): HasMany
    {
        return $this->hasMany(AidDispatch::class);
    }
}

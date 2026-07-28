<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AidRequest extends Model
{
    protected $fillable = [
        'shelter_id',
        'aid_category_id',
        'quantity_requested',
        'urgency',
        'reason',
        'status',
        'quantity_approved',
        'government_notes',
        'reviewed_by',
        'reviewed_at',
        'received_at',
        'shelter_received_notes',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'received_at' => 'date',
        ];
    }

    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AidCategory::class, 'aid_category_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function dispatches(): HasMany
    {
        return $this->hasMany(AidDispatch::class);
    }
}

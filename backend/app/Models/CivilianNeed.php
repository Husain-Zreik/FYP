<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CivilianNeed extends Model
{
    protected $fillable = [
        'civilian_id',
        'shelter_id',
        'category',
        'description',
        'urgency',
        'status',
        'shelter_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function civilian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'civilian_id');
    }

    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}

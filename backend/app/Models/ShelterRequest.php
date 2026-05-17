<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShelterRequest extends Model
{
    protected $fillable = [
        'civilian_id',
        'shelter_id',
        'type',
        'status',
        'initiated_by',
        'responded_at',
    ];

    protected function casts(): array
    {
        return ['responded_at' => 'datetime'];
    }

    public function civilian(): BelongsTo    { return $this->belongsTo(User::class, 'civilian_id'); }
    public function shelter(): BelongsTo     { return $this->belongsTo(Shelter::class); }
    public function initiatedBy(): BelongsTo { return $this->belongsTo(User::class, 'initiated_by'); }
}

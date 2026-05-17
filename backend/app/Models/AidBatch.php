<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AidBatch extends Model
{
    protected $fillable = [
        'aid_category_id',
        'source',
        'quantity',
        'available_quantity',
        'notes',
        'received_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'received_at' => 'date',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AidCategory::class, 'aid_category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

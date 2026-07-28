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

    /**
     * Deducts up to $quantity from this category's batches, oldest first, locking
     * the rows for the duration of the caller's transaction so concurrent dispatches
     * can't both pass the stock check against the same unlocked read.
     *
     * Returns true on success, or the actual available quantity (< $quantity) on failure.
     */
    public static function deductFifo(int $aidCategoryId, int $quantity): int|true
    {
        $batches = static::where('aid_category_id', $aidCategoryId)
            ->where('available_quantity', '>', 0)
            ->orderBy('received_at')
            ->lockForUpdate()
            ->get();

        $availableQty = $batches->sum('available_quantity');

        if ($quantity > $availableQty) {
            return $availableQty;
        }

        $remaining = $quantity;

        foreach ($batches as $batch) {
            if ($remaining <= 0) break;
            $deduct = min($remaining, $batch->available_quantity);
            $batch->decrement('available_quantity', $deduct);
            $remaining -= $deduct;
        }

        return true;
    }

    /**
     * Refunds up to $quantity back into this category's batches, oldest first,
     * capped at each batch's original quantity. Locks rows for the same reason
     * as deductFifo() — must be called inside a transaction.
     */
    public static function refundFifo(int $aidCategoryId, int $quantity): void
    {
        $remaining = $quantity;
        $batches = static::where('aid_category_id', $aidCategoryId)
            ->orderBy('received_at')
            ->lockForUpdate()
            ->get();

        foreach ($batches as $batch) {
            if ($remaining <= 0) break;
            $canAdd = $batch->quantity - $batch->available_quantity;
            if ($canAdd > 0) {
                $add = min($remaining, $canAdd);
                $batch->increment('available_quantity', $add);
                $remaining -= $add;
            }
        }
    }
}

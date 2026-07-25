<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AidDispatch extends Model
{
    protected $fillable = [
        'level',
        'dispatched_by',
        'shelter_id',
        'civilian_id',
        'aid_category_id',
        'aid_request_id',
        'civilian_need_id',
        'aid_schedule_id',
        'quantity',
        'notes',
        'status',
        'dispatched_at',
        'expected_arrival_date',
        'responded_at',
        'received_at',
        'responded_by',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'dispatched_at'         => 'datetime',
            'expected_arrival_date' => 'date',
            'responded_at'          => 'datetime',
            'received_at'           => 'date',
        ];
    }

    public function dispatcher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dispatched_by');
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

    public function aidRequest(): BelongsTo
    {
        return $this->belongsTo(AidRequest::class);
    }

    public function civilianNeed(): BelongsTo
    {
        return $this->belongsTo(CivilianNeed::class);
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(AidSchedule::class, 'aid_schedule_id');
    }

    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responded_by');
    }

    /**
     * A shelter's stock is derived, not stored: accepted government deliveries
     * minus everything already sent to civilians (rejected sends don't count,
     * mirroring how AidBatch refunds on reject at the government level).
     */
    public static function availableForShelter(int $shelterId, int $aidCategoryId): int
    {
        $received = static::where('shelter_id', $shelterId)
            ->where('aid_category_id', $aidCategoryId)
            ->where('level', 'government_shelter')
            ->where('status', 'accepted')
            ->sum('quantity');

        $sent = static::where('shelter_id', $shelterId)
            ->where('aid_category_id', $aidCategoryId)
            ->where('level', 'shelter_civilian')
            ->where('status', '!=', 'rejected')
            ->sum('quantity');

        return max(0, $received - $sent);
    }
}

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
        'responded_at',
        'received_at',
        'responded_by',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'dispatched_at' => 'datetime',
            'responded_at'  => 'datetime',
            'received_at'   => 'date',
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
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AidRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'shelter_id'         => $this->shelter_id,
            'shelter'            => $this->whenLoaded('shelter', fn () => [
                'id'          => $this->shelter->id,
                'name'        => $this->shelter->name,
                'governorate' => $this->shelter->governorate,
            ]),
            'aid_category_id'    => $this->aid_category_id,
            'category'           => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
                'unit' => $this->category->unit,
            ]),
            'quantity_requested' => $this->quantity_requested,
            'urgency'            => $this->urgency,
            'reason'             => $this->reason,
            'status'             => $this->status,
            'quantity_approved'  => $this->quantity_approved,
            'government_notes'   => $this->government_notes,
            'reviewed_by_name'   => $this->whenLoaded('reviewer', fn () => $this->reviewer->name),
            'reviewed_at'        => $this->reviewed_at?->format('Y-m-d H:i:s'),
            'received_at'            => $this->received_at?->format('Y-m-d'),
            'shelter_received_notes' => $this->shelter_received_notes,
            'created_at'         => $this->created_at,
            // Whether a government_shelter dispatch exists that's ready for the
            // shelter to confirm — drives the "Confirm Receipt" button on the frontend.
            'can_confirm_receipt' => $this->relationLoaded('dispatches')
                ? in_array($this->status, ['approved', 'partially_approved'])
                    && $this->dispatches->contains(fn ($d) => $d->level === 'government_shelter' && $d->status === 'pending')
                : null,
            // Sum of non-rejected government_shelter dispatch quantities already sent
            // against this request — lets the government see how much is left to send.
            'quantity_dispatched' => $this->relationLoaded('dispatches')
                ? $this->dispatches
                    ->where('level', 'government_shelter')
                    ->where('status', '!=', 'rejected')
                    ->sum('quantity')
                : null,
        ];
    }
}

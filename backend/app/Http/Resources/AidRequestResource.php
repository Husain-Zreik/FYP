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
            'created_at'         => $this->created_at,
        ];
    }
}

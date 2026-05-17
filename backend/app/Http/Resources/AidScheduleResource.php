<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AidScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'level'        => $this->level,
            'shelter'      => $this->whenLoaded('shelter', fn () => [
                'id'          => $this->shelter->id,
                'name'        => $this->shelter->name,
                'governorate' => $this->shelter->governorate,
            ]),
            'civilian'     => $this->whenLoaded('civilian', fn () => $this->civilian ? [
                'id'    => $this->civilian->id,
                'name'  => $this->civilian->name,
                'phone' => $this->civilian->phone,
                'email' => $this->civilian->email,
            ] : null),
            'category'     => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
                'unit' => $this->category->unit,
            ]),
            'quantity'     => $this->quantity,
            'frequency'    => $this->frequency,
            'notes'        => $this->notes,
            'starts_at'    => $this->starts_at?->format('Y-m-d'),
            'ends_at'      => $this->ends_at?->format('Y-m-d'),
            'is_active'    => $this->is_active,
            'last_sent_at' => $this->last_sent_at?->format('Y-m-d'),
            'created_at'   => $this->created_at,
            'creator_name' => $this->whenLoaded('creator', fn () => $this->creator->name),
        ];
    }
}

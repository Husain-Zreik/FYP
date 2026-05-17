<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CivilianNeedResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'civilian_id'      => $this->civilian_id,
            'civilian'         => $this->whenLoaded('civilian', fn () => [
                'id'    => $this->civilian->id,
                'name'  => $this->civilian->name,
                'email' => $this->civilian->email,
                'phone' => $this->civilian->phone,
            ]),
            'shelter_id'       => $this->shelter_id,
            'category'         => $this->category,
            'description'      => $this->description,
            'urgency'          => $this->urgency,
            'status'           => $this->status,
            'shelter_notes'    => $this->shelter_notes,
            'reviewed_by_name' => $this->whenLoaded('reviewer', fn () => $this->reviewer->name),
            'reviewed_at'      => $this->reviewed_at?->format('Y-m-d H:i:s'),
            'created_at'       => $this->created_at,
        ];
    }
}

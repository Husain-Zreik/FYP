<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShelterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'code'            => $this->code,
            'governorate'     => $this->governorate,
            'district'        => $this->district,
            'address'         => $this->address,
            'latitude'        => $this->latitude,
            'longitude'       => $this->longitude,
            'capacity'        => $this->capacity,
            'rooms'           => $this->rooms,
            'status'          => $this->status,
            'phone'           => $this->phone,
            'email'           => $this->email,
            'notes'           => $this->notes,
            'civilians_count' => $this->whenCounted('civilians_count'),
            'staff_count'     => $this->whenCounted('staff_count'),
            'staff'           => UserResource::collection($this->whenLoaded('staff')),
            'civilians'       => UserResource::collection($this->whenLoaded('civilians')),
            'created_at'      => $this->created_at,
        ];
    }
}

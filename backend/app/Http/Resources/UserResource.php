<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'email'            => $this->email,
            'phone'            => $this->phone,
            'shelter_id'       => $this->shelter_id,
            'role'             => $this->role,
            'access_point'     => $this->access_point,
            'is_active'        => $this->is_active,
            'shelter'          => $this->whenLoaded('shelter'),
            'civilian_profile' => $this->whenLoaded('civilianProfile'),
        ];
    }
}

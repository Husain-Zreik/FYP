<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'capabilities'     => in_array($this->role, ['government_staff', 'shelter_staff'])
                                   ? \App\Models\RoleCapability::enabledFor($this->role)
                                   : null,
            'shelter'          => $this->whenLoaded('shelter'),
            'civilian_profile' => $this->whenLoaded('civilianProfile', function () {
                $p = $this->civilianProfile;
                return [
                    'date_of_birth'    => $p->date_of_birth,
                    'gender'           => $p->gender,
                    'current_location' => $p->current_location,
                    'notes'            => $p->notes,
                    'id_type'          => $p->id_type,
                    'id_number'        => $p->id_number,
                    'id_document_url'  => $p->id_document_path ? Storage::disk('public')->url($p->id_document_path) : null,
                    'housing_status'   => $p->housing_status ?? 'seeking',
                ];
            }),
            'private_housing'  => $this->whenLoaded('privateHousing'),
        ];
    }
}

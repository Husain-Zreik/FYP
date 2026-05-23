<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilyMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'relationship'  => $this->relationship,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'gender'        => $this->gender,
            'id_type'       => $this->id_type,
            'id_number'     => $this->id_number,
            'notes'         => $this->notes,
        ];
    }
}

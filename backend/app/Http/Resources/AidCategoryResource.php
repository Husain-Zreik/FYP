<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AidCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'unit'            => $this->unit,
            'description'     => $this->description,
            'is_active'       => $this->is_active,
            'total_available' => $this->when(
                $this->relationLoaded('batches'),
                fn () => $this->batches->sum('available_quantity')
            ),
            'total_received'  => $this->when(
                $this->relationLoaded('batches'),
                fn () => $this->batches->sum('quantity')
            ),
        ];
    }
}

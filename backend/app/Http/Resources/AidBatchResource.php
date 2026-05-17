<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AidBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'aid_category_id'    => $this->aid_category_id,
            'category'           => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
                'unit' => $this->category->unit,
            ]),
            'source'             => $this->source,
            'quantity'           => $this->quantity,
            'available_quantity' => $this->available_quantity,
            'notes'              => $this->notes,
            'received_at'        => $this->received_at?->format('Y-m-d'),
            'created_at'         => $this->created_at,
            'creator_name'       => $this->whenLoaded('creator', fn () => $this->creator->name),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AidDispatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'level'            => $this->level,
            'shelter'          => $this->whenLoaded('shelter', fn () => [
                'id'          => $this->shelter->id,
                'name'        => $this->shelter->name,
                'governorate' => $this->shelter->governorate,
            ]),
            'civilian'         => $this->whenLoaded('civilian', fn () => $this->civilian ? [
                'id'    => $this->civilian->id,
                'name'  => $this->civilian->name,
                'phone' => $this->civilian->phone,
                'email' => $this->civilian->email,
            ] : null),
            'category'         => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
                'unit' => $this->category->unit,
            ]),
            'quantity'         => $this->quantity,
            'notes'            => $this->notes,
            'status'           => $this->status,
            'dispatched_at'    => $this->dispatched_at?->format('Y-m-d H:i:s'),
            'responded_at'     => $this->responded_at?->format('Y-m-d H:i:s'),
            'received_at'      => $this->received_at?->format('Y-m-d'),
            'rejection_reason' => $this->rejection_reason,
            'aid_request_id'   => $this->aid_request_id,
            'civilian_need_id' => $this->civilian_need_id,
            'aid_schedule_id'  => $this->aid_schedule_id,
            'dispatcher_name'  => $this->whenLoaded('dispatcher', fn () => $this->dispatcher->name),
            'responder_name'   => $this->whenLoaded('responder', fn () => $this->responder?->name),
            'created_at'       => $this->created_at,
        ];
    }
}

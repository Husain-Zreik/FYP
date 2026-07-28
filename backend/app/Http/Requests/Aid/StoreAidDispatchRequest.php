<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAidDispatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isShelter = $this->user()?->isShelterScoped();
        $shelterId = $isShelter ? $this->user()->shelter_id : $this->integer('shelter_id');

        return [
            // Government must supply the target shelter; shelter users derive it from auth
            'shelter_id'       => $isShelter ? 'nullable|exists:shelters,id' : 'required|exists:shelters,id',
            // Shelter users must supply the target civilian; government users don't
            'civilian_id'      => $isShelter ? 'required|exists:users,id' : 'nullable|exists:users,id',
            'aid_category_id'  => 'required|exists:aid_categories,id',
            'quantity'         => 'required|integer|min:1',
            'notes'                 => 'nullable|string|max:500',
            'expected_arrival_date' => 'nullable|date|after_or_equal:today',
            // Must belong to the target shelter and still be awaiting dispatch
            'aid_request_id'        => [
                'nullable',
                Rule::exists('aid_requests', 'id')
                    ->where('shelter_id', $shelterId)
                    ->whereIn('status', ['approved', 'partially_approved']),
            ],
            // Must belong to the target shelter (and civilian, when one is given)
            'civilian_need_id'      => [
                'nullable',
                Rule::exists('civilian_needs', 'id')
                    ->where('shelter_id', $shelterId)
                    ->when($this->filled('civilian_id'), fn ($query) => $query->where('civilian_id', $this->integer('civilian_id'))),
            ],
        ];
    }
}

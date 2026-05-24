<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;

class StoreAidDispatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isShelter = $this->user()?->isShelterScoped();

        return [
            // Government must supply the target shelter; shelter users derive it from auth
            'shelter_id'       => $isShelter ? 'nullable|exists:shelters,id' : 'required|exists:shelters,id',
            // Shelter users must supply the target civilian; government users don't
            'civilian_id'      => $isShelter ? 'required|exists:users,id' : 'nullable|exists:users,id',
            'aid_category_id'  => 'required|exists:aid_categories,id',
            'quantity'         => 'required|integer|min:1',
            'notes'                 => 'nullable|string|max:500',
            'expected_arrival_date' => 'nullable|date|after_or_equal:today',
            'aid_request_id'        => 'nullable|exists:aid_requests,id',
            'civilian_need_id'      => 'nullable|exists:civilian_needs,id',
        ];
    }
}

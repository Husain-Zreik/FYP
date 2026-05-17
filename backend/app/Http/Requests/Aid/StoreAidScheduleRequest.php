<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;

class StoreAidScheduleRequest extends FormRequest
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
            'shelter_id'      => $isShelter ? 'nullable|exists:shelters,id' : 'required|exists:shelters,id',
            // Shelter users must supply the target civilian; government users don't
            'civilian_id'     => $isShelter ? 'required|exists:users,id' : 'nullable|exists:users,id',
            'aid_category_id' => 'required|exists:aid_categories,id',
            'quantity'        => 'required|integer|min:1',
            'frequency'       => 'required|in:weekly,biweekly,monthly,quarterly',
            'notes'           => 'nullable|string|max:500',
            'starts_at'       => 'required|date',
            'ends_at'         => 'nullable|date|after:starts_at',
        ];
    }
}

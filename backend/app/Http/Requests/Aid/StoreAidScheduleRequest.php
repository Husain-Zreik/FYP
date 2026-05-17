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
        return [
            'shelter_id'      => 'required|exists:shelters,id',
            'civilian_id'     => 'required_if:level,shelter_civilian|nullable|exists:users,id',
            'aid_category_id' => 'required|exists:aid_categories,id',
            'quantity'        => 'required|integer|min:1',
            'frequency'       => 'required|in:weekly,biweekly,monthly,quarterly',
            'notes'           => 'nullable|string|max:500',
            'starts_at'       => 'required|date',
            'ends_at'         => 'nullable|date|after:starts_at',
        ];
    }
}

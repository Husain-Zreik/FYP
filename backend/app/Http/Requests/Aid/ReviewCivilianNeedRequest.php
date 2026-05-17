<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;

class ReviewCivilianNeedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'        => ['required', 'in:in_review,fulfilled,rejected'],
            'shelter_notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}

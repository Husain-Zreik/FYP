<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;

class ReviewAidRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'            => ['required', 'in:approved,partially_approved,rejected'],
            'quantity_approved' => [
                'required_if:status,approved',
                'required_if:status,partially_approved',
                'nullable',
                'integer',
                'min:1',
            ],
            'government_notes'  => ['nullable', 'string', 'max:500'],
        ];
    }
}

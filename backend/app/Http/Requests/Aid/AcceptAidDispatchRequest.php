<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;

class AcceptAidDispatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'received_at' => 'required|date|before_or_equal:today',
            'notes'       => 'nullable|string|max:300',
        ];
    }
}

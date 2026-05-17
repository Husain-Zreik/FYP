<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;

class StoreAidBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'aid_category_id' => ['required', 'integer', 'exists:aid_categories,id'],
            'source'          => ['required', 'string', 'max:100'],
            'quantity'        => ['required', 'integer', 'min:1'],
            'notes'           => ['nullable', 'string'],
            'received_at'     => ['required', 'date'],
        ];
    }
}

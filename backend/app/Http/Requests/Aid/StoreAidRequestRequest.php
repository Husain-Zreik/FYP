<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;

class StoreAidRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'aid_category_id'    => ['required', 'integer', 'exists:aid_categories,id'],
            'quantity_requested' => ['required', 'integer', 'min:1'],
            'urgency'            => ['required', 'in:low,medium,high,critical'],
            'reason'             => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }
}

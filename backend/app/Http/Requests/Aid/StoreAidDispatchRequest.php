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
        return [
            'shelter_id'       => 'required|exists:shelters,id',
            'civilian_id'      => 'required_if:level,shelter_civilian|nullable|exists:users,id',
            'aid_category_id'  => 'required|exists:aid_categories,id',
            'quantity'         => 'required|integer|min:1',
            'notes'            => 'nullable|string|max:500',
            'aid_request_id'   => 'nullable|exists:aid_requests,id',
            'civilian_need_id' => 'nullable|exists:civilian_needs,id',
        ];
    }
}

<?php

namespace App\Http\Requests\Shelter;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateShelterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['sometimes', 'string', 'max:255'],
            'code'        => ['nullable', 'string', 'max:20', Rule::unique('shelters', 'code')->ignore($this->route('shelter'))],
            'governorate' => ['sometimes', 'string', 'max:100'],
            'district'    => ['nullable', 'string', 'max:100'],
            'address'     => ['sometimes', 'string', 'max:500'],
            'latitude'    => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'   => ['nullable', 'numeric', 'between:-180,180'],
            'capacity'    => ['sometimes', 'integer', 'min:1'],
            'rooms'       => ['nullable', 'integer', 'min:0'],
            'status'      => ['sometimes', 'in:active,inactive,full,under_maintenance'],
            'phone'       => ['nullable', 'string', 'max:20'],
            'email'       => ['nullable', 'email'],
            'notes'       => ['nullable', 'string'],
        ];
    }
}

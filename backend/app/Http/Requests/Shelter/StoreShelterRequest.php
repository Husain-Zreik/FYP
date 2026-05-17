<?php

namespace App\Http\Requests\Shelter;

use Illuminate\Foundation\Http\FormRequest;

class StoreShelterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'code'        => ['nullable', 'string', 'max:20', 'unique:shelters,code'],
            'governorate' => ['required', 'string', 'max:100'],
            'district'    => ['nullable', 'string', 'max:100'],
            'address'     => ['required', 'string', 'max:500'],
            'latitude'    => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'   => ['nullable', 'numeric', 'between:-180,180'],
            'capacity'    => ['required', 'integer', 'min:1'],
            'rooms'       => ['nullable', 'integer', 'min:0'],
            'status'      => ['in:active,inactive,full,under_maintenance'],
            'phone'       => ['nullable', 'string', 'max:20'],
            'email'       => ['nullable', 'email'],
            'notes'       => ['nullable', 'string'],
        ];
    }
}

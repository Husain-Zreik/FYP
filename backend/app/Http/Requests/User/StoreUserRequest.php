<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $auth            = $this->user();
        $allowedRoles    = $auth->isShelterScoped()
            ? ['shelter_admin', 'shelter_staff', 'civilian']
            : ['government_admin', 'government_staff', 'shelter_admin', 'shelter_staff', 'civilian'];

        return [
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'unique:users,email'],
            'password'   => ['required', Password::min(8)],
            'phone'      => ['nullable', 'string', 'max:20'],
            'role'       => ['required', 'in:' . implode(',', $allowedRoles)],
            'shelter_id' => ['nullable', 'exists:shelters,id'],
            'is_active'  => ['boolean'],
        ];
    }
}

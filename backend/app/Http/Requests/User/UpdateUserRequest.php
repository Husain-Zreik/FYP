<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $auth         = $this->user();
        $allowedRoles = $auth->isShelterScoped()
            ? ['shelter_admin', 'shelter_staff', 'civilian']
            : ['government_admin', 'government_staff', 'shelter_admin', 'shelter_staff', 'civilian'];

        return [
            'name'       => ['sometimes', 'string', 'max:255'],
            'email'      => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password'   => ['nullable', Password::min(8)],
            'phone'      => ['nullable', 'string', 'max:20'],
            'role'       => ['sometimes', 'in:' . implode(',', $allowedRoles)],
            'shelter_id' => ['nullable', 'exists:shelters,id'],
            'is_active'  => ['boolean'],
        ];
    }
}

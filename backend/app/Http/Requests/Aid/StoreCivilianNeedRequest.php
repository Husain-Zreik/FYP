<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;

class StoreCivilianNeedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category'    => ['required', 'in:food,medical,clothing,bedding,hygiene,baby_supplies,other'],
            'description' => ['required', 'string', 'min:10', 'max:1000'],
            'urgency'     => ['required', 'in:low,medium,high,critical'],
        ];
    }
}

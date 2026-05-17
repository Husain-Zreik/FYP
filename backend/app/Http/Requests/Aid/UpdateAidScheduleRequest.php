<?php

namespace App\Http\Requests\Aid;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAidScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity'  => 'nullable|integer|min:1',
            'frequency' => 'nullable|in:weekly,biweekly,monthly,quarterly',
            'notes'     => 'nullable|string|max:500',
            'ends_at'   => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ];
    }
}

<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class SuspendTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_platform_operator;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}

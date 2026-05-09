<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantMetadataRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}

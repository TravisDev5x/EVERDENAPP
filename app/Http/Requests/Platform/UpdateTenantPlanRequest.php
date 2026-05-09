<?php

namespace App\Http\Requests\Platform;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_platform_operator;
    }

    protected function prepareForValidation(): void
    {
        $emptyToNull = fn (mixed $v): mixed => $v === '' ? null : $v;

        $this->merge([
            'max_users' => $emptyToNull($this->input('max_users')),
            'max_branches' => $emptyToNull($this->input('max_branches')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'plan_slug' => ['required', 'string', 'max:40'],
            'max_users' => ['nullable', 'integer', 'min:1'],
            'max_branches' => ['nullable', 'integer', 'min:1'],
        ];
    }
}

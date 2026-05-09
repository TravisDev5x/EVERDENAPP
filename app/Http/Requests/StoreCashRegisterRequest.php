<?php

namespace App\Http\Requests;

use App\Models\CashRegister;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCashRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', CashRegister::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('code') === '') {
            $this->merge(['code' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $branchId = (int) app('current_branch_id');

        return [
            'name' => ['required', 'string', 'max:120'],
            'code' => [
                'nullable',
                'string',
                'max:40',
                Rule::unique('cash_registers', 'code')->where('branch_id', $branchId),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use App\Models\CashRegister;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCashRegisterRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->input('code') === '') {
            $this->merge(['code' => null]);
        }
    }

    public function authorize(): bool
    {
        /** @var CashRegister $register */
        $register = $this->route('cashRegister');

        return $this->user()?->can('update', $register) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var CashRegister $register */
        $register = $this->route('cashRegister');
        $branchId = (int) $register->branch_id;

        return [
            'name' => ['required', 'string', 'max:120'],
            'code' => [
                'nullable',
                'string',
                'max:40',
                Rule::unique('cash_registers', 'code')
                    ->where('branch_id', $branchId)
                    ->ignore($register->id),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }
}

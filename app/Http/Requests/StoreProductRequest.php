<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Rules\BelongsToCurrentTenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Product::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->where(
                    'tenant_id',
                    $this->user()?->tenant_id
                ),
            ],
            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products', 'barcode')->where(
                    'tenant_id',
                    $this->user()?->tenant_id
                ),
            ],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'unit' => ['nullable', 'string', 'max:40'],
            'initial_branch_quantity' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'category_id' => [
                'nullable',
                'integer',
                new BelongsToCurrentTenant('product_categories'),
            ],
            /** Tras crear, redirigir a inventario o al catálogo (solo Inertia / formularios HTML). */
            'redirect_to' => ['nullable', 'string', Rule::in(['inventory', 'products'])],
        ];
    }
}

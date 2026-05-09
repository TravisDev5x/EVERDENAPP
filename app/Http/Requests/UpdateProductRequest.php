<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Rules\BelongsToCurrentTenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Product|null $product */
        $product = $this->route('product');

        if (! $product) {
            return false;
        }

        return $this->user()?->can('update', $product) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'barcode' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('products', 'barcode')
                    ->where('tenant_id', $this->user()?->tenant_id)
                    ->ignore($this->route('product')?->id),
            ],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'tax_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'unit' => ['sometimes', 'string', 'max:40'],
            'is_active' => ['sometimes', 'boolean'],
            'category_id' => [
                'sometimes',
                'nullable',
                'integer',
                new BelongsToCurrentTenant('product_categories'),
            ],
        ];
    }
}

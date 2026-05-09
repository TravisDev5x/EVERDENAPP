<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Models\Sale;
use App\Support\ScanCodeNormalizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddSaleItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Sale|null $sale */
        $sale = $this->route('sale');

        return $sale ? ($this->user()?->can('update', $sale) ?? false) : false;
    }

    protected function prepareForValidation(): void
    {
        $weightGrams = $this->input('weight_grams');
        if ($weightGrams !== null && $weightGrams !== '') {
            $grams = (int) $weightGrams;
            if ($grams > 0) {
                $kilograms = round($grams / 1000, 3);
                $this->merge([
                    'quantity' => $kilograms,
                    'weight_grams' => $grams,
                ]);
            }
        }

        $scan = trim((string) $this->input('scan_code', ''));
        if ($scan === '') {
            return;
        }

        $tenantId = (int) $this->user()->tenant_id;

        foreach (ScanCodeNormalizer::candidateCodes($scan) as $candidate) {
            $product = Product::query()
                ->where('tenant_id', $tenantId)
                ->where(function ($q) use ($candidate): void {
                    $q->where('barcode', $candidate)
                        ->orWhereRaw('LOWER(barcode) = ?', [mb_strtolower($candidate)])
                        ->orWhere('sku', $candidate)
                        ->orWhereRaw('LOWER(sku) = ?', [mb_strtolower($candidate)]);
                })
                ->where('is_active', true)
                ->first();

            if ($product !== null) {
                $this->merge([
                    'product_id' => $product->id,
                ]);

                return;
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tenantId = (int) $this->user()->tenant_id;

        return [
            'scan_code' => ['nullable', 'string', 'max:2048'],
            'product_id' => [
                'nullable',
                'integer',
                Rule::exists('products', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'weight_grams' => ['nullable', 'integer', 'min:1', 'max:5000000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $scan = trim((string) $this->input('scan_code', ''));
            $productId = $this->input('product_id');

            if ($productId !== null && $productId !== '') {
                return;
            }

            if ($scan !== '') {
                $validator->errors()->add(
                    'scan_code',
                    'No encontramos un producto activo con ese código (SKU, URL con ?sku= o segmento de ruta).',
                );

                return;
            }

            $validator->errors()->add('product_id', 'Selecciona un producto o escanea un código.');
        });
    }
}

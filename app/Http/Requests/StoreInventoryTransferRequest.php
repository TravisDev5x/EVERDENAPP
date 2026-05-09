<?php

namespace App\Http\Requests;

use App\Models\InventoryTransfer;
use App\Rules\BelongsToCurrentTenant;
use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', InventoryTransfer::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'source_branch_id' => [
                'required',
                'integer',
                new BelongsToCurrentTenant('branches'),
            ],
            'destination_branch_id' => [
                'required',
                'integer',
                'different:source_branch_id',
                new BelongsToCurrentTenant('branches'),
            ],
            'reference' => ['nullable', 'string', 'max:60'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'integer',
                new BelongsToCurrentTenant('products'),
            ],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
        ];
    }
}

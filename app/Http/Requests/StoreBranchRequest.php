<?php

namespace App\Http\Requests;

use App\Enums\BranchSiteKind;
use App\Http\Requests\Concerns\PreparesNullableBranchInput;
use App\Models\Branch;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreBranchRequest extends FormRequest
{
    use PreparesNullableBranchInput;

    public function authorize(): bool
    {
        return $this->user()?->can('create', Branch::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('branches', 'name')->where('tenant_id', $tenantId),
            ],
            'branch_site_kind' => ['required', new Enum(BranchSiteKind::class)],
            'parent_branch_id' => [
                'nullable',
                'integer',
                Rule::exists('branches', 'id')->where('tenant_id', $tenantId),
            ],
            'site_location_detail' => ['nullable', 'string', 'max:500'],
            'address' => ['required', 'string', 'max:500'],
            'state' => ['required', 'string', 'max:120'],
            'postal_code' => ['required', 'string', 'regex:/^\d{5}$/'],
            'code' => ['nullable', 'string', 'max:40'],
            'city' => ['nullable', 'string', 'max:120'],
            'neighborhood' => ['nullable', 'string', 'max:120'],
            'municipality' => ['nullable', 'string', 'max:120'],
            'address_references' => ['nullable', 'string', 'max:1000'],
            'phone' => ['nullable', 'string', 'max:30'],
            'rfc' => ['nullable', 'string', 'regex:/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $parentId = $this->input('parent_branch_id');
            if ($parentId === null || $parentId === '') {
                return;
            }

            $tenantId = $this->user()?->tenant_id;
            $parent = Branch::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->whereKey((int) $parentId)
                ->first();

            if (! $parent instanceof Branch) {
                return;
            }

            if ($parent->parent_branch_id !== null) {
                $validator->errors()->add(
                    'parent_branch_id',
                    'El punto padre debe ser una sucursal ancla (sin punto padre propio).'
                );
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'branch_site_kind' => 'tipo de punto',
            'parent_branch_id' => 'sucursal ancla / plaza',
            'site_location_detail' => 'ubicación dentro del sitio',
            'address' => 'dirección',
            'state' => 'estado',
            'postal_code' => 'código postal',
            'city' => 'ciudad',
            'code' => 'código interno',
            'neighborhood' => 'colonia',
            'municipality' => 'municipio o alcaldía',
            'address_references' => 'referencias',
            'phone' => 'teléfono',
            'rfc' => 'RFC',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'postal_code.regex' => 'El código postal debe tener exactamente 5 dígitos (México).',
            'rfc.regex' => 'El RFC debe tener formato válido (12 o 13 caracteres SAT).',
        ];
    }
}

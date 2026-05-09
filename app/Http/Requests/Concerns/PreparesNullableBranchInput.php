<?php

namespace App\Http\Requests\Concerns;

trait PreparesNullableBranchInput
{
    /**
     * Campos opcionales: cadena vacía → null en BD.
     *
     * @return list<string>
     */
    protected function nullableBranchFieldKeys(): array
    {
        return ['code', 'city', 'phone', 'rfc', 'neighborhood', 'municipality', 'address_references', 'parent_branch_id', 'site_location_detail'];
    }

    protected function prepareForValidation(): void
    {
        $merged = [];
        foreach ($this->nullableBranchFieldKeys() as $key) {
            if ($this->has($key) && ($this->input($key) === '' || $this->input($key) === null)) {
                $merged[$key] = null;
            }
        }

        if ($this->has('rfc') && is_string($this->input('rfc')) && $this->input('rfc') !== '') {
            $merged['rfc'] = mb_strtoupper(trim($this->input('rfc')), 'UTF-8');
        }

        $this->merge($merged);
    }
}

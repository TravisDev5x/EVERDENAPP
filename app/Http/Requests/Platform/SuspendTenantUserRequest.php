<?php

namespace App\Http\Requests\Platform;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class SuspendTenantUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->user()?->is_platform_operator) {
            return false;
        }

        $tenant = $this->route('tenant');
        $target = $this->route('user');

        if (! $tenant instanceof Tenant || ! $target instanceof User) {
            return false;
        }

        if ($target->is_platform_operator) {
            return false;
        }

        return (int) $target->tenant_id === (int) $tenant->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}

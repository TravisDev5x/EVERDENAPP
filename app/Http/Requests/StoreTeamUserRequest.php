<?php

namespace App\Http\Requests;

use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreTeamUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission(Permissions::TEAM_USERS_MANAGE) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tenantId = (int) $this->user()?->tenant_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where('tenant_id', $tenantId),
            ],
            'branch_id' => [
                'required',
                'integer',
                Rule::exists('branches', 'id')->where('tenant_id', $tenantId),
            ],
        ];
    }
}

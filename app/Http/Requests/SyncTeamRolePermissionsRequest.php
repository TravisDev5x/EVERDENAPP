<?php

namespace App\Http\Requests;

use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncTeamRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission(Permissions::TEAM_ROLES_MANAGE) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'permission_keys' => ['required', 'array'],
            'permission_keys.*' => ['string', Rule::in(Permissions::allKeys())],
        ];
    }
}

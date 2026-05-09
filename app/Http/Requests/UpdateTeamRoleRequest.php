<?php

namespace App\Http\Requests;

use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTeamRoleRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}

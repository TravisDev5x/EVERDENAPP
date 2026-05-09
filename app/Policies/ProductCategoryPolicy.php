<?php

namespace App\Policies;

use App\Models\ProductCategory;
use App\Models\User;
use App\Support\Permissions;

class ProductCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permissions::CATALOG_PRODUCTS_VIEW);
    }

    public function view(User $user, ProductCategory $category): bool
    {
        return $user->tenant_id === $category->tenant_id
            && $user->hasPermission(Permissions::CATALOG_PRODUCTS_VIEW);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Permissions::CATALOG_PRODUCTS_MANAGE);
    }

    public function update(User $user, ProductCategory $category): bool
    {
        return $user->tenant_id === $category->tenant_id
            && $user->hasPermission(Permissions::CATALOG_PRODUCTS_MANAGE);
    }

    public function delete(User $user, ProductCategory $category): bool
    {
        return $user->tenant_id === $category->tenant_id
            && $user->hasPermission(Permissions::CATALOG_PRODUCTS_MANAGE);
    }
}

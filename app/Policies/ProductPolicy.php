<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use App\Support\Permissions;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permissions::CATALOG_PRODUCTS_VIEW);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Permissions::CATALOG_PRODUCTS_MANAGE);
    }

    public function update(User $user, Product $product): bool
    {
        return $user->tenant_id === $product->tenant_id
            && $user->hasPermission(Permissions::CATALOG_PRODUCTS_MANAGE);
    }
}

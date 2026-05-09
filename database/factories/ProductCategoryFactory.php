<?php

namespace Database\Factories;

use App\Models\ProductCategory;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProductCategory>
 */
class ProductCategoryFactory extends Factory
{
    protected $model = ProductCategory::class;

    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Abarrotes', 'Bebidas', 'Lácteos', 'Limpieza',
            'Panadería', 'Carnes', 'Frutas', 'Dulces',
        ]);

        return [
            'tenant_id' => Tenant::factory(),
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => null,
            'color' => fake()->safeHexColor(),
            'sort_order' => 0,
            'is_active' => true,
        ];
    }
}

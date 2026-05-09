<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'sku' => fake()->unique()->bothify('SKU-####'),
            'name' => fake()->words(3, true),
            'price' => fake()->randomFloat(2, 1, 5000),
            'tax_rate' => fake()->randomElement([0, 8, 16]),
            'unit' => fake()->randomElement(['pieza', 'caja', 'kg']),
            'is_active' => true,
        ];
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_product_stock', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 12, 3)->default(0);
            $table->timestamps();

            $table->unique(['branch_id', 'product_id']);
            $table->index(['tenant_id', 'branch_id']);
        });

        if (Schema::hasColumn('products', 'quantity_on_hand')) {
            $products = DB::table('products')->select(['id', 'tenant_id', 'quantity_on_hand'])->get();

            foreach ($products as $product) {
                $branches = DB::table('branches')
                    ->where('tenant_id', $product->tenant_id)
                    ->orderByDesc('is_main')
                    ->orderBy('id')
                    ->get(['id', 'is_main']);

                foreach ($branches as $branch) {
                    $qty = $branch->is_main
                        ? (float) $product->quantity_on_hand
                        : 0.0;

                    DB::table('branch_product_stock')->insert([
                        'tenant_id' => $product->tenant_id,
                        'branch_id' => $branch->id,
                        'product_id' => $product->id,
                        'quantity' => round($qty, 3),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            Schema::table('products', function (Blueprint $table): void {
                $table->dropColumn('quantity_on_hand');
            });
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->decimal('quantity_on_hand', 12, 3)->default(0)->after('unit');
        });

        $rows = DB::table('branch_product_stock')
            ->join('branches', 'branch_product_stock.branch_id', '=', 'branches.id')
            ->where('branches.is_main', true)
            ->select([
                'branch_product_stock.product_id as product_id',
                'branch_product_stock.quantity as quantity',
            ])
            ->get();

        foreach ($rows as $row) {
            DB::table('products')
                ->where('id', $row->product_id)
                ->update(['quantity_on_hand' => $row->quantity]);
        }

        Schema::dropIfExists('branch_product_stock');
    }
};

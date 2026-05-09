<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('barcode', 100)
                ->nullable()
                ->after('sku');

            $table->unique(['tenant_id', 'barcode'], 'products_tenant_barcode_unique');

            $table->index(['tenant_id', 'barcode'], 'products_tenant_barcode_index');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_tenant_barcode_unique');
            $table->dropIndex('products_tenant_barcode_index');
            $table->dropColumn('barcode');
        });
    }
};

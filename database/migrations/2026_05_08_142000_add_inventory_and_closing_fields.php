<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('quantity_on_hand', 12, 3)->default(0)->after('unit');
        });

        Schema::table('cash_sessions', function (Blueprint $table) {
            $table->decimal('expected_closing_amount', 12, 2)->nullable()->after('cash_sales_total');
            $table->decimal('closing_difference', 12, 2)->nullable()->after('closing_amount');
            $table->string('closing_note', 255)->nullable()->after('closing_difference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('quantity_on_hand');
        });

        Schema::table('cash_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'expected_closing_amount',
                'closing_difference',
                'closing_note',
            ]);
        });
    }
};

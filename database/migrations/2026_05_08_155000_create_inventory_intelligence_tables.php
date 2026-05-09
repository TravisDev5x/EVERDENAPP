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
        Schema::create('inventory_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('min_threshold', 12, 3)->default(10);
            $table->boolean('is_alert_enabled')->default(true);
            $table->unsignedInteger('cooldown_minutes')->default(60);
            $table->timestamps();

            $table->unique(['tenant_id', 'branch_id', 'product_id'], 'inventory_policy_unique');
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->decimal('quantity_delta', 12, 3);
            $table->decimal('balance_after', 12, 3);
            $table->string('source_type', 120)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id', 'product_id']);
            $table->index(['source_type', 'source_id']);
        });

        Schema::create('inventory_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_policy_id')->nullable()->constrained()->nullOnDelete();
            $table->string('severity', 20);
            $table->string('status', 20)->default('open');
            $table->decimal('current_stock', 12, 3);
            $table->decimal('threshold', 12, 3);
            $table->string('dedupe_key', 150);
            $table->timestamp('triggered_at');
            $table->timestamp('resolved_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id', 'status']);
            $table->index(['product_id', 'status']);
            $table->index('dedupe_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_alerts');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventory_policies');
    }
};

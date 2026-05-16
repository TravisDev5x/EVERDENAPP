<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('tenants', 'stripe_id')) {
                $table->string('stripe_id')->nullable()->index();
            }
            if (! Schema::hasColumn('tenants', 'pm_type')) {
                $table->string('pm_type')->nullable();
            }
            if (! Schema::hasColumn('tenants', 'pm_last_four')) {
                $table->string('pm_last_four', 4)->nullable();
            }
            if (! Schema::hasColumn('tenants', 'trial_ends_at')) {
                $table->timestamp('trial_ends_at')->nullable();
            }
            if (! Schema::hasColumn('tenants', 'plan_id')) {
                $table->foreignId('plan_id')->nullable()->constrained('plans')->nullOnDelete();
            }
            if (! Schema::hasColumn('tenants', 'status')) {
                $table->string('status', 32)->nullable()->index();
            }
        });

        if (Schema::hasTable('subscriptions') && Schema::hasColumn('subscriptions', 'user_id')) {
            Schema::disableForeignKeyConstraints();
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->renameColumn('user_id', 'tenant_id');
            });
            Schema::enableForeignKeyConstraints();
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('subscriptions') && Schema::hasColumn('subscriptions', 'tenant_id')) {
            Schema::disableForeignKeyConstraints();
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->renameColumn('tenant_id', 'user_id');
            });
            Schema::enableForeignKeyConstraints();
        }

        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'plan_id')) {
                $table->dropForeign(['plan_id']);
                $table->dropColumn('plan_id');
            }
        });

        Schema::table('tenants', function (Blueprint $table) {
            foreach (['status', 'trial_ends_at', 'pm_last_four', 'pm_type', 'stripe_id'] as $col) {
                if (Schema::hasColumn('tenants', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};

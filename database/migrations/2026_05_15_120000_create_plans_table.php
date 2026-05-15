<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('price_mxn');
            $table->integer('max_users');
            $table->integer('max_products');
            $table->integer('max_branches');
            $table->boolean('has_offline_mode')->default(false);
            $table->boolean('has_advanced_reports')->default(false);
            $table->boolean('has_api_access')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();

        DB::table('plans')->insert([
            [
                'name' => 'Básico',
                'slug' => 'standard',
                'price_mxn' => 299,
                'max_users' => 3,
                'max_products' => 100,
                'max_branches' => 1,
                'has_offline_mode' => false,
                'has_advanced_reports' => false,
                'has_api_access' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'price_mxn' => 599,
                'max_users' => 10,
                'max_products' => -1,
                'max_branches' => 3,
                'has_offline_mode' => true,
                'has_advanced_reports' => true,
                'has_api_access' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'price_mxn' => 1199,
                'max_users' => -1,
                'max_products' => -1,
                'max_branches' => -1,
                'has_offline_mode' => true,
                'has_advanced_reports' => true,
                'has_api_access' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};

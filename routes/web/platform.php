<?php

use App\Http\Controllers\Platform\PlatformPlanFinanceController;
use App\Http\Controllers\Platform\TenantDirectoryController;
use App\Http\Controllers\Platform\TenantUsersController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'platform'])->prefix('platform')->name('platform.')->group(function (): void {
    Route::get('/finance/plans', [PlatformPlanFinanceController::class, 'index'])->name('finance.plans');
    Route::get('/tenants', [TenantDirectoryController::class, 'index'])->name('tenants.index');
    Route::get('/tenants/{tenant}/users', [TenantUsersController::class, 'index'])->name('tenants.users');
    Route::patch('/tenants/{tenant}/users/{user}/suspend', [TenantUsersController::class, 'suspend'])->name('tenants.users.suspend');
    Route::patch('/tenants/{tenant}/users/{user}/activate', [TenantUsersController::class, 'activate'])->name('tenants.users.activate');
    Route::patch('/tenants/{tenant}', [TenantDirectoryController::class, 'updateMetadata'])->name('tenants.update');
    Route::patch('/tenants/{tenant}/plan', [TenantDirectoryController::class, 'updatePlan'])->name('tenants.plan.update');
    Route::patch('/tenants/{tenant}/suspend', [TenantDirectoryController::class, 'suspend'])->name('tenants.suspend');
    Route::patch('/tenants/{tenant}/activate', [TenantDirectoryController::class, 'activate'])->name('tenants.activate');
});

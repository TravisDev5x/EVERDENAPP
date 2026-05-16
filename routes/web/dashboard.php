<?php

use App\Http\Controllers\BillingController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'tenant.context'])
    ->name('dashboard');

Route::get('/billing', [BillingController::class, 'index'])
    ->middleware(['auth', 'verified', 'tenant.context'])
    ->name('tenant.billing');

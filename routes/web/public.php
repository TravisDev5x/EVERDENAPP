<?php

use App\Http\Controllers\LegalNoticeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $plans = \App\Models\Plan::where('is_active', true)
        ->orderBy('price_mxn')
        ->get([
            'id', 'name', 'slug', 'price_mxn',
            'max_users', 'max_products', 'max_branches',
            'has_offline_mode', 'has_advanced_reports', 'has_api_access',
        ]);

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'plans' => $plans,
    ]);
});

Route::get('/privacidad', [LegalNoticeController::class, 'privacy'])->name('legal.privacy');
Route::get('/terminos', [LegalNoticeController::class, 'terms'])->name('legal.terms');

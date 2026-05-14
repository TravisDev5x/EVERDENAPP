<?php

use App\Http\Controllers\LegalNoticeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::get('/privacidad', [LegalNoticeController::class, 'privacy'])->name('legal.privacy');
Route::get('/terminos', [LegalNoticeController::class, 'terms'])->name('legal.terms');

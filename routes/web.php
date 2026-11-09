<?php

declare(strict_types=1);

use App\Http\Controllers\PhotoboothController;
use Illuminate\Support\Facades\Route;

Route::controller(PhotoboothController::class)->group(function (): void {
    Route::get('/', 'home')->name('home');
    Route::get('/photobooth', 'photobooth')->name('photobooth');
    Route::get('/editor', 'editor')->name('editor');
    Route::get('/result', 'result')->name('result');
});

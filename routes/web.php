<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GpuController;

Route::get('/', function () {
    return view('welcome');
});

// Temporary: expose API endpoint via web routes because RouteServiceProvider is not present
Route::get('/api/gpus', [GpuController::class, 'index']);

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GpuController;

Route::get('/', function () {
    return view('welcome');
});

// Removed temporary hot-deals route; API routes now handle these endpoints.
// Temporary: expose API endpoint via web routes because RouteServiceProvider is not present
Route::get('/api/gpus', [GpuController::class, 'index']);

// Web fallback for hot-deals (calls API controller) — ensures frontend can fetch immediately
Route::get('/api/hot-deals', [\App\Http\Controllers\Api\HotDealsController::class, 'index']);

// Expose product API via web routes (since api.php routes are not loaded in this environment)
Route::get('/api/products/{slug}', [\App\Http\Controllers\Api\ProductController::class, 'show']);
Route::get('/api/product/{slug}', [\App\Http\Controllers\Api\ProductController::class, 'show']);
Route::get('/api/product/resolve/{slug}', [\App\Http\Controllers\Api\ProductController::class, 'resolve']);

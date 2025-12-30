<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GpuController;
use App\Http\Controllers\Api\ProductsController;

Route::get('/', function () {
    return view('welcome');
});

// Removed temporary hot-deals route; API routes now handle these endpoints.
// Temporary: expose API endpoint via web routes because RouteServiceProvider is not present
// Route `/api/gpus` and other API endpoints through the generic ProductsController
Route::get('/api/gpus', [ProductsController::class, 'index'])->defaults('category_slug', 'gpus');

Route::get('/api/cpus', [ProductsController::class, 'index'])->defaults('category_slug', 'cpus');
Route::get('/api/products', [ProductsController::class, 'index']);

// Web fallback for hot-deals (calls API controller) — ensures frontend can fetch immediately
Route::get('/api/hot-deals', [\App\Http\Controllers\Api\HotDealsController::class, 'index']);

// Expose product API via web routes (since api.php routes are not loaded in this environment)
Route::get('/api/products/{slug}', [\App\Http\Controllers\Api\ProductController::class, 'show']);
Route::get('/api/product/{slug}', [\App\Http\Controllers\Api\ProductController::class, 'show']);
Route::get('/api/product/resolve/{slug}', [\App\Http\Controllers\Api\ProductController::class, 'resolve']);

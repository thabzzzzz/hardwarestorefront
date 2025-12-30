<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductsController;
use App\Http\Controllers\Api\HotDealsController;
use App\Http\Controllers\Api\ProductController;

Route::get('/gpus', [ProductsController::class, 'index'])->defaults('category_slug', 'gpus');
Route::get('/cpus', [ProductsController::class, 'index'])->defaults('category_slug', 'cpus');
Route::get('/products', [ProductsController::class, 'index']);
Route::get('/hot-deals', [HotDealsController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
// singular route for product lookup (convenience)
Route::get('/product/{slug}', [ProductController::class, 'show']);

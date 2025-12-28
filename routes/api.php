<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GpuController;
use App\Http\Controllers\Api\HotDealsController;
use App\Http\Controllers\Api\ProductController;

Route::get('/gpus', [GpuController::class, 'index']);
Route::get('/hot-deals', [HotDealsController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
// singular route for product lookup (convenience)
Route::get('/product/{slug}', [ProductController::class, 'show']);

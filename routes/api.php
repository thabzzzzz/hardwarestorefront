<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductsController;
use App\Http\Controllers\Api\HotDealsController;
use App\Http\Controllers\Api\ProductController;

Route::get('/gpus', [ProductsController::class, 'index'])->defaults('category_slug', 'gpus');
Route::get('/ram', [ProductsController::class, 'index'])->defaults('category_slug', 'ram');
Route::get('/ssds', [ProductsController::class, 'index'])->defaults('category_slug', 'ssds');
Route::get('/hdds', [ProductsController::class, 'index'])->defaults('category_slug', 'hdds');
Route::get('/monitors', [ProductsController::class, 'index'])->defaults('category_slug', 'monitors');
Route::get('/keyboards', [ProductsController::class, 'index'])->defaults('category_slug', 'keyboards');
Route::get('/mice', [ProductsController::class, 'index'])->defaults('category_slug', 'mice');
Route::get('/headsets', [ProductsController::class, 'index'])->defaults('category_slug', 'headsets');
Route::get('/routers', [ProductsController::class, 'index'])->defaults('category_slug', 'routers');

Route::get('/case-fans', [ProductsController::class, 'index'])->defaults('category_slug', 'casefans');
Route::get('/psus', [ProductsController::class, 'index'])->defaults('category_slug', 'psus');
Route::get('/cases', [ProductsController::class, 'index'])->defaults('category_slug', 'cases');
Route::get('/cpus', [ProductsController::class, 'index'])->defaults('category_slug', 'cpus');
Route::get('/motherboards', [ProductsController::class, 'index'])->defaults('category_slug', 'motherboards');
Route::get('/products', [ProductsController::class, 'index']);
Route::get('/hot-deals', [HotDealsController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
// singular route for product lookup (convenience)
Route::get('/product/{slug}', [ProductController::class, 'show']);

// Authentication
// use App\Http\Controllers\Api\AuthController;
// use App\Http\Middleware\AuthenticateWithApiToken;

// Route::post('/auth/register', [AuthController::class, 'register']);
// Route::post('/auth/login', [AuthController::class, 'login']);
// Route::get('/auth/me', [AuthController::class, 'me'])->middleware(AuthenticateWithApiToken::class);
// Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware(AuthenticateWithApiToken::class);

// Wishlist removed

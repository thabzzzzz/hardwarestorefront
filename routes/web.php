<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GpuController;
use App\Http\Controllers\Api\ProductsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Middleware\AuthenticateWithApiToken;

Route::get('/', function () {
    return view('welcome');
});

// Load API routes under the `api` middleware so the runtime exposes all API endpoints
// (This mirrors Laravel's RouteServiceProvider behavior for environments where api.php
// isn't automatically loaded.)
Route::group(['prefix' => 'api', 'middleware' => 'api'], function () {
    require base_path('routes/api.php');
});

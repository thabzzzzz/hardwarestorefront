<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GpuController;
use App\Http\Controllers\Api\HotDealsController;

Route::get('/gpus', [GpuController::class, 'index']);
Route::get('/hot-deals', [HotDealsController::class, 'index']);

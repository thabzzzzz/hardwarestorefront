<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GpuController;

Route::get('/gpus', [GpuController::class, 'index']);

<?php

// Deprecated: GpuController removed in favor of ProductsController
// Keep this stub to avoid fatal errors if any old route still references it.

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class GpuController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(['message' => 'GpuController removed; use /api/gpus (ProductsController)'], 410);
    }
}

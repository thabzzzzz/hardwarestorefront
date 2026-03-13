<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PcBuild;
use Illuminate\Support\Facades\Auth;

class PcBuildController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $builds = PcBuild::where('user_id', Auth::id())
                         ->with('components.variant.product')
                         ->orderBy('updated_at', 'desc')
                         ->get();

        return response()->json($builds);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'total_price' => 'numeric|min:0',
            'components' => 'array',
            'components.*.product_variant_id' => 'required|uuid|exists:product_variants,id',
            'components.*.quantity' => 'required|integer|min:1',
        ]);

        $build = PcBuild::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'description' => $request->description,
            'total_price' => $request->total_price ?? 0,
        ]);

        if ($request->has('components')) {
            $build->components()->createMany($request->components);
        }

        return response()->json($build->load('components.variant.product'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $build = PcBuild::where('id', $id)->where('user_id', Auth::id())
                        ->with('components.variant.product')
                        ->firstOrFail();

        return response()->json($build);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $build = PcBuild::where('id', $id)->where('user_id', Auth::id())->firstOrFail();

        $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'total_price' => 'numeric|min:0',
            'components' => 'array',
            'components.*.product_variant_id' => 'required|uuid|exists:product_variants,id',
            'components.*.quantity' => 'required|integer|min:1',
        ]);

        $build->update($request->only(['name', 'description', 'total_price']));

        if ($request->has('components')) {
            // Re-sync all components: clear old and add new
            $build->components()->delete();
            $build->components()->createMany($request->components);
        }

        return response()->json($build->load('components.variant.product'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $build = PcBuild::where('id', $id)->where('user_id', Auth::id())->firstOrFail();
        
        $build->delete();

        return response()->json(['message' => 'PC Build successfully deleted']);
    }
}

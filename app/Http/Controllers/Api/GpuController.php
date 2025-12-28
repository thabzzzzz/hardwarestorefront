<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class GpuController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, (int) $request->query('per_page', 12));

        $query = ProductVariant::with(['product','images','stock','prices'])
            ->whereHas('product', function($q){ $q->where('category_id', '!=', null); })
            ->where('is_active', true);

        if ($q = $request->query('q')) {
            $query->where(function($b) use ($q) {
                $b->where('title', 'ilike', "%{$q}%")
                  ->orWhere('sku','ilike',"%{$q}%");
            });
        }

        $page = $query->paginate($perPage);

        $data = $page->through(function($variant){
            $price = $variant->prices()->orderByDesc('valid_from')->first();
            $thumbnail = $variant->images()->where('role','thumbnail')->first() ?? $variant->product->images()->where('role','thumbnail')->first();

            return [
                'variant_id' => $variant->id,
                'product_id' => $variant->product_id,
                'name' => $variant->product->name,
                'brand' => $variant->product->vendor ? $variant->product->vendor->name : $variant->product->brand,
                'manufacturer' => $variant->product->manufacturer,
                'slug' => $variant->product->slug,
                'sku' => $variant->sku,
                'title' => $variant->title,
                'current_price' => $price ? ['amount_cents' => $price->amount_cents, 'currency' => $price->currency] : null,
                'thumbnail' => $thumbnail ? $thumbnail->path : null,
                'short_specs' => array_slice((array)($variant->specs ?? []), 0, 6),
                'stock' => $variant->stock ? ['qty_available' => $variant->stock->qty_available, 'status' => $variant->stock->status] : null,
            ];
        });

        return response()->json(array_merge($page->toArray(), ['data' => $data->items()]));
    }
}

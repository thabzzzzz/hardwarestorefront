<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\Category;
use Illuminate\Http\Request;

class ProductsController extends Controller
{
    /**
     * Generic products index supporting filters: category_slug, type, q, page, per_page
     */
    public function index(Request $request)
    {
        $perPage = max(1, (int) $request->query('per_page', 12));

        // Resolve category slug preference: route default > query param > type
        $categorySlug = $request->route('category_slug') ?? $request->query('category_slug') ?? $request->query('type');

        $categoryId = null;
        if ($categorySlug) {
            $categoryId = Category::where('slug', $categorySlug)->value('id');
        }

        $query = ProductVariant::with(['product', 'images', 'stock', 'prices'])
            ->where('is_active', true);

        if ($categoryId) {
            $query->whereHas('product', function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            });
        } else {
            // optional: allow type-based filtering via product_type (denormalized)
            if ($type = $request->query('type')) {
                $query->whereHas('product', function ($q) use ($type) {
                    $q->where('product_type', $type)->orWhere('slug', $type);
                });
            }
        }

        if ($q = $request->query('q')) {
            $query->where(function ($b) use ($q) {
                $b->where('title', 'ilike', "%{$q}%")
                    ->orWhere('sku', 'ilike', "%{$q}%");
            });
        }

        // support simple tag/flag filters
        if ($tag = $request->query('tag')) {
            $query->whereHas('product', function ($p) use ($tag) {
                $p->whereRaw("(tags::text ILIKE ?)", ["%{$tag}%"]);
            });
        }

        // flags: featured, popular, new
        if ($request->filled('featured')) {
            $query->whereHas('product', function ($p) {
                $p->where('is_featured', true);
            });
        }

        if ($request->filled('popular')) {
            $query->whereHas('product', function ($p) {
                $p->where('is_popular', true);
            });
        }

        if ($request->filled('new')) {
            $query->whereHas('product', function ($p) {
                $p->where('is_new', true);
            });
        }

        $page = $query->paginate($perPage);

        $data = $page->through(function ($variant) {
            $price = $variant->prices()->orderByDesc('valid_from')->first();
            $thumbnail = $variant->images()->where('role', 'thumbnail')->first() ?? $variant->product->images()->where('role', 'thumbnail')->first();

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

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Vendor;

class ProductController extends Controller
{
    /**
     * Return product payload for the given slug by querying the database.
     */
    public function show(Request $request, $slug)
    {
        // If the caller supplied a product id (UUID) return by id unambiguously
        $isUuid = (bool) preg_match('/^[0-9a-fA-F\-]{36}$/', $slug);
        if ($isUuid) {
            $product = Product::find($slug);
        } else {
            // exact slug match (case-insensitive)
            $product = Product::whereRaw('LOWER(slug) = ?', [strtolower($slug)])->first();
        }

        // Do NOT perform fuzzy matching. If not found, return 404 to avoid ambiguity.

        if (! $product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        // thumbnail: prefer product-level image ordered by sort_order
        $image = $product->images()->orderBy('sort_order')->first();
        $thumbnail = $image ? $image->path : null;

        // prefer higher-resolution variants if they exist (1200w -> 800w -> 400w -> orig -> thumb)
        if ($thumbnail) {
            $ext = pathinfo($thumbnail, PATHINFO_EXTENSION);
            $withoutExt = substr($thumbnail, 0, -(strlen($ext) + 1));
            $preferredTags = ['1200w', '800w', '400w', 'orig', 'thumb'];
            foreach ($preferredTags as $tag) {
                $candidate = $withoutExt . '-' . $tag . '.' . $ext;
                $fullPath = public_path(ltrim($candidate, '/'));
                if (file_exists($fullPath)) {
                    $thumbnail = $candidate;
                    break;
                }
            }
        }

        // choose a variant (active if available)
        $variant = $product->variants()->where('is_active', true)->first() ?: $product->variants()->first();

        $price = null;
        $stock = null;
        $specs = [];

        if ($variant) {
            $latestPrice = $variant->prices()->orderBy('valid_from', 'desc')->first();
            if ($latestPrice) {
                $price = [
                    'amount_cents' => $latestPrice->amount_cents,
                    'currency' => $latestPrice->currency,
                ];
            }

            $stockLevel = $variant->stock;
            if ($stockLevel) {
                $stock = [
                    'qty_available' => $stockLevel->qty_available,
                    'status' => $stockLevel->status,
                ];
            }

            $specs = $variant->specs ?? [];
        }

        // brand: prefer vendor name (vendor represents the card vendor like ASUS/XFX), include manufacturer separately
        $brand = $product->vendor ? $product->vendor->name : $product->brand;
        $manufacturer = $product->manufacturer;

        $payload = [
            'slug' => $product->slug,
            'title' => $product->name,
            'brand' => $brand,
            'manufacturer' => $manufacturer,
            'product_id' => (string) $product->id,
            'thumbnail' => $thumbnail,
            'stock' => $stock,
            'price' => $price,
            'specs' => $specs,
        ];

        return response()->json($payload);
    }

    /**
     * Resolve a requested slug to a canonical product slug when possible.
     * Returns { canonical: "the-canonical-slug" } or 404.
     */
    public function resolve(Request $request, $slug)
    {
        // exact slug (case-insensitive)
        $product = Product::whereRaw('LOWER(slug) = ?', [strtolower($slug)])->first();

        // if slug looks like a UUID, try id
        if (! $product && preg_match('/^[0-9a-fA-F\-]{36}$/', $slug)) {
            $product = Product::find($slug);
        }

        // fallback: tokenized AND match on slug or name (require all tokens)
        if (! $product) {
            $tokens = array_filter(preg_split('/[^A-Za-z0-9]+/', $slug));
            if (count($tokens) > 0) {
                $query = Product::query();
                foreach ($tokens as $t) {
                    $like = "%{$t}%";
                    $query->whereRaw('(slug ILIKE ? OR name ILIKE ?)', [$like, $like]);
                }
                $product = $query->first();
            }
        }

        if (! $product) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['canonical' => $product->slug]);
    }
}

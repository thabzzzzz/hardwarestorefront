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
            $withoutExt = substr($thumbnail, 0, - (strlen($ext) + 1));
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

            // If explicit specs JSON is empty, synthesize a readable key/value
            // specs object from available normalized attributes and numeric columns
            if (empty($specs)) {
                $specs = [];
                // merge any normalized attributes first
                $attrs = $variant->attributes_normalized ?? [];
                if (is_array($attrs)) {
                    foreach ($attrs as $k => $v) {
                        if ($v !== null && $v !== '') {
                            $specs[$k] = (string) $v;
                        }
                    }
                }

                // helper to set if present
                $setIf = function ($key, $val) use (&$specs) {
                    if ($val !== null && $val !== '') {
                        $specs[$key] = (string) $val;
                    }
                };

                // common GPU fields (use human-friendly names)
                $setIf('Memory', $variant->vram_gb ?? $variant->vram_gb_int ?? null);
                $setIf('Memory Type', $variant->vram_type ?? null);
                // bus width may be stored as '256-Bit' or as integer
                $bw = $variant->bus_width_bit ?? ($variant->bus_width_int ? ($variant->bus_width_int . '-Bit') : null);
                $setIf('Bus Width', $bw);
                // boost clock: prefer ghz human string, fall back to mhz
                $setIf('Boost Clock', $variant->boost_clock_ghz ?? ($variant->boost_clock_mhz ? ($variant->boost_clock_mhz . ' MHz') : null));
                $setIf('TDP', $variant->tdp_watts ?? $variant->tdp_watts_int ?? null);
                $setIf('Cores', $variant->cores ?? $variant->cores_int ?? null);
                $setIf('Threads', $variant->threads ?? $variant->threads_int ?? null);
            }
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
            // Human-friendly key/value specs (synthesized if empty)
            'specs' => $specs,
            // Preserve any parsed spec tables (from scraper/parser) when present
            'spec_tables' => null,
            // Raw spec-ish fields (numeric and original parsed blobs) to allow
            // the frontend to render full spec sections beyond simple KV pairs.
            'spec_fields' => [],
        ];

        // include parsed spec tables if available
        if (isset($variant->raw_spec_tables)) {
            $decoded = null;
            try {
                $decoded = json_decode($variant->raw_spec_tables, true);
            } catch (\Exception $e) {
                $decoded = null;
            }
            if (is_array($decoded)) {
                $payload['spec_tables'] = $decoded;
            } else {
                // still include raw string so front-end can attempt parsing
                $payload['spec_tables'] = null;
                $payload['spec_fields']['raw_spec_tables'] = $variant->raw_spec_tables;
            }
        }

        // collect a set of useful raw fields to expose to frontend
        $rawKeys = [
            'raw_jsonld',
            'raw_spec_tables',
            'image_urls',
            'vram_gb',
            'vram_type',
            'bus_width_bit',
            'boost_clock_ghz',
            'tdp_watts',
            'cores',
            'threads',
            'vram_gb_int',
            'bus_width_int',
            'boost_clock_mhz',
            'tdp_watts_int',
            'cores_int',
            'threads_int',
            'mpn',
            'source_name',
            'source_url'
        ];
        foreach ($rawKeys as $rk) {
            if (isset($variant->{$rk}) && $variant->{$rk} !== null && $variant->{$rk} !== '') {
                $payload['spec_fields'][$rk] = $variant->{$rk};
            }
        }

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

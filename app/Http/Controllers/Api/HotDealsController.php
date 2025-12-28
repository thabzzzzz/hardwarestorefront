<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class HotDealsController extends Controller
{
    public function index(Request $request)
    {
        $cacheKey = 'hot_deals_v1';
        $data = Cache::remember($cacheKey, 30, function () {
            $rows = DB::table('products as p')
                ->join('product_variants as v', 'v.product_id', '=', 'p.id')
                ->leftJoin('images as i', 'i.product_id', '=', 'p.id')
                ->leftJoin('prices as pr', 'pr.variant_id', '=', 'v.id')
                ->leftJoin('vendors as vend', 'vend.id', '=', 'p.vendor_id')
                ->select('v.id as variant_id', 'p.id as product_id', 'p.slug as slug', 'p.name', 'p.manufacturer', 'vend.name as vendor_name', 'v.title', 'v.sku', 'pr.amount_cents', 'pr.currency', 'i.path as thumbnail')
                ->whereIn('p.slug', ['nzxt-h5-mini-itx-case'])
                ->get();

            return $rows->map(function ($r) {
                return [
                    'variant_id' => $r->variant_id,
                    'product_id' => $r->product_id,
                    'slug' => $r->slug,
                    'title' => $r->title ?? $r->name,
                    'sku' => $r->sku,
                    'brand' => $r->vendor_name ?? $r->name,
                    'manufacturer' => $r->manufacturer,
                    'current_price' => $r->amount_cents ? ['amount_cents' => $r->amount_cents, 'currency' => $r->currency] : null,
                    'thumbnail' => $r->thumbnail,
                ];
            })->values();
        });

        return response()->json(['data' => $data]);
    }
}

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
                ->select('v.id as variant_id', 'p.name', 'v.title', 'v.sku', 'pr.amount_cents', 'pr.currency', 'i.path as thumbnail')
                ->whereIn('p.slug', ['nzxt-h5-mini-itx-case'])
                ->groupBy('v.id','p.name','v.title','v.sku','pr.amount_cents','pr.currency','i.path')
                ->get();

            return $rows->map(function($r){
                return [
                    'variant_id' => $r->variant_id,
                    'title' => $r->title ?? $r->name,
                    'sku' => $r->sku,
                    'current_price' => $r->amount_cents ? ['amount_cents' => $r->amount_cents, 'currency' => $r->currency] : null,
                    'thumbnail' => $r->thumbnail,
                ];
            })->values();
        });

        return response()->json(['data' => $data]);
    }
}

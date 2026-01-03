<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UpdateStockSeeder extends Seeder
{
    public function run(): void
    {
        // Pick first 4 variants and set two to out-of-stock, two to reserved
        $variants = DB::table('product_variants')->limit(4)->pluck('id')->toArray();

        if (count($variants) < 4) {
            return; // nothing to do in small datasets
        }

        $now = Carbon::now();

        // first two -> out of stock
        for ($i = 0; $i < 2; $i++) {
            DB::table('stock_levels')->updateOrInsert(
                ['variant_id' => $variants[$i]],
                ['qty_available' => 0, 'qty_reserved' => 0, 'status' => 'out_of_stock', 'updated_at' => $now]
            );
        }

        // next two -> reserved
        for ($i = 2; $i < 4; $i++) {
            DB::table('stock_levels')->updateOrInsert(
                ['variant_id' => $variants[$i]],
                ['qty_available' => 5, 'qty_reserved' => 3, 'status' => 'reserved', 'updated_at' => $now]
            );
        }
    }
}

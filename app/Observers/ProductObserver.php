<?php

namespace App\Observers;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProductObserver
{
    public function saved(Product $product): void
    {
        // Ensure product_type mirrors category slug when category changes or missing
        if ($product->category_id) {
            $currentType = $product->product_type;
            $slug = DB::table('categories')->where('id', $product->category_id)->value('slug');
            if ($slug && ($currentType === null || $currentType === '' || $product->wasChanged('category_id'))) {
                DB::table('products')->where('id', $product->id)->update(['product_type' => $slug]);
            }
        }

        // Recompute flags using lightweight queries (write directly to avoid recursion)
        $isFeatured = false;
        if ($product->release_date) {
            $isFeatured = Carbon::parse($product->release_date)->gte(Carbon::now()->subDays(365));
        }

        $isNew = false;
        if ($product->created_at) {
            $isNew = Carbon::parse($product->created_at)->gte(Carbon::now()->subDays(90));
        }

        $isPopular = DB::table('product_variants as v')
            ->join('stock_levels as s', 'v.id', '=', 's.variant_id')
            ->where('v.product_id', $product->id)
            ->where('s.qty_available', '>', 10)
            ->exists();

        $updates = [];
        if ($product->is_featured !== $isFeatured) $updates['is_featured'] = $isFeatured;
        if ($product->is_popular !== $isPopular) $updates['is_popular'] = $isPopular;
        if ($product->is_new !== $isNew) $updates['is_new'] = $isNew;

        if (!empty($updates)) {
            DB::table('products')->where('id', $product->id)->update($updates);
        }
    }
}

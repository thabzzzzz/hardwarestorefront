<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BackfillProductTypeAndFlagsSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Starting backfill: product_type and product flags');

        // Backfill product_type from categories.slug
        DB::statement("UPDATE products p SET product_type = c.slug FROM categories c WHERE p.category_id = c.id AND (p.product_type IS NULL OR p.product_type = '')");

        // Ensure flags are explicit booleans before setting
        DB::statement("UPDATE products SET is_featured = false WHERE is_featured IS NULL");
        DB::statement("UPDATE products SET is_popular = false WHERE is_popular IS NULL");
        DB::statement("UPDATE products SET is_new = false WHERE is_new IS NULL");

        // Count before
        $beforeFeatured = DB::select("SELECT count(*) AS cnt FROM products WHERE is_featured = true");

        // Heuristics to set flags:
        // - featured: products released within the last 365 days
        // - popular: products that have any variant with >10 available stock
        // - new: products created within the last 90 days
        DB::statement("UPDATE products SET is_featured = true WHERE release_date >= now() - interval '365 days'");
        DB::statement("UPDATE products SET is_popular = true FROM product_variants v JOIN stock_levels s ON v.id = s.variant_id WHERE v.product_id = products.id AND s.qty_available > 10");
        DB::statement("UPDATE products SET is_new = true WHERE created_at >= now() - interval '90 days'");

        // Counts after
        $afterFeatured = DB::select("SELECT count(*) AS cnt FROM products WHERE is_featured = true");
        $afterPopular = DB::select("SELECT count(*) AS cnt FROM products WHERE is_popular = true");
        $afterNew = DB::select("SELECT count(*) AS cnt FROM products WHERE is_new = true");

        $this->command->info('Featured before: ' . ($beforeFeatured[0]->cnt ?? 0));
        $this->command->info('Featured after: ' . ($afterFeatured[0]->cnt ?? 0));
        $this->command->info('Popular after: ' . ($afterPopular[0]->cnt ?? 0));
        $this->command->info('New after: ' . ($afterNew[0]->cnt ?? 0));

        $this->command->info('Backfill and flagging complete');
    }
}

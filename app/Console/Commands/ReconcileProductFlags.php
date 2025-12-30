<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReconcileProductFlags extends Command
{
    protected $signature = 'product:reconcile-flags';
    protected $description = 'Reconcile and backfill product_type and computed product flags (featured, popular, new)';

    public function handle(): int
    {
        $this->info('Starting product reconciliation...');

        $this->info('Backfilling product_type from categories...');
        DB::statement("UPDATE products p SET product_type = c.slug FROM categories c WHERE p.category_id = c.id AND (p.product_type IS NULL OR p.product_type = '')");
        DB::statement("UPDATE products SET product_type = 'other' WHERE product_type IS NULL OR product_type = ''");

        $this->info('Normalizing flag NULLs...');
        DB::statement("UPDATE products SET is_featured = false WHERE is_featured IS NULL");
        DB::statement("UPDATE products SET is_popular = false WHERE is_popular IS NULL");
        DB::statement("UPDATE products SET is_new = false WHERE is_new IS NULL");

        $this->info('Setting flags using heuristics...');
        DB::statement("UPDATE products SET is_featured = (release_date IS NOT NULL AND release_date >= now() - interval '365 days')");

        DB::statement("UPDATE products SET is_popular = sub.pop FROM (SELECT p.id AS pid, (EXISTS (SELECT 1 FROM product_variants v JOIN stock_levels s ON v.id = s.variant_id WHERE v.product_id = p.id AND s.qty_available > 10)) AS pop FROM products p) AS sub WHERE products.id = sub.pid");

        DB::statement("UPDATE products SET is_new = (created_at IS NOT NULL AND created_at >= now() - interval '90 days')");

        $featured = DB::select("SELECT count(*) AS cnt FROM products WHERE is_featured = true");
        $popular = DB::select("SELECT count(*) AS cnt FROM products WHERE is_popular = true");
        $new = DB::select("SELECT count(*) AS cnt FROM products WHERE is_new = true");

        $this->info('Featured: ' . ($featured[0]->cnt ?? 0));
        $this->info('Popular: ' . ($popular[0]->cnt ?? 0));
        $this->info('New: ' . ($new[0]->cnt ?? 0));

        $this->info('Product reconciliation complete.');
        return 0;
    }
}

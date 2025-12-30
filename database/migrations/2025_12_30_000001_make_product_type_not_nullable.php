<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Backfill missing product_type from categories
        DB::statement("UPDATE products p SET product_type = c.slug FROM categories c WHERE p.category_id = c.id AND (p.product_type IS NULL OR p.product_type = '')");

        // Any remaining empty values -> 'other'
        DB::statement("UPDATE products SET product_type = 'other' WHERE product_type IS NULL OR product_type = ''");

        // Make column NOT NULL using raw SQL (avoids requiring doctrine/dbal)
        DB::statement("ALTER TABLE products ALTER COLUMN product_type SET NOT NULL");

        // Ensure index exists (Postgres supports IF NOT EXISTS)
        DB::statement("CREATE INDEX IF NOT EXISTS products_product_type_index ON products (product_type)");
    }

    public function down(): void
    {
        // Remove NOT NULL constraint
        DB::statement("ALTER TABLE products ALTER COLUMN product_type DROP NOT NULL");

        // We do not revert data changes
        DB::statement("DROP INDEX IF EXISTS products_product_type_index");
    }
};

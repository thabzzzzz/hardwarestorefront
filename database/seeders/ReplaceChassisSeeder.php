<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class ReplaceChassisSeeder extends Seeder
{
    public function run(): void
    {
        DB::beginTransaction();
        try {
            $category = DB::table('categories')->where('slug', 'cases')->first();
            $categoryId = $category->id ?? null;

            // Delete any existing product with same slug
            DB::table('products')->where('slug', 'nzxt-h5-mini-itx-case')->delete();

            $productId = (string) Str::uuid();
            DB::table('products')->insert([
                'id' => $productId,
                'slug' => 'nzxt-h5-mini-itx-case',
                'name' => 'NZXT H5 Mini-ITX Case',
                'brand' => 'NZXT',
                'vendor_id' => null,
                'category_id' => $categoryId,
                'model_number' => null,
                'release_date' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            $variantId = (string) Str::uuid();
            $sku = 'NZXT-' . strtoupper(substr($variantId,0,6));
            DB::table('product_variants')->insert([
                'id' => $variantId,
                'product_id' => $productId,
                'sku' => $sku,
                'title' => 'NZXT H5 Mini-ITX Case',
                'specs' => json_encode(['formFactor' => 'Mini-ITX']),
                'attributes_normalized' => json_encode([]),
                'is_active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            DB::table('prices')->insert([
                'variant_id' => $variantId,
                'currency' => 'ZAR',
                'amount_cents' => 229900,
                'price_type' => 'retail',
                'valid_from' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            DB::table('stock_levels')->insert([
                'variant_id' => $variantId,
                'qty_available' => 12,
                'qty_reserved' => 0,
                'warehouse' => 'default',
                'status' => 'in_stock',
                'updated_at' => Carbon::now(),
            ]);

            // point to generated thumbnail in public folder
            $imagePath = '/images/products/prod-0001/1ed6bb69-thumb.webp';
            DB::table('images')->insert([
                'product_id' => $productId,
                'variant_id' => $variantId,
                'role' => 'thumbnail',
                'path' => $imagePath,
                'width' => 220,
                'height' => 140,
                'alt' => 'NZXT H5 thumb',
                'sort_order' => 0,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            DB::commit();
            $this->command->info('Inserted chassis product into DB.');
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command->error('Seeder failed: ' . $e->getMessage());
            throw $e;
        }
    }
}

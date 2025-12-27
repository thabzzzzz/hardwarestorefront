<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class ReplaceGpusSeeder extends Seeder
{
    public function run(): void
    {
        DB::beginTransaction();
        try {
            $category = DB::table('categories')->where('slug', 'gpus')->first();
            $categoryId = $category->id ?? 1;

            // Remove existing products in the GPUs category
            DB::table('products')->where('category_id', $categoryId)->delete();

            // Mapping derived from frontend images
            $mappings = [
                [
                    'slug' => 'palit-geforce-rtx-5070-ti-gamingpro-s-ne7507t019t2-gb2031u-9',
                    'title' => 'Palit GeForce RTX 5070 Ti GamingPro S',
                    'brand' => 'Palit',
                    'thumb' => '797c8ab0-thumb.webp'
                ],
                [
                    'slug' => 'r9060xtgaming-oc-16gd-candb-gigabyte',
                    'title' => 'R9060XT Gaming OC 16GD',
                    'brand' => 'Gigabyte',
                    'thumb' => '3a7e70c5-thumb.webp'
                ],
                [
                    'slug' => 'rtx3050-stormx-6gb-7-palit',
                    'title' => 'RTX3050 StormX 6GB',
                    'brand' => 'Palit',
                    'thumb' => '58e4335d-thumb.webp'
                ],
                [
                    'slug' => 'rx-97tmargb9-4-xfx',
                    'title' => 'RX-97T MARGB 9-4',
                    'brand' => 'XFX',
                    'thumb' => '595038a3-thumb.webp'
                ],
                [
                    'slug' => 'xfx-7600-swft210-card-box',
                    'title' => 'XFX 7600 SWFT210',
                    'brand' => 'XFX',
                    'thumb' => '1f7827bc-thumb.webp'
                ],
            ];

            foreach ($mappings as $map) {
                $productId = (string) Str::uuid();
                DB::table('products')->insert([
                    'id' => $productId,
                    'slug' => $map['slug'],
                    'name' => $map['title'],
                    'brand' => $map['brand'],
                    'vendor_id' => null,
                    'category_id' => $categoryId,
                    'model_number' => null,
                    'release_date' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

                $variantId = (string) Str::uuid();
                $sku = strtoupper(substr(preg_replace('/[^A-Z0-9]+/','', $map['slug']),0,8)) . '-' . strtoupper(substr($variantId,0,6));
                DB::table('product_variants')->insert([
                    'id' => $variantId,
                    'product_id' => $productId,
                    'sku' => $sku,
                    'title' => $map['title'],
                    'specs' => json_encode([]),
                    'attributes_normalized' => json_encode([]),
                    'is_active' => true,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

                // simple price and stock
                $priceCents = rand(300000, 1200000);
                DB::table('prices')->insert([
                    'variant_id' => $variantId,
                    'currency' => 'ZAR',
                    'amount_cents' => $priceCents,
                    'price_type' => 'retail',
                    'valid_from' => Carbon::now(),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

                DB::table('stock_levels')->insert([
                    'variant_id' => $variantId,
                    'qty_available' => rand(5,40),
                    'qty_reserved' => 0,
                    'warehouse' => 'default',
                    'status' => 'in_stock',
                    'updated_at' => Carbon::now(),
                ]);

                // Add thumbnail image record pointing to public/images/products/<slug>/<thumb>
                $imagePath = '/images/products/' . $map['slug'] . '/' . $map['thumb'];
                DB::table('images')->insert([
                    'product_id' => $productId,
                    'variant_id' => $variantId,
                    'role' => 'thumbnail',
                    'path' => $imagePath,
                    'width' => 220,
                    'height' => 140,
                    'alt' => $map['title'],
                    'sort_order' => 0,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }

            DB::commit();
            $this->command->info('Replaced GPU products with images from unsortedProducts.');
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command->error('Seeder failed: ' . $e->getMessage());
            throw $e;
        }
    }
}

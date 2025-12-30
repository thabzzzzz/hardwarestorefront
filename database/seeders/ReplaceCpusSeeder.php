<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class ReplaceCpusSeeder extends Seeder
{
    public function run(): void
    {
        DB::beginTransaction();
        try {
            // Ensure CPUs category exists
            $category = DB::table('categories')->where('slug', 'cpus')->first();
            if (! $category) {
                $catId = DB::table('categories')->insertGetId([
                    'name' => 'CPUs',
                    'slug' => 'cpus',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            } else {
                $catId = $category->id;
            }

            // Remove existing products in the CPUs category
            DB::table('products')->where('category_id', $catId)->delete();

            $unsortedDir = base_path('frontend/public/images/unsortedProducts/cpus');

            // load generated manifest if available to resolve thumbnails
            $manifest = [];
            $manifestPath = base_path('frontend/public/images/products/manifest.json');
            if (file_exists($manifestPath)) {
                $j = @file_get_contents($manifestPath);
                $manifest = $j ? json_decode($j, true) : [];
            }
            if (! is_dir($unsortedDir)) {
                $this->command->error('Unsorted CPU folder not found: ' . $unsortedDir);
                DB::rollBack();
                return;
            }

            $files = array_values(array_filter(scandir($unsortedDir), function ($f) {
                return ! in_array($f, ['.', '..']);
            }));

            foreach ($files as $file) {
                $ext = pathinfo($file, PATHINFO_EXTENSION);
                $nameOnly = pathinfo($file, PATHINFO_FILENAME);
                // create slug: normalize filename (replace spaces/_ with -, remove non-alnum except -)
                $slug = Str::slug($nameOnly, '-');

                // humanize title
                $title = trim(preg_replace('/[-_]+/', ' ', $nameOnly));
                $title = ucwords(strtolower($title));

                // detect manufacturer
                $manufacturer = null;
                $lc = strtolower($nameOnly);
                if (str_contains($lc, 'amd') || str_contains($lc, 'ryzen')) $manufacturer = 'AMD';
                if (str_contains($lc, 'intel')) $manufacturer = 'Intel';

                $productId = (string) Str::uuid();
                DB::table('products')->insert([
                    'id' => $productId,
                    'slug' => $slug,
                    'name' => $title,
                    'brand' => null,
                    'manufacturer' => $manufacturer,
                    'vendor_id' => null,
                    'category_id' => $catId,
                    'model_number' => null,
                    'release_date' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

                $variantId = (string) Str::uuid();
                $sku = strtoupper(substr(preg_replace('/[^A-Z0-9]+/', '', $slug), 0, 8)) . '-' . strtoupper(substr($variantId, 0, 6));
                DB::table('product_variants')->insert([
                    'id' => $variantId,
                    'product_id' => $productId,
                    'sku' => $sku,
                    'title' => $title,
                    'specs' => json_encode([]),
                    'attributes_normalized' => json_encode([]),
                    'is_active' => true,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

                // seed a price and stock
                $priceCents = rand(20000, 60000) * 10; // rough CPU range in cents
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
                    'qty_available' => rand(5, 40),
                    'qty_reserved' => 0,
                    'warehouse' => 'default',
                    'status' => 'in_stock',
                    'updated_at' => Carbon::now(),
                ]);

                // resolve thumbnail from manifest when present
                $imagePath = '/images/unsortedProducts/cpus/' . $file;
                $width = null;
                $height = null;
                if (!empty($manifest[$slug]) && is_array($manifest[$slug])) {
                    $entry = $manifest[$slug];
                    $thumb = null;
                    if (!empty($entry['images']) && is_array($entry['images'])) {
                        foreach ($entry['images'] as $img) {
                            if (!empty($img['variant']) && $img['variant'] === 'thumb') {
                                $thumb = $img;
                                break;
                            }
                        }
                        if (!$thumb) {
                            $thumb = $entry['images'][0];
                        }
                    }
                    if (!empty($thumb['url'])) {
                        $imagePath = $thumb['url'];
                        $width = $thumb['width'] ?? $width;
                        $height = $thumb['height'] ?? $height;
                    }
                }

                DB::table('images')->insert([
                    'product_id' => $productId,
                    'variant_id' => $variantId,
                    'role' => 'thumbnail',
                    'path' => $imagePath,
                    'width' => $width,
                    'height' => $height,
                    'alt' => $title,
                    'sort_order' => 0,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }

            DB::commit();
            $this->command->info('Inserted CPU products from unsortedProducts/cpus (count: ' . count($files) . ')');
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command->error('Seeder failed: ' . $e->getMessage());
            throw $e;
        }
    }
}

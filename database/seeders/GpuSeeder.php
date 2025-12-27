<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class GpuSeeder extends Seeder
{
    public function run(): void
    {
        $vendorId = DB::table('vendors')->insertGetId(['name' => 'ExampleVendor', 'slug' => 'examplevendor', 'created_at' => now(), 'updated_at' => now()]);
        $categoryId = DB::table('categories')->insertGetId(['name' => 'GPUs', 'slug' => 'gpus', 'created_at' => now(), 'updated_at' => now()]);

        $products = [
            [
                'name' => 'Gigabyte Radeon RX 9060 XT 16GB',
                'brand' => 'Gigabyte',
                'slug' => 'gigabyte-rx-9060-16gb',
                'model_number' => 'GV-R9060XT-16GD',
            ],
            [
                'name' => 'Nvidia GeForce RTX 4060 8GB',
                'brand' => 'Nvidia',
                'slug' => 'nvidia-rtx-4060-8gb',
                'model_number' => 'RTX-4060-8GB',
            ],
            [
                'name' => 'AMD Radeon RX 7600 8GB',
                'brand' => 'AMD',
                'slug' => 'amd-rx-7600-8gb',
                'model_number' => 'RX-7600-8GB',
            ],
            [
                'name' => 'ASUS TUF Gaming RTX 4070 12GB',
                'brand' => 'ASUS',
                'slug' => 'asus-tuf-rtx-4070-12gb',
                'model_number' => 'TUF-RTX4070-12G',
            ],
            [
                'name' => 'MSI Ventus RTX 4060 Ti 8GB',
                'brand' => 'MSI',
                'slug' => 'msi-ventus-4060ti-8gb',
                'model_number' => 'VENTUS-4060TI-8G',
            ],
            // existing chassis sample
            [
                'name' => 'Example PC Chassis',
                'brand' => 'CaseBrand',
                'slug' => 'example-pc-chassis',
                'model_number' => 'CHS-001',
            ],
        ];

        foreach ($products as $p) {
            $productId = (string) Str::uuid();
            DB::table('products')->insert([
                'id' => $productId,
                'slug' => $p['slug'],
                'name' => $p['name'],
                'brand' => $p['brand'],
                'vendor_id' => $vendorId,
                'category_id' => $categoryId,
                'model_number' => $p['model_number'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // create a sample variant
            $variantId = (string) Str::uuid();
            DB::table('product_variants')->insert([
                'id' => $variantId,
                'product_id' => $productId,
                'sku' => strtoupper(substr($p['slug'],0,3)) . '-' . substr($variantId,0,8),
                'title' => $p['name'],
                'specs' => json_encode([
                    'memory_size_gb' => rand(8,16),
                    'memory_type' => 'GDDR6',
                    'bus_width' => 128,
                    'core_clock_mhz' => rand(1500,2500),
                ]),
                'attributes_normalized' => json_encode([]),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // price in ZAR cents
            DB::table('prices')->insert([
                'variant_id' => $variantId,
                'currency' => 'ZAR',
                'amount_cents' => rand(300000,1200000),
                'price_type' => 'retail',
                'valid_from' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // stock
            DB::table('stock_levels')->insert([
                'variant_id' => $variantId,
                'qty_available' => rand(0,25),
                'qty_reserved' => 0,
                'warehouse' => 'main',
                'status' => 'in_stock',
                'updated_at' => now(),
            ]);

            // images (use placeholder paths)
            DB::table('images')->insert([
                ['product_id' => $productId, 'variant_id' => $variantId, 'role' => 'thumbnail', 'path' => '/images/placeholder.png', 'sort_order' => 0, 'created_at' => now(), 'updated_at' => now()],
                ['product_id' => $productId, 'variant_id' => $variantId, 'role' => 'gallery', 'path' => '/images/placeholder-1.png', 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }
}

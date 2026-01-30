<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Price;
use App\Models\Image;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;


class ImportNeweggCsv extends Command
{
    protected $signature = 'import:newegg {file=tmp/newegg_products.csv} {--force : Skip import lock check}';
    protected $description = 'Import Newegg CSV produced by tools/newegg_crawl.cjs';

    public function handle()
    {
        $file = base_path($this->argument('file'));
        if (!file_exists($file)) {
            $this->error('File not found: '.$file);
            return 1;
        }

        $fh = fopen($file, 'r');
        $header = fgetcsv($fh);
        $map = array_flip($header ?: []);

        // Use cache lock to prevent concurrent imports
        $lock = Cache::lock('import:newegg', 1200);
        if (!$this->option('force')) {
            if (!$lock->get()) {
                $this->error('Another import is already running.');
                return 1;
            }
        }

        DB::beginTransaction();
        try {
            $count = 0;
            $rate = $this->getUsdToZarRate();
            while (($row = fgetcsv($fh)) !== false) {
                // handle rows where CSV parsing produced a different column count
                if (count($row) !== count($header)) {
                    if (count($row) > count($header)) {
                        $lastIndex = count($header) - 1;
                        $prefix = array_slice($row, 0, $lastIndex);
                        $merged = array_slice($row, $lastIndex);
                        $row = $prefix;
                        $row[$lastIndex] = implode(',', $merged);
                    } else {
                        // pad short rows with empty strings
                        $row = array_pad($row, count($header), '');
                    }
                }
                $r = array_combine($header, $row);
                $sku = $r['sku'] ?? null;
                if (!$sku && empty($r['mpn'])) continue;

                // extract source_variant_id from URL if possible
                $sourceVariantId = $this->extractSourceIdFromUrl($r['source_url'] ?? '');

                // find existing variant: prefer mpn, then source_variant_id, then sku
                $variant = null;
                if (!empty($r['mpn'])) {
                    $variant = ProductVariant::where('mpn', $r['mpn'])->first();
                }
                if (!$variant && $sourceVariantId) {
                    $variant = ProductVariant::where('source_variant_id', $sourceVariantId)->first();
                }
                if (!$variant && $sku) {
                    $variant = ProductVariant::where('sku', $sku)->first();
                }

                // category normalization
                $categoryId = null;
                if (!empty($r['category'])) {
                    $catName = trim($r['category']);
                    $category = Category::firstOrCreate(['name' => $catName], ['slug' => Str::slug($catName)]);
                    $categoryId = $category->id;
                }

                if (!$variant) {
                    // create product
                    $productId = (string) Str::uuid();
                    $slug = Str::slug(substr($r['name'] ?? $sku ?? ($r['mpn'] ?? ''),0,80));
                    $i = 0;
                    $baseSlug = $slug;
                    while (Product::where('slug', $slug)->exists()) {
                        $i++; $slug = $baseSlug.'-'.$i;
                    }
                    $product = Product::create([
                        'id' => $productId,
                        'slug' => $slug,
                        'name' => $r['name'] ?? ($r['mpn'] ?? $sku),
                        'brand' => $r['brand'] ?? null,
                        'manufacturer' => $r['brand'] ?? null,
                        'model_number' => $r['mpn'] ?? null,
                        'category_id' => $categoryId,
                    ]);

                    $variant = ProductVariant::create([
                        'id' => (string) Str::uuid(),
                        'product_id' => $product->id,
                        'sku' => $sku,
                        'title' => $r['name'] ?? null,
                        'specs' => null,
                        'attributes_normalized' => null,
                        'mpn' => $r['mpn'] ?? null,
                        'source_variant_id' => $sourceVariantId,
                    ]);
                }

                // update scraped fields safely
                $variant->mpn = $r['mpn'] ?? $variant->mpn;
                $variant->source_name = $r['source_name'] ?? ($variant->source_name ?? 'newegg.com');
                $variant->source_url = $r['source_url'] ?? $variant->source_url;
                $variant->source_variant_id = $variant->source_variant_id ?? $sourceVariantId;
                $variant->scraped_at = $r['scraped_at'] ? date('Y-m-d H:i:s', strtotime($r['scraped_at'])) : $variant->scraped_at;

                // raw jsonld: validate and store as string, truncate if too long
                if (!empty($r['raw_jsonld'])) {
                    $raw = $r['raw_jsonld'];
                    if ($this->isJson($raw)) {
                        $variant->raw_jsonld = $raw;
                    } else {
                        // try to salvage by stripping control chars
                        $variant->raw_jsonld = substr(preg_replace('/[\x00-\x1F\x7F]/u', ' ', $raw), 0, 65500);
                    }
                }

                // spec tables
                if (!empty($r['raw_spec_tables'])) {
                    $decoded = json_decode($r['raw_spec_tables'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $variant->raw_spec_tables = $decoded;
                    } else {
                        $variant->raw_spec_tables = null;
                    }
                }

                // image urls
                if (!empty($r['image_urls'])) {
                    $imgs = json_decode($r['image_urls'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($imgs)) {
                        $variant->image_urls = $imgs;
                    } else {
                        $variant->image_urls = [$r['image_urls']];
                    }
                }

                // normalized textual fields
                $variant->vram_gb = $this->normalizeVram($r['vram_gb'] ?? $r['memory'] ?? null);
                $variant->vram_type = $r['vram_type'] ?? null;
                $variant->bus_width_bit = $r['bus_width_bit'] ?? null;
                $variant->boost_clock_ghz = $r['boost_clock_ghz'] ?? null;
                $variant->tdp_watts = $r['tdp_watts'] ?? null;
                $variant->cores = $r['cores'] ?? null;
                $variant->threads = $r['threads'] ?? null;

                // normalized numeric fields
                $variant->vram_gb_int = $this->parseInteger($variant->vram_gb);
                $variant->bus_width_int = $this->parseInteger($variant->bus_width_bit);
                $variant->boost_clock_mhz = $this->parseClockToMhz($variant->boost_clock_ghz);
                $variant->tdp_watts_int = $this->parseInteger($variant->tdp_watts);
                $variant->cores_int = $this->parseInteger($variant->cores);
                $variant->threads_int = $this->parseInteger($variant->threads);

                $variant->save();

                // price extraction + convert to ZAR
                if (!empty($r['price_raw'])) {
                    $numbers = $this->extractNumbersFromPrice($r['price_raw']);
                    if (!empty($numbers)) {
                        $usd = floatval($numbers[0]);
                        $zarRate = $rate ?: 18.0;
                        $amountZar = (int) round($usd * $zarRate * 100);
                        Price::create([
                            'variant_id' => $variant->id,
                            'currency' => 'ZAR',
                            'amount_cents' => $amountZar,
                            'price_type' => 'retail',
                            'valid_from' => now(),
                        ]);
                    }
                }

                // images: create image records for first 3 urls
                if (!empty($variant->image_urls) && is_array($variant->image_urls)) {
                    $i = 0;
                    foreach ($variant->image_urls as $img) {
                        if ($i++>2) break;
                        Image::firstOrCreate([
                            'product_id' => $variant->product_id,
                            'variant_id' => $variant->id,
                            'path' => $img,
                        ]);
                    }
                }

                $count++;
            }

            DB::commit();
            $lock->release();
            $this->info("Imported/updated {$count} variants from {$file}");
            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $lock->release();
            $this->error('Import failed: '.$e->getMessage());
            return 1;
        } finally {
            fclose($fh);
        }
    }

    protected function extractSourceIdFromUrl($url)
    {
        if (empty($url)) return null;
        $parts = parse_url($url);
        if (!empty($parts['query'])) {
            parse_str($parts['query'], $q);
            if (!empty($q['Item'])) return $q['Item'];
            if (!empty($q['item'])) return $q['item'];
        }
        // fallback: last path segment
        if (!empty($parts['path'])) {
            $seg = basename($parts['path']);
            if ($seg) return $seg;
        }
        return null;
    }

    protected function isJson($string)
    {
        if (!is_string($string)) return false;
        json_decode($string);
        return (json_last_error() === JSON_ERROR_NONE);
    }

    protected function normalizeVram($s)
    {
        if (empty($s)) return null;
        return preg_replace('/\s+/', '', $s);
    }

    protected function parseInteger($s)
    {
        if (empty($s)) return null;
        if (is_numeric($s)) return (int)$s;
        if (preg_match('/(\d+)/', $s, $m)) return (int)$m[1];
        return null;
    }

    protected function parseClockToMhz($s)
    {
        if (empty($s)) return null;
        // accept GHz or MHz
        if (preg_match('/([0-9\.]+)\s*ghz/i', $s, $m)) {
            return (int) round(floatval($m[1]) * 1000);
        }
        if (preg_match('/([0-9\.]+)\s*mhz/i', $s, $m)) {
            return (int) round(floatval($m[1]));
        }
        // plain number assume MHz
        if (preg_match('/(\d+)/', $s, $m)) return (int)$m[1];
        return null;
    }

    protected function extractNumbersFromPrice($s)
    {
        if (empty($s)) return [];
        // find numbers like 1,299.99 or 1299.99
        preg_match_all('/(\d{1,3}(?:[\,\s]\d{3})*(?:\.\d+)?|\d+\.\d+|\d+)/', $s, $m);
        if (empty($m[0])) return [];
        // normalize commas
        $out = [];
        foreach ($m[0] as $num) {
            $n = str_replace([',',' '],'',$num);
            $out[] = floatval($n);
        }
        return $out;
    }

    protected function getUsdToZarRate()
    {
        // try public exchangerate.host then fallback to env or 18.0
        try {
            $json = @file_get_contents('https://api.exchangerate.host/latest?base=USD&symbols=ZAR');
            if ($json) {
                $d = json_decode($json, true);
                if (!empty($d['rates']['ZAR'])) return floatval($d['rates']['ZAR']);
            }
        } catch (\Throwable $e) {}
        $env = env('USD_TO_ZAR');
        if ($env) return floatval($env);
        return 18.0;
    }
}

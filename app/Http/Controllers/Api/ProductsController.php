<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductsController extends Controller
{
    /**
     * Generic products index supporting filters: category_slug, type, q, page, per_page
     */
    public function index(Request $request)
    {
        $perPage = max(1, (int) $request->query('per_page', 12));

        // Resolve category slug preference: route default > query param > type
        $categorySlug = $request->route('category_slug') ?? $request->query('category_slug') ?? $request->query('type');

        $categoryId = null;
        if ($categorySlug) {
            $categoryId = Category::where('slug', $categorySlug)->value('id');
        }

        $query = ProductVariant::with(['product.vendor', 'product.boardPartner', 'images', 'stock', 'prices'])
            ->where('is_active', true);

        if ($categoryId) {
            $query->whereHas('product', function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            });
        } else {
            // optional: allow type-based filtering via product_type (denormalized)
            if ($type = $request->query('type')) {
                $query->whereHas('product', function ($q) use ($type) {
                    $q->where('product_type', $type)->orWhere('slug', $type);
                });
            }
        }

        if ($q = $request->query('q')) {
            $query->where(function ($b) use ($q) {
                $b->where('title', 'ilike', "%{$q}%")
                    ->orWhere('sku', 'ilike', "%{$q}%");
            });
        }

        // support simple tag/flag filters
        if ($tag = $request->query('tag')) {
            $query->whereHas('product', function ($p) use ($tag) {
                $p->whereRaw("(tags::text ILIKE ?)", ["%{$tag}%"]);
            });
        }

        // flags: featured, popular, new
        if ($request->filled('featured')) {
            $query->whereHas('product', function ($p) {
                $p->where('is_featured', true);
            });
        }

        if ($request->filled('popular')) {
            $query->whereHas('product', function ($p) {
                $p->where('is_popular', true);
            });
        }

        if ($request->filled('new')) {
            $query->whereHas('product', function ($p) {
                $p->where('is_new', true);
            });
        }

        // Sorting: support `sort=date` with `order=asc|desc` to order by product.release_date
        $sort = $request->query('sort');
        $order = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
        if ($sort === 'date') {
            // join products so we can order by the product's release_date safely while still
            // selecting product_variants for pagination/hydration.
            $query->leftJoin('products', 'product_variants.product_id', '=', 'products.id')
                ->select('product_variants.*')
                // put null release_date values last, then order by the date
                ->orderByRaw("products.release_date IS NULL, products.release_date {$order}");
        } elseif ($sort === 'price') {
            // Order by the latest price for each variant using a correlated subquery
            // ensure we select base fields first so headers don't get clobbered
            if (is_null($query->getQuery()->columns)) {
                $query->select('product_variants.*');
            }
            $query->selectSub(function ($q) {
                $q->from('prices')
                    ->select('amount_cents')
                    ->whereColumn('prices.variant_id', 'product_variants.id')
                    ->orderByDesc('valid_from')
                    ->limit(1);
            }, 'sort_price');
            $query->orderBy('sort_price', $order);
        }

        // Compute global min/max price for the current filtered set (before applying price_min/price_max)
        $variantIdsForMeta = (clone $query)->pluck('product_variants.id')->toArray();
        $metaMin = null;
        $metaMax = null;
        if (!empty($variantIdsForMeta)) {
            $mm = DB::table('prices')
                ->whereIn('variant_id', $variantIdsForMeta)
                ->whereRaw('valid_from = (select max(p2.valid_from) from prices p2 where p2.variant_id = prices.variant_id)')
                ->selectRaw('min(amount_cents) as min_amount, max(amount_cents) as max_amount')
                ->first();

            $metaMin = $mm->min_amount !== null ? (int)$mm->min_amount : null;
            $metaMax = $mm->max_amount !== null ? (int)$mm->max_amount : null;
        }

        // Price range filtering (expects cents): price_min, price_max
        $priceMin = $request->query('price_min');
        $priceMax = $request->query('price_max');
        if ($priceMin !== null || $priceMax !== null) {
            $min = is_numeric($priceMin) ? (int)$priceMin : 0;
            $max = is_numeric($priceMax) ? (int)$priceMax : PHP_INT_MAX;

            // Filter by the latest price entry per variant. Use EXISTS with a correlated subquery
            // that selects the latest `prices.valid_from` row for the variant and checks amount_cents.
            $query->whereRaw(
                "exists (select 1 from prices p where p.variant_id = product_variants.id and p.valid_from = (select max(p2.valid_from) from prices p2 where p2.variant_id = p.variant_id) and p.amount_cents >= ? and p.amount_cents <= ?)",
                [$min, $max]
            );
        }

        // Manufacturer Filter (canonicalized)
        if ($manufacturers = $request->query('manufacturer')) {
            $manufacturers = is_array($manufacturers) ? $manufacturers : explode(',', $manufacturers);
            $query->whereHas('product', function ($q) use ($manufacturers) {
                $q->where(function ($sub) use ($manufacturers) {
                    foreach ($manufacturers as $man) {
                        $man = strtoupper(trim($man));
                        $sub->orWhere(function ($s) use ($man) {
                            if ($man === 'AMD') {
                                $s->where('manufacturer', 'ilike', '%amd%')
                                    ->orWhere('name', 'ilike', '%amd%')
                                    ->orWhere('name', 'ilike', '%ryzen%')
                                    ->orWhere('name', 'ilike', '%threadripper%')
                                    ->orWhere('name', 'ilike', '%radeon%')
                                    ->orWhereRaw("name ~* '\\brx\\b'");
                            } elseif ($man === 'INTEL') {
                                $s->where('manufacturer', 'ilike', '%intel%')
                                    ->orWhere('name', 'ilike', '%intel%')
                                    ->orWhere('name', 'ilike', '%core%');
                            } elseif ($man === 'NVIDIA') {
                                $s->where('manufacturer', 'ilike', '%nvidia%')
                                    ->orWhere('name', 'ilike', '%nvidia%')
                                    ->orWhere('name', 'ilike', '%geforce%')
                                    ->orWhere('name', 'ilike', '%rtx%');
                            } else {
                                $s->where('manufacturer', 'ilike', "%{$man}%");
                            }
                        });
                    }
                });
            });
        }

        // Stock Status Filter
        if ($stockStatuses = $request->query('stock_status')) {
            $stockStatuses = is_array($stockStatuses) ? $stockStatuses : explode(',', $stockStatuses);
            $query->whereHas('stock', function ($q) use ($stockStatuses) {
                $q->where(function ($sub) use ($stockStatuses) {
                    // in_stock: available > 0 and not reserved/out_of_stock status
                    if (in_array('in_stock', $stockStatuses)) {
                        $sub->orWhere(function ($s) {
                            $s->where('qty_available', '>', 0)
                                ->where('status', '!=', 'out_of_stock')
                                ->where('status', '!=', 'reserved');
                        });
                    }
                    if (in_array('out_of_stock', $stockStatuses)) {
                        $sub->orWhere(function ($s) {
                            $s->where('status', 'out_of_stock')
                                ->orWhere(function ($s2) {
                                    $s2->where('qty_available', '<=', 0)
                                        ->where('status', '!=', 'reserved');
                                });
                        });
                    }
                    if (in_array('reserved', $stockStatuses)) {
                        $sub->orWhere('status', 'reserved');
                    }
                });
            });
        }

        $page = $query->paginate($perPage);

        $data = $page->through(function ($variant) {
            $price = $variant->prices()->orderByDesc('valid_from')->first();
            $thumbnail = $variant->images()->where('role', 'thumbnail')->first() ?? $variant->product->images()->where('role', 'thumbnail')->first();

            // determine board partner (explicit FK) falling back to vendor/name
            $boardPartnerName = null;
            if (isset($variant->product->boardPartner) && $variant->product->boardPartner) {
                $boardPartnerName = $variant->product->boardPartner->name;
            } elseif (isset($variant->product->vendor) && $variant->product->vendor) {
                $boardPartnerName = $variant->product->vendor->name;
            } else {
                $boardPartnerName = $variant->product->brand;
            }

            // normalize manufacturer/brand for GPUs and CPUs: prefer canonical NVIDIA/AMD/INTEL
            $manufacturer = $variant->product->manufacturer;
            $productType = $variant->product->product_type ?? '';
            if ($productType === 'gpus') {
                $m = strtolower(trim((string)($manufacturer ?? '')));
                $pname = strtolower(trim((string)($variant->product->name ?? '')));
                if (strpos($m, 'nvidia') !== false || strpos($pname, 'nvidia') !== false || strpos($pname, 'geforce') !== false || strpos($pname, 'rtx') !== false) {
                    $manufacturer = 'NVIDIA';
                } elseif (strpos($m, 'amd') !== false || strpos($m, 'radeon') !== false || strpos($pname, 'radeon') !== false || preg_match('/\brx\b/i', $pname)) {
                    $manufacturer = 'AMD';
                } elseif (strpos($m, 'intel') !== false || strpos($pname, 'intel') !== false) {
                    $manufacturer = 'INTEL';
                } else {
                    $manufacturer = strtoupper(trim((string)$manufacturer));
                }
            } elseif ($productType === 'cpus') {
                // CPUs should canonically be either AMD or INTEL in the UI
                $m = strtolower(trim((string)($manufacturer ?? '')));
                $pname = strtolower(trim((string)($variant->product->name ?? '')));
                if (strpos($m, 'intel') !== false || strpos($pname, 'intel') !== false || strpos($pname, 'core i') !== false) {
                    $manufacturer = 'INTEL';
                } elseif (strpos($m, 'amd') !== false || strpos($pname, 'amd') !== false || strpos($pname, 'ryzen') !== false || strpos($pname, 'threadripper') !== false) {
                    $manufacturer = 'AMD';
                } else {
                    $manufacturer = strtoupper(trim((string)$manufacturer));
                }
            }

            $brandField = $productType === 'gpus'
                ? $manufacturer
                : (isset($variant->product->vendor) && $variant->product->vendor ? $variant->product->vendor->name : $variant->product->brand);

            $scrapedThumb = null;
            if (isset($variant->image_urls)) {
                $rawImgs = $variant->image_urls;
                // handle double-encoded json if present or simple array
                if (is_string($rawImgs)) {
                    $json = json_decode($rawImgs, true);
                    if (is_array($json)) $rawImgs = $json;
                }
                if (is_array($rawImgs) && count($rawImgs) > 0) {
                    $candidate = $rawImgs[0];
                    if (is_string($candidate) || is_numeric($candidate)) {
                         $scrapedThumb = trim((string)$candidate, '"');
                    }
                }
            }

            return [
                'variant_id' => $variant->id,
                'product_id' => $variant->product_id,
                'name' => $variant->product->name,
                'brand' => $brandField,
                'board_partner' => $boardPartnerName,
                'manufacturer' => $manufacturer,
                'slug' => $variant->product->slug,
                'sku' => $variant->sku,
                'title' => $variant->title,
                // CPU spec fields (nullable)
                'cores' => $variant->product->cores,
                'boost_clock' => $variant->product->boost_clock,
                'microarchitecture' => $variant->product->microarchitecture,
                'socket' => $variant->product->socket,
                'current_price' => $price ? ['amount_cents' => $price->amount_cents, 'currency' => $price->currency] : null,
                // Fallback: Product clean thumb -> Local thumb -> Scraped thumb
                'thumbnail' => ($variant->product->clean_thumbnail ?? null) ?: ($thumbnail ? $thumbnail->path : $scrapedThumb),
                'short_specs' => array_slice((array)($variant->specs ?? []), 0, 6),
                'stock' => $variant->stock ? ['qty_available' => $variant->stock->qty_available, 'status' => $variant->stock->status] : null,
                'release_date' => $variant->product->release_date ?? null,
            ];
        });

        $resp = array_merge($page->toArray(), ['data' => $data->items()]);
        // attach price metadata when available
        $resp['meta'] = array_merge($resp['meta'] ?? [], [
            'price_min' => $metaMin,
            'price_max' => $metaMax,
        ]);

        return response()->json($resp);
    }
}

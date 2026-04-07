<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PcBuild;
use App\Models\PcBuildComponent;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\Auth;

class PcBuildController extends Controller
{
    public function index()
    {
        $builds = PcBuild::where("user_id", Auth::id())
            ->withCount("components")
            ->with(["components.variant.prices"])
            ->orderBy("updated_at", "desc")
            ->get()
            ->map(function ($build) {
                $totalCents = 0;
                foreach ($build->components as $comp) {
                    if ($comp->variant && $comp->variant->prices->isNotEmpty()) {
                        $latestPrice = $comp->variant->prices->sortByDesc('valid_from')->first();
                        if ($latestPrice) {
                            $totalCents += $latestPrice->amount_cents * $comp->quantity;
                        }
                    }
                }

                $data = $build->toArray();
                unset($data['components']);
                $data['total_price_cents'] = $totalCents;

                return $data;
            });

        return response()->json(["data" => $builds]);
    }

    public function show(string $token)
    {
        $build = PcBuild::where("share_token", $token)
            ->with(["components.variant.product.images", "components.variant.images", "components.variant.prices", "user"])
            ->firstOrFail();

        $components = [];
        foreach ($build->components as $comp) {
            $variant = $comp->variant;
            if ($variant && $variant->product) {
                $product = $variant->product;
                $price = $variant->prices()->orderByDesc('valid_from')->first();

                $thumbnailModel = $variant->images()->where('role', 'thumbnail')->first() ?? $variant->product->images()->where('role', 'thumbnail')->first() ?? $variant->images()->first();
                $scrapedThumb = $variant->images()->where('role', 'scraped')->first() ?? $variant->product->images()->where('role', 'scraped')->first();
                $scrapedThumbPath = $scrapedThumb ? $scrapedThumb->path : null;

                $components[$comp->category] = [
                    "variant_id" => $variant->id,
                    "product_id" => $product->id,
                    "slug" => $variant->slug ?: $product->slug,
                    "title" => $variant->name ?: $product->name,
                    "brand" => $product->brand,
                    "current_price" => $price ? [
                        "amount_cents" => (int) $price->amount_cents,
                        "currency" => "ZAR"
                    ] : null,
                    "thumbnail" => ($variant->product->clean_thumbnail ?? null) ?: ($thumbnailModel ? $thumbnailModel->path : $scrapedThumbPath),
                    "normalized_specs" => $variant->normalized_specs,
                    "stock" => [
                        "status" => $variant->stock_status,
                        "qty_available" => (int) $variant->stock_qty
                    ],
                ];
            }
        }

        return response()->json([
            "id" => $build->id,
            "share_token" => $build->share_token,
            "name" => $build->name,
            "user_id" => $build->user_id,
            "target_budget" => $build->target_budget,
            "author_name" => $build->user ? $build->user->name : "Anonymous",
            "components" => $components,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            "name" => "required|string|max:255",
            "components" => "array",
            "share_token" => "nullable|string",
            "save_as_new" => "boolean",
            "target_budget" => "nullable|integer"
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(["message" => "Unauthorized"], 401);
        }

        $shareToken = $request->input("share_token");
        $saveAsNew = $request->input("save_as_new", false);
        $build = null;

        if ($shareToken && !$saveAsNew) {
            $build = PcBuild::where("share_token", $shareToken)->first();

            if ($build && $build->user_id !== $user->id) {
                $build = new PcBuild();
                $build->user_id = $user->id;
            } else if (!$build) {
                $build = new PcBuild();
                $build->user_id = $user->id;
            }
        } else {
            $build = new PcBuild();
            $build->user_id = $user->id;
        }

        $build->name = $request->input("name");
        $build->target_budget = $request->input("target_budget");
        $build->save();

        if ($build->id) {
            PcBuildComponent::where("pc_build_id", $build->id)->delete();
        }

        $components = $request->input("components", []);
        foreach ($components as $category => $variant_id) {
            if ($variant_id) {
                PcBuildComponent::create([
                    "pc_build_id" => $build->id,
                    "category" => $category,
                    "product_variant_id" => $variant_id,
                    "quantity" => 1
                ]);
            }
        }

        return response()->json([
            "message" => "Build saved successfully",
            "share_token" => $build->share_token,
            "name" => $build->name
        ]);
    }

    public function destroy(string $id)
    {
        $build = PcBuild::where("id", $id)->where("user_id", Auth::id())->firstOrFail();
        $build->delete();
        return response()->json(["message" => "PC Build successfully deleted"]);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'slug',
        'name',
        'brand',
        'manufacturer',
        'vendor_id',
        'category_id',
        'model_number',
        'release_date',
        'product_type',
        'cores',
        'boost_clock',
        'microarchitecture',
        'socket',
        'is_featured',
        'board_partner_id',
        'is_new',
    ];

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(Image::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function boardPartner()
    {
        return $this->belongsTo(Vendor::class, 'board_partner_id');
    }

    /**
     * Return a cleaned thumbnail URL derived from images or stored fields.
     * This normalizes common messy shapes produced by scrapers (quoted arrays,
     * escaped slashes, comma lists) and returns a single URL string or null.
     */
    public function getCleanThumbnailAttribute()
    {
        // try primary image relation first
        $image = $this->images()->orderBy('sort_order')->first();
        $thumb = $image ? $image->path : null;

        // also check common stored fields if relation is absent
        if (! $thumb && isset($this->thumbnail)) {
            $thumb = $this->thumbnail;
        }

        if (! $thumb) return null;

        $t = trim((string) $thumb);
        // unescape common escaped slashes
        $t = str_replace('\\/', '/', $t);

        // strip matching surrounding brackets/quotes repeatedly
        while ((substr($t, 0, 1) === '[' && substr($t, -1) === ']') || (substr($t, 0, 1) === '"' && substr($t, -1) === '"')) {
            $t = trim(substr($t, 1, -1));
        }

        // find first http(s) image URL (jpg/png/webp/gif)
        if (preg_match('/https?:\\/\\/[^"\'\s,]+?\\.(?:jpg|jpeg|png|webp|gif)/i', $t, $m)) {
            return $m[0];
        }

        // try a more permissive match per comma-separated parts
        $parts = array_filter(array_map('trim', explode(',', $t)));
        foreach ($parts as $p) {
            if (preg_match('/https?:\\/\\/[^\\s"\']+/i', $p, $mm)) {
                return $mm[0];
            }
        }

        return $parts[0] ?? null;
    }
}

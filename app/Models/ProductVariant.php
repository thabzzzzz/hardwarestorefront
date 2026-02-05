<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'product_variants';

    protected $fillable = ['id', 'product_id', 'sku', 'title', 'specs', 'attributes_normalized', 'is_active'];

    protected $casts = [
        'specs' => 'array',
        'attributes_normalized' => 'array',
        'is_active' => 'boolean',
        'raw_spec_tables' => 'array',
        'image_urls' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function prices()
    {
        return $this->hasMany(Price::class, 'variant_id');
    }

    public function stock()
    {
        return $this->hasOne(StockLevel::class, 'variant_id');
    }

    public function images()
    {
        return $this->hasMany(Image::class, 'variant_id');
    }
}

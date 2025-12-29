<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'slug', 'name', 'brand', 'manufacturer', 'vendor_id', 'category_id', 'model_number', 'release_date'];

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
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PcBuildComponent extends Model
{
    protected $fillable = [
        'pc_build_id',
        'product_variant_id',
        'quantity',
    ];

    public function build()
    {
        return $this->belongsTo(PcBuild::class, 'pc_build_id');
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}

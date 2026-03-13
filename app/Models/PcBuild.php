<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PcBuild extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'total_price',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function components()
    {
        return $this->hasMany(PcBuildComponent::class);
    }
}

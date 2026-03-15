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
        'share_token',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->share_token)) {
                $model->share_token = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function components()
    {
        return $this->hasMany(PcBuildComponent::class);
    }
}

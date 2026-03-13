<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ApiToken extends Model
{
    protected $fillable = ['user_id', 'token', 'name'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

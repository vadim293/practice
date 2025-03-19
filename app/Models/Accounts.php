<?php

namespace App\Models;

use App\Models\Requests;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Accounts extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'api_key',
        'requests_limit',
        'priority',
    ];

    public function requests(){
        return $this->hasMany(Requests::class);
    }
}

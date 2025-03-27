<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Accounts extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'api_key',
        'requests_limit',
        'priority',
    ];

    public function requests()
    {
        return $this->hasMany(Requests::class);
    }
}

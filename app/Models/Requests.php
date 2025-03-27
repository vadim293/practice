<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Requests extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'geocode',
    ];

    public function accounts()
    {
        return $this->belongsTo(Accounts::class);
    }
}

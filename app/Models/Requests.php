<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Requests extends Model
{
    protected $fillable = [
        'account_id',
        'geocode',
    ];

    public function accounts()
    {
        return $this->belongsTo(Account::class);
    }
}

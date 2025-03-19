<?php

namespace App\Models;

use App\Models\Accounts;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Requests extends Model
{
    use HasFactory;


    protected $fillable = [
        'account_id',
        'geocode',
    ];

    public function accounts(){
        return $this->belongsTo(Accounts::class);
    }
}

<?php

namespace App\Models;

use App\Models\AnnouncementPhoto;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title',
        'description',
        'address',
        'price',
        'type',
        'rooms',
        'area',
        'user_id',
    ];

    public function announcementFoto()
    {
        return $this->hasMany(AnnouncementPhoto::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

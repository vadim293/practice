<?php

namespace App\Models;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Model;

class AnnouncementPhoto extends Model
{
    protected $fillable = [
        'file_name',
        'announcement_id',
    ];

    public function announcement()
    {
        return $this->belongsTo(Announcement::class);
    }
}

<?php 

namespace App\Services\Announcement;

use App\Models\User;
use App\Models\Announcement;
use Illuminate\Http\Request;
use App\Models\AnnouncementPhoto;
use Illuminate\Support\Facades\Auth;


class AnnouncementService{

    public function createAnnouncement($params){

        $userId = Auth::id();
        
        if(!$userId) {
            return response()->json(['error'=> 'Ошибка авторизации'],401);
        }

        $announcement = Announcement::create([
            'title' => $params['title'],
            'description' => $params['description'],
            'address' => $params['address'],
            'price' => $params['price'],
            'type' => $params['type'],
            'rooms' => $params['rooms'],
            'area' => $params['area'],
            'user_id' => $userId,
        ]);

        AnnouncementPhoto::create([
            'file_name' => $params['file_name'],
            'announcement_id' => $announcement->id,
        ]); 
    }

    public function updateAnnouncement(){

    }
}
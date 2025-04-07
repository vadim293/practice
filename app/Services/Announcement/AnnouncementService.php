<?php 

namespace App\Services\Announcement;

use Exception;
use App\Models\User;
use App\Models\Announcement;
use App\Models\AnnouncementPhoto;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;


class AnnouncementService{

    public function createAnnouncement($params){
        $announcement = Announcement::create([
            'title' => $params['title'],
            'description' => $params['description'],
            'address' => $params['address'],
            'price' => $params['price'],
            'lat' => $params['latitude'],
            'lon' => $params['longitude'],
            'type' => $params['type'],
            'rooms' => $params['rooms'],
            'area' => $params['area'],
            'user_id' => 76,
            // 'user_id' => auth()->user()->id,
        ]);

        if (!empty($params['file_name'])) {
            $this->getPhoto($params['file_name'], $announcement->id);
        }

        return response()->json(['data'=>['message'=>'объявление создано успешно']],200);
    }

    public function getPhoto($files, $announcementId)
    {
        foreach ($files as $file) {
            $extension = $file->getClientOriginalExtension();
            $fileName = uniqid() . '.' . $extension;
            
            $path = $file->storeAs('', $fileName, 'announcement');

            AnnouncementPhoto::create([
                'file_name' => $path,
                'announcement_id' => $announcementId,
            ]);
        }
    }

    public function updateAnnouncement($id, $params){
        $announcement = Announcement::findOrFail($id);

        if(!$announcement){
            return response()->json(['message'=>'объявление не найтено'],404);
        }

        $announcement->update($params);


        if ($params->hasFile('file_name')) {
            $this->processFiles($params->file('file_name'), $announcement->id);
        }
    }

    public function processFiles($files, $announcementId)
    {
        foreach ($files as $file) {
            $extension = $file->getClientOriginalExtension();
            $fileName = uniqid() . '.' . $extension;
            
            $path = $file->storeAs('', $fileName, 'announcement');
            
            AnnouncementPhoto::create([
                'file_name' => $path,
                'announcement_id' => $announcementId,
            ]);
        }
    }

    public function deleteAnnouncement($id)
    {
        $announcement = Announcement::find($id);

        if(!$announcement){
            return response()->json(['message'=>'объявление не найтено'],404);
        }
        $this->deletePhoto($announcement->id); 
        $announcement->delete();

    }

    public function deletePhoto($photoId)
    {
        $photos = AnnouncementPhoto::where('announcement_id',$photoId)->get();

        foreach($photos as $photo){
 
            Storage::disk('announcement')->delete($photo->file_name);

            $photo->delete();
        }
        
    }

    public function getAllAnnouncement() {
        return Announcement::with('announcementPhoto')
        ->get()
        ->map(function($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'address' => $item->address,
                'price' => $item->price,
                'rooms' => $item->rooms,
                'area' => $item->area,
                'lat' => $item->lat,
                'lon' => $item->lon,
                'description' => $item->description,
                'type' => $item->type,
                'announcement_photo' => $item->announcementPhoto->map(function($photo) {
                    return ['file_name' => $photo->file_name];
                })
            ];
        });
    }
}
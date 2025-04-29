<?php 

namespace App\Services\Announcement;

use Exception;
use App\Models\User;
use App\Models\Announcement;
use App\Models\AnnouncementPhoto;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;


class AnnouncementService{

    public function createAnnouncement($params, $apiToken){

        $user = User::where('api_token', $apiToken)->first();
    
        if (!$user) {
            return response()->json(['error' => 'Требуется вход в систему'], 401);
        }

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
            'user_id' => $user->id,
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

    public function updateAnnouncement($id, $params)
    {
        $announcement = Announcement::findOrFail($id);
    
        if(!$announcement) {
            return response()->json(['message' => 'Объявление не найдено'], 404);
        }
        $announcement->update([
            'title' => $params['title'],
            'description' => $params['description'],
            'address' => $params['address'],
            'price' => $params['price'],
            'lat' => $params['latitude'],
            'lon' => $params['longitude'],
            'type' => $params['type'],
            'rooms' => $params['rooms'],
            'area' => $params['area'],
        ]);
    
        if (!empty($params['file_name'])) {
            $this->getPhoto($params['file_name'], $announcement->id);
        }
        
        // Добавьте возврат успешного ответа
        return response()->json(['message' => 'Объявление успешно обновлено','data' => $announcement]);
    }


    public function deleteAnnouncement($id)
    {
        $announcement = Announcement::find($id);

        if(!$announcement){
            return response()->json(['message'=>'объявление не найтено'],404);
        }
        
        $photos = AnnouncementPhoto::where('announcement_id', $announcement->id)->get();

        // Удаляем каждую фотографию
        foreach ($photos as $photo) {
            $this->deletePhoto($photo->id);
        }
    
        // Удаляем само объявление
        $announcement->delete();

    }

    public function deletePhoto($photoId)
    {
        // Находим конкретное фото по его ID
        $photo = AnnouncementPhoto::find($photoId);
    
        if (!$photo) {
            return response()->json([
                'success' => false,
                'message' => 'Фотография не найдена'
            ], 404);
        }
    
        try {
            // Удаляем файл из хранилища
            Storage::disk('announcement')->delete($photo->file_name);
            
            // Удаляем запись из базы данных
            $photo->delete();
    
            return response()->json([
                'message' => 'Фотография успешно удалена'
            ]);
    
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Ошибка при удалении фотографии: ' . $e->getMessage()
            ], 500);
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
    public function getAnnouncement($id) {
        return Announcement::with('announcementPhoto','user')->find($id);
    }

    public function getUserAnnouncements($userId) {
        return Announcement::with('announcementPhoto','user')
            ->where('user_id', $userId) 
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

    public function search($params)
    {

        $address = $params->input('address');
        $type = $params->input('type');
        $maxPrice = $params->input('price');
    
        // Начинаем построение запроса
        $query = Announcement::with('announcementPhoto');
    
        // Фильтр по адресу (с добавлением запятой перед номером дома)
        if (!empty($address)) {
            $searchAddress = preg_replace('/(.*)\s(\d+)$/', '$1, $2', $address);
            $query->where('address', 'LIKE', '%' . $searchAddress . '%');
        }
        
        // Фильтр по типу недвижимости
        if (!empty($type)) {
            $query->where('type', $type);
        }
    
        // Фильтр по цене (меньше или равно указанной)
        if (!empty($maxPrice)) {
            $query->where('price', '<=', $maxPrice);
        }
    
        // Получаем результаты
        $announcements = $query->get();
    
        return response()->json($announcements);

    }

    public function userFoto($user, $file)
    {
        $extension = $file->getClientOriginalExtension();
        $fileName = uniqid() . '.' . $extension;
            
        $path = $file->storeAs('', $fileName, 'userFoto');
        $this->deleteUserFoto($user);

        $user->user_foto = $path;
        $user->save();
    }
    
    public function deleteUserFoto($user)
    {
        if (empty($user->user_foto)) {
            return false;
        }
    
        $oldFile = $user->user_foto;
    
        // Удаляем файл
        if (Storage::disk('userFoto')->exists($oldFile)) {
            Storage::disk('userFoto')->delete($oldFile);
        }
    
        // Очищаем поле в БД
        $user->user_foto = null;
        $user->save();
    
        return true;
    }
}
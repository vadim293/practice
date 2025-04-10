<?php

namespace App\Http\Controllers\Announcement;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Announcement\AnnouncementService;
use App\Http\Requests\Announcement\AnnouncementRequest;

class AnnouncementController extends Controller
{
    public function __construct(
        protected AnnouncementService $announcementService,
    ) {}

    public function create(AnnouncementRequest $request){
        return $this->announcementService->createAnnouncement($request->validated());
    }

    public function update(AnnouncementRequest $request, $id){
        $photos = $request->hasFile('file_name');
        return $this->announcementService->updateAnnouncement($id,$request->validated(), $photos);
    }

    public function delete($id){
        return $this->announcementService->deleteAnnouncement($id);
    }

    public function getAll() {
        return $this->announcementService->getAllAnnouncement();
    }

    public function get($id) {
        return $this->announcementService->getAnnouncement($id);
    }

    public function deletePhoto($id) {
        return $this->announcementService->deletePhoto($id);
    }
}

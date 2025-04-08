<?php

namespace App\Http\Controllers\Announcement;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Announcement\AnnouncementService;
use App\Http\Requests\Annoumcement\AnnoumcementRequest;

class AnnouncementController extends Controller
{
    public function __construct(
        protected AnnouncementService $announcementService,
    ) {}

    public function create(AnnoumcementRequest $request){
        return $this->announcementService->createAnnouncement($request->validated());
    }

    public function update(AnnoumcementRequest $request, $id){
        return $this->announcementService->updateAnnouncement($id,$request->validated());
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

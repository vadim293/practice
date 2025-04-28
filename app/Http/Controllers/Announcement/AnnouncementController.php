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
        $apiToken = $request->bearerToken();
        return $this->announcementService->createAnnouncement($request->validated(), $apiToken);
    }

    public function update(AnnouncementRequest $request, $id){
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

    public function getUserAnnouncement($id) {
        return $this->announcementService->getUserAnnouncements($id);
    }

    public function deletePhoto($id) {
        return $this->announcementService->deletePhoto($id);
    }

    public function search(Request $request) {
        return $this->announcementService->search($request);
    }

    public function userFoto(Request $request) {
        return $this->announcementService->userFoto($request->user(),$request->file('user_foto'));
    }

    public function deleteUserFoto(Request $request) {
        return $this->announcementService->deleteUserFoto($request->user());
    }

}

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
}

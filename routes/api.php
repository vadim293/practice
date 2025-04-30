<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GeocodeController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Announcement\AnnouncementController;

Route::get('/', function () {
    return [
        'ok' => true,
    ];
});

Route::get('/geocoder', [GeocodeController::class, 'geocode']);

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login'])->name('login');


Route::get('/Announcement', [AnnouncementController::class, 'getAll']);
Route::get('/Announcement/{id}', [AnnouncementController::class, 'get']);
Route::get('/user/Announcement/{id}', [AnnouncementController::class, 'getUserAnnouncement']);
Route::get('/search', [AnnouncementController::class, 'search']);


Route::middleware('auth:api')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [LoginController::class, 'logout']);

    Route::post('/adderAnnouncement', [AnnouncementController::class, 'create']);
    Route::patch('/updateAnnouncement/{id}', [AnnouncementController::class, 'update']);
    Route::delete('/deleteAnnouncement/{id}', [AnnouncementController::class, 'delete']);
    Route::delete('/deleteAnnouncementPhoto/{id}', [AnnouncementController::class, 'deletePhoto']);


    Route::patch('/userFoto', [AnnouncementController::class, 'userFoto']);
    Route::delete('/userFoto/{id}', [AnnouncementController::class, 'deleteUserFoto']);
});

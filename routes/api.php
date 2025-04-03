<?php

declare(strict_types=1);

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

Route::get('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout']);


Route::post('/adderAnnoumcement', [AnnouncementController::class, 'create']);
Route::patch('/updateAnnoumcement/{id}', [AnnouncementController::class, 'update']);
Route::delete('/deleteAnnoumcement/{id}', [AnnouncementController::class, 'delete']);


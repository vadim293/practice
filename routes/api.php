<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GeocodeController;

Route::get('/', function () {
    return [
        'ok' => true,
    ];
});

Route::get('/geocoder',[GeocodeController::class, 'geocode']);
<?php

declare(strict_types=1);

use App\Http\Controllers\GeocodeController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return [
        'ok' => true,
    ];
});

Route::get('/geocoder', [GeocodeController::class, 'geocode']);

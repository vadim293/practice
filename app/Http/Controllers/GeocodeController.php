<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\AccountLimitException;
use App\Http\Requests\GeocodeRequest;
use App\Services\GeocodeService;
use Illuminate\Support\Facades\Http;

class GeocodeController extends Controller
{
    protected $geocodeService;

    public function __construct(GeocodeService $geocodeService)
    {
        $this->geocodeService = $geocodeService;
    }

    public function geocode(GeocodeRequest $request): mixed
    {

        $validatedData = $request->validated();
        $address = $validatedData['geocode'];

        $account = $this->geocodeService->findAccount();

        if ($account === null) {
            throw new AccountLimitException;
        }

        $geocodeResult = $this->geocodeService->getGeocode($account->api_key, $validatedData);

        $this->geocodeService->createRequest($account->id, $address);

        return Http::get($geocodeResult)->json();
    }
}

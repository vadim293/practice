<?php

namespace App\Http\Controllers;

use App\Services\GeocodeService;
use Illuminate\Support\Facades\Http;
use App\Http\Requests\GeocodeRequest;
use App\Exceptions\AccountLimitException;

class GeocodeController extends Controller
{
    protected $geocodeService;
    public function __construct(GeocodeService $geocodeService)
    {
        $this->geocodeService = $geocodeService;
    }
    public function geocode(GeocodeRequest $request): mixed {

        $validatedData = $request->validated();
        $address = $validatedData['geocode'];

        $account = $this->geocodeService->findAccount();

        if($account === null) {
            throw new AccountLimitException();
        }

        $geocodeResult = $this->geocodeService->getGeocode($account->api_key, $validatedData);

        $this->geocodeService->createRequest($account->id,$address);

        return Http::get($geocodeResult)->json();
    }
}
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\AccountLimitException;
use App\Http\Requests\GeocodeRequest;
use App\Services\GeocodeService;
use Illuminate\Http\Client\ConnectionException;

class GeocodeController extends Controller
{
    public function __construct(
        protected GeocodeService $geocodeService,
    ) {}

    /**
     * @throws AccountLimitException|ConnectionException
     */
    public function geocode(GeocodeRequest $request): mixed
    {
        $account = $this->geocodeService->findAccount();

        if ($account === null) {
            throw new AccountLimitException;
        }

        return $this->geocodeService->request($account, $request->validated());
    }
}

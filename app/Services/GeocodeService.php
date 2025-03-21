<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Accounts;
use App\Models\Requests;

class GeocodeService
{
    public function findAccount(): ?Accounts {
        $today = Carbon::today();

        $accounts = Accounts::orderBy("priority", 'asc')->orderBy("id", 'asc')->get();
        $groupaccounts = $accounts->groupBy('priority');

        foreach ($groupaccounts as $group) {
            $accountsMin = null;
            $minRequest = PHP_INT_MAX;
            foreach ($group as $account) {
                $requestcount = Requests::where('account_id', $account->id)->whereDate('created_at', $today)->count();

                if($requestcount < $account->requests_limit && $requestcount < $minRequest) {
                    $accountsMin = $account;
                    $minRequest = $requestcount;
                }
            }
            if($accountsMin != null) {
                return $accountsMin;
            }
        }

        return null;
    }

    public function getGeocode($apiKey ,$data): string {

        $url = "https://geocode-maps.yandex.ru/1.x/?";

        $body = [
            'apikey' => $apiKey,
        ];

        $body = array_merge($body, $data);

        $bodyString = http_build_query($body);

        $getGeocodeUrl = $url . $bodyString;

        return $getGeocodeUrl;
    }

    public function createRequest($accountId, $geocode): void {
        Requests::create([
            'account_id' => $accountId,
            'geocode' => $geocode,
        ]);
    }
}
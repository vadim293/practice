<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Accounts;
use App\Models\Requests;
use Illuminate\Support\Facades\Http;
use App\Http\Requests\GeocodeRequest;
use App\Exceptions\AccountLimitException;

class GeocodeController extends Controller
{
    public function geocode(GeocodeRequest $request): mixed {

        $validatedData = $request->validated();

        $address = $validatedData['geocode'];
        
        $account = $this->findAccount();

        if($account === null) {
            throw new AccountLimitException();
        }

        $geocode_result = $this->getGeocode($account->api_key, $validatedData);

        $this->createRequest($account->id,$address);
      
        return Http::get($geocode_result)->json();
    }


    private function findAccount(): Accounts|null {
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


    private function getGeocode($apiKey ,$data): string {

        $url = "https://geocode-maps.yandex.ru/1.x/?";        

        $body = [
            'apikey' => $apiKey,
        ];

        $body = array_merge($body, $data);
        
        $bodyString = http_build_query($body);

        $response = $url . $bodyString;

        return $response;
    }


    private function createRequest($accountId, $geocode): void {
        Requests::create([
            'account_id' => $accountId,
            'geocode' => $geocode,
        ]);
    }
}

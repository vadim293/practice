<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Accounts;
use App\Models\Requests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GeocodeController extends Controller
{
    public function geocode(Request $request) {

        $data = $request->all();

        $address = $data['geocode'] ?? null;
        if(!$address) {
            return response()->json(['error'=>['message'=> 'Адрес не найден']],400);
        }

        $account = $this->findAccount();

        if($account === null) {
            return response()->json(['error'=>['message'=> 'Количество запросов на текущий день превышено']],400);
        }

        $geocode_result = $this->getGeocode($account->api_key, $data);

        if(!$geocode_result) {
            return response()->json(['error'=>['message'=> 'Не найдено']],400);
        }

        $this->createRequest($account->id,$address);

        return Http::get($geocode_result)->json();
        // return $geocode_result;
    }


    private function findAccount() {
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


    private function getGeocode($apiKey ,$data) {

        $url = "https://geocode-maps.yandex.ru/1.x/?";        

        $body = [
            'apikey' => $apiKey,
        ];

        $body = array_merge($body, $data);
        
        $bodyString = http_build_query($body);

        $response = $url . $bodyString;

        return $response;
    }


    private function createRequest($accountId, $geocode) {
        Requests::create([
            'account_id' => $accountId,
            'geocode' => $geocode,
        ]);
    }
}

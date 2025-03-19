<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Accounts;
use App\Models\Requests;
use Illuminate\Http\Request;

class GeocodeController extends Controller
{
    public function geocode(Request $request) {

        $data = $request->all();

        $address = $data['geocode'];
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

        return $geocode_result;
    }


    private function findAccount() {
        $today = Carbon::today();

        $account = Accounts::whereNull("deleted_at")->orderBy("priority", 'asc')->get()
        ->first(function($account) use ($today) {
            $requestcount = Requests::where('account_id', $account->id)->whereDate('created_at', $today)->count();

            return $requestcount < $account->requests_limit;
        });

        return $account;
    }


    private function getGeocode($apiKey ,$data) {

        $url = "https://geocode-maps.yandex.ru/1.x/?";        

        $body = [
            'api_key' => $apiKey,
        ];

        $body = array_merge($body, $data);
        
        $bodyString = http_build_query($body);

        $response = $url . $bodyString;

        return $response;
    }


    private function createRequest($accountId, $geocode) {
        $create = Requests::create([
            'account_id' => $accountId,
            'geocode' => $geocode,
        ]);

        return $create;
    }
}

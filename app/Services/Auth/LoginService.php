<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;


class LoginService {

    public function login($login) {
        if(!Auth::attempt($login)){
            return response()->json(['message'=>'Неверный логин или пароль'],403);
        }

        $user = Auth::user();
        $user->api_token = Str::random(60);
        $user->save();

        return response()->json([ 'data' =>[
            'name'=> $user->first_name.' '.$user->last_name.' '.$user->patronymic,
            'token'=> $user->api_token]
        ],200);
    }

    public function logout($request){
        $token =  $request->bearerToken();

        $user = User::where('api_token',$token)->first();

        if($user){
            $user->api_token = null;
            $user->save();

            return response()->json([],204);
        }
    }
}
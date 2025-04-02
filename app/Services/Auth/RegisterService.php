<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RegisterService{

    public function createUser($params = []){
        User::create([
            'first_name' => ucfirst($params['first_name']),
            'last_name' => ucfirst($params['last_name']),
            'patronymic' => ucfirst($params['patronymic']),
            'phone' => $params['phone'],
            'password' => Hash::make($params['password']),
        ]); 
    }

    public function register($params = []) {
        $this->createUser($params);

        return response()->json(['message' => 'Регистрация прошла успешла'], 201);
    }

    
}

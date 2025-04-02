<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use App\Services\Auth\LoginService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;

class LoginController extends Controller
{
    public function __construct(
        protected LoginService $loginService,
    ) {}

    public function login(LoginRequest $request){
        return $this->loginService->login($request->validated());
    }

    public function logout(LoginRequest $request){
        return $this->loginService->logout($request);
    }
}

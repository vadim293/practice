<?php

namespace App\Http\Controllers\Auth;


use App\Http\Controllers\Controller;
use App\Services\Auth\RegisterService;
use App\Http\Requests\Auth\RegisterRequest;

class RegisterController extends Controller
{
    public function __construct(
        protected RegisterService $registerService,
    ) {}

    public function register(RegisterRequest $request) {
        return $this->registerService->register($request->validated());
    }
}

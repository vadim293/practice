<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AccountLimitException extends Exception
{
    public function render(Request $request): JsonResponse  {

        return response()->json( ['error'=> ['message' => 'Количество запросов на текущий день превышено']],429);

    }
}

<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountLimitException extends Exception
{
    public function render(Request $request): JsonResponse
    {

        return response()->json(['error' => ['message' => 'Количество запросов на текущий день превышено']], 429);

    }
}

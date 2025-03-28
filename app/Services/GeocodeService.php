<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Account;
use App\Models\Requests;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeocodeService
{
    const BASE_URL = 'https://geocode-maps.yandex.ru/1.x';

    public function findAccount(): ?Account
    {
        $today = today();

        $accounts = Account::orderBy('priority', 'asc')->orderBy('id', 'asc')->get();
        $groupAccounts = $accounts->groupBy('priority');

        foreach ($groupAccounts as $group) {
            $accountsMin = null;
            $minRequest = PHP_INT_MAX;
            foreach ($group as $account) {
                $requestCount = Requests::where('account_id', $account->id)->whereDate('created_at', $today)->count();

                if ($requestCount < $account->requests_limit && $requestCount < $minRequest) {
                    $accountsMin = $account;
                    $minRequest = $requestCount;
                }
            }
            if ($accountsMin !== null) {
                return $accountsMin;
            }
        }

        return null;
    }

    public function createRequest($accountId, $geocode): void
    {
        Requests::create([
            'account_id' => $accountId,
            'geocode' => $geocode,
        ]);
    }

    /**
     * @throws ConnectionException
     */
    public function request(Account $account, array $params = []): mixed
    {
        if (empty($params['geocode'])) {
            throw new RuntimeException('Отсутствует geocode параметр');
        }

        $this->createRequest($account->id, $params['geocode']);

        return Http::get(self::BASE_URL, array_merge(['apikey' => $account->api_key], $params))->json();
    }
}

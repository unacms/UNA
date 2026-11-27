<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AIProxy AI Proxy
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAiProxyAuth
{
    /**
     * @param callable(string): ?array $fLookup client_id to an OAuth client row. Not called when the key is empty.
     * @return array{ok:bool, code:int}
     */
    public function authenticate(string $sKey, string $sSign, string $sBody, callable $fLookup): array
    {
        if ($sKey === '')
            return $this->denied();

        $mixedClient = $fLookup($sKey);
        $sSecret = is_array($mixedClient) ? (string)($mixedClient['client_secret'] ?? '') : '';
        if ($sSecret === '')
            return $this->denied();

        $sExpected = hash_hmac('sha256', $sBody, $sSecret);
        try {
            $bMatch = hash_equals($sExpected, $sSign);
        }
        catch (Throwable $oException) {
            $bMatch = false;
        }
        if (!$bMatch)
            return $this->denied();

        return ['ok' => true, 'code' => 200];
    }

    /**
     * @return array{ok:bool, code:int}
     */
    public function authenticateRequest(string $sKey, string $sSign, string $sBody): array
    {
        return $this->authenticate($sKey, $sSign, $sBody, function (string $sClientId) {
            if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth'))
                return null;

            $mixed = BxDolService::call('bx_oauth', 'get_clients_by', [[
                'type' => 'client_id',
                'client_id' => $sClientId,
            ]]);
            return is_array($mixed) ? $mixed : null;
        });
    }

    /**
     * @return array{ok:bool, code:int}
     */
    protected function denied(): array
    {
        return ['ok' => false, 'code' => 401];
    }
}

/** @} */

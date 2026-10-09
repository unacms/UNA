<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAIProviderUnaProxy extends NeuronAI\Providers\OpenAI\OpenAI
{
    protected string $baseUri = 'https://unacms.com/m/ai_proxy/v1';

    public function __construct(
        string $sKey,
        string $sSecret,
        string $sModel,
        ?NeuronAI\HttpClient\HttpClientInterface $httpClient = null,
    ) {
        if ($sKey === '' || $sSecret === '')
            throw new Exception(_t('_sys_agents_una_proxy_unconfigured'));

        parent::__construct(
            key: '',
            model: $sModel,
            parameters: [],
            strict_response: false,
            httpClient: $httpClient ?? new BxDolAIUnaProxyHttpClient($sKey, $sSecret),
        );
    }
}

/** @} */

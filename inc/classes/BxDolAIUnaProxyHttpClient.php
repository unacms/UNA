<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAIUnaProxyHttpClient extends NeuronAI\HttpClient\GuzzleHttpClient
{
    public function __construct(
        protected string $sUnaKey,
        protected string $sUnaSecret,
    ) {
        parent::__construct();
    }

    public static function encodeBody(array $aBody): string
    {
        return json_encode($aBody, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    public static function sign(string $sRawBody, string $sSecret): string
    {
        return hash_hmac('sha256', $sRawBody, $sSecret);
    }

    /**
     * Headers for the exact bytes that will be posted. The secret is not a header.
     *
     * @return array<string, string>
     */
    public function headersForBody(string $sRawBody): array
    {
        if ($this->sUnaKey === '' || $this->sUnaSecret === '')
            throw new Exception(_t('_sys_agents_una_proxy_unconfigured'));

        return [
            'X-Una-Key' => $this->sUnaKey,
            'X-Una-Sign' => self::sign($sRawBody, $this->sUnaSecret),
        ];
    }

    public function runRequest(NeuronAI\HttpClient\HttpRequest $request, array $options, GuzzleHttp\Client $client): Psr\Http\Message\ResponseInterface
    {
        $sBody = '';
        if (is_array($request->body)) {
            $sBody = self::encodeBody($request->body);
            $request = new NeuronAI\HttpClient\HttpRequest($request->method, $request->uri, $request->headers, $sBody);
        }
        elseif (is_string($request->body))
            $sBody = $request->body;

        $aHeaders = $options[\GuzzleHttp\RequestOptions::HEADERS] ?? [];
        foreach (array_keys($aHeaders) as $sName) {
            if (strcasecmp((string)$sName, 'Authorization') === 0)
                unset($aHeaders[$sName]);
        }
        $options[\GuzzleHttp\RequestOptions::HEADERS] = array_merge($aHeaders, $this->headersForBody($sBody));
        unset($options[\GuzzleHttp\RequestOptions::JSON]);

        return parent::runRequest($request, $options, $client);
    }
}

/** @} */

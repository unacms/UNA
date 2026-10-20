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
    protected string $baseUri = 'https://api.unacms.com/m/ai_proxy/v1';

    /**
     * null reads the AI Proxy setting. A string, including empty, is used as given.
     */
    public function __construct(
        string $sKey,
        string $sSecret,
        string $sModel,
        ?NeuronAI\HttpClient\HttpClientInterface $httpClient = null,
        protected ?string $sPrompt = null,
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

    public function systemPrompt(?string $prompt): NeuronAI\Providers\AIProviderInterface
    {
        $sOperator = trim($this->operatorPrompt());
        if ($sOperator !== '') {
            $sClient = trim((string)$prompt);
            $prompt = $sClient === '' ? $sOperator : $sOperator . "\n\n" . $sClient;
        }

        return parent::systemPrompt($prompt);
    }

    protected function operatorPrompt(): string
    {
        if ($this->sPrompt !== null)
            return $this->sPrompt;

        return (string)getParam('bx_ai_proxy_prompt');
    }
}

/** @} */

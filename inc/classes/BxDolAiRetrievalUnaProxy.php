<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Retrieval that asks the UNA master to embed and search its knowledge store.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiRetrievalUnaProxy implements NeuronAI\RAG\Retrieval\RetrievalInterface
{
    public const URL = 'https://unacms.com/m/ai_proxy/v1/knowledge/search';

    /**
     * @param callable(string, array): array{code:int, body:string}|null $fPost
     */
    public function __construct(
        protected string $sKey,
        protected string $sSecret,
        protected $fPost = null,
    ) {
    }

    public function retrieve(NeuronAI\Chat\Messages\Message $query): array
    {
        $sQuery = trim((string)$query->getContent());
        if ($sQuery === '' || $this->sKey === '' || $this->sSecret === '')
            return [];

        $sBody = BxDolAIUnaProxyHttpClient::encodeBody(['query' => $sQuery]);
        $aSigned = (new BxDolAIUnaProxyHttpClient($this->sKey, $this->sSecret))->headersForBody($sBody);
        $aHeaders = [
            'Content-Type: application/json',
            'X-Una-Key: ' . $aSigned['X-Una-Key'],
            'X-Una-Sign: ' . $aSigned['X-Una-Sign'],
        ];

        try {
            $aResponse = $this->post($sBody, $aHeaders);
        }
        catch (Throwable $oException) {
            bx_log('sys_agents', 'Remote knowledge search failed: ' . $oException->getMessage(), BX_LOG_ERR);
            return [];
        }

        if (!is_array($aResponse) || (int)($aResponse['code'] ?? -1) !== 200) {
            bx_log('sys_agents', 'Remote knowledge search failed, exit code: ' . ($aResponse['code'] ?? -1), BX_LOG_ERR);
            return [];
        }

        return $this->documentsFrom((string)($aResponse['body'] ?? ''));
    }

    /**
     * @param array<int, string> $aHeaders
     * @return array{code:int, body:string}
     */
    protected function post(string $sBody, array $aHeaders): array
    {
        if ($this->fPost !== null)
            return ($this->fPost)($sBody, $aHeaders);

        $sHttpCode = 0;
        $sResult = bx_file_get_contents(self::URL, $sBody, 'post-raw', $aHeaders, $sHttpCode, [], 15);
        if ($sResult === false)
            $sResult = '';

        return [
            'code' => (int)$sHttpCode,
            'body' => (string)$sResult,
        ];
    }

    /**
     * @return NeuronAI\RAG\Document[]
     */
    protected function documentsFrom(string $sBody): array
    {
        $aBody = json_decode($sBody, true);
        if (!is_array($aBody) || !isset($aBody['documents']) || !is_array($aBody['documents']))
            return [];

        $aDocuments = [];
        foreach ($aBody['documents'] as $aDocument) {
            if (!is_array($aDocument))
                continue;

            $sContent = trim((string)($aDocument['content'] ?? ''));
            if ($sContent === '')
                continue;

            $oDocument = new NeuronAI\RAG\Document($sContent);
            $sSourceType = trim((string)($aDocument['sourceType'] ?? ''));
            $sSourceName = trim((string)($aDocument['sourceName'] ?? ''));
            if ($sSourceType !== '')
                $oDocument->sourceType = $sSourceType;
            if ($sSourceName !== '')
                $oDocument->sourceName = $sSourceName;
            if (isset($aDocument['score']))
                $oDocument->setScore((float)$aDocument['score']);
            $aDocuments[] = $oDocument;
        }

        return $aDocuments;
    }
}

/** @} */

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

class BxAiProxyKnowledge
{
    /**
     * Studio knowledge store for this search. The request body cannot choose a store.
     *
     * @param callable(int): array|false $fStore
     * @param callable(int): object $fEmbedder
     * @param callable(int): object $fVectorStore
     * @return array{documents: list<array{content:string, sourceType:string, sourceName:string, score:float}>}
     */
    public function run(array $aBody, int $iConfiguredId, callable $fStore, callable $fEmbedder, callable $fVectorStore): array
    {
        $sQuery = trim((string)($aBody['query'] ?? ''));
        if ($sQuery === '')
            throw new BxAiProxyException(400, 'Bad request');

        $aStore = $fStore($iConfiguredId);
        if (!$this->usableStore($aStore)) {
            bx_log('sys_agents', 'AI proxy knowledge store is not available', BX_LOG_ERR);
            return ['documents' => []];
        }

        try {
            $oEmbedder = $fEmbedder((int)$aStore['embedding_provider_id']);
            $oStore = $fVectorStore($iConfiguredId);
            $aEmbedding = $oEmbedder->embedText($sQuery);
            if (!is_array($aEmbedding))
                throw new BxAiProxyException(503, 'The proxy knowledge is not available');

            $aDocuments = [];
            foreach ($oStore->similaritySearch($aEmbedding) as $oDocument) {
                if (!$oDocument instanceof NeuronAI\RAG\Document)
                    continue;

                $sContent = $oDocument->getContent();
                if ($sContent === '')
                    continue;

                $aDocuments[] = [
                    'content' => $sContent,
                    'sourceType' => $oDocument->getSourceType(),
                    'sourceName' => $oDocument->getSourceName(),
                    'score' => $oDocument->getScore(),
                ];
            }

            return ['documents' => $aDocuments];
        }
        catch (BxAiProxyException $oException) {
            throw $oException;
        }
        catch (Throwable $oException) {
            bx_log('sys_agents', 'AI proxy knowledge failed: ' . $oException->getMessage(), BX_LOG_ERR);
            throw new BxAiProxyException(503, 'The proxy knowledge is not available');
        }
    }

    protected function usableStore(mixed $aStore): bool
    {
        if (!is_array($aStore) || empty($aStore['active']))
            return false;
        if ((int)($aStore['embedding_provider_id'] ?? 0) <= 0)
            return false;
        if ((string)($aStore['type'] ?? '') === 'una-proxy')
            return false;

        return true;
    }
}

/** @} */

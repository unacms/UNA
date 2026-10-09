<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Retrieval for an agent that has no knowledge store.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiRetrievalNone implements NeuronAI\RAG\Retrieval\RetrievalInterface
{
    public function retrieve(NeuronAI\Chat\Messages\Message $query): array
    {
        return [];
    }
}

/** @} */

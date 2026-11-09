<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * MariaDB vector search limited to one Studio store.
 * Rows from every store share one table per embedding width and are marked with sourceType.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAIVectorStoreMariaDbStore extends NeuronAI\RAG\VectorStore\MariaDBVectorStore
{
    public function __construct(
        PDO $oPdo,
        int $iTopK,
        protected string $sStoreId,
    ) {
        parent::__construct($oPdo, BxDolAIVectorStoreMariaDb::tableForDimension(1024), $iTopK);
    }

    public function addDocuments(array $documents): NeuronAI\RAG\VectorStore\VectorStoreInterface
    {
        $aGrouped = [];
        foreach ($documents as $oDocument) {
            if (!$oDocument instanceof NeuronAI\RAG\Document)
                continue;

            $sTable = BxDolAIVectorStoreMariaDb::tableForDimension(count($oDocument->getEmbedding()));
            $aGrouped[$sTable][] = $oDocument;
        }

        foreach ($aGrouped as $sTable => $aDocuments) {
            $this->tableName = $sTable;
            parent::addDocuments($aDocuments);
        }

        return $this;
    }

    public function delete(NeuronAI\RAG\VectorStore\Filter\FilterExpression $filters): NeuronAI\RAG\VectorStore\VectorStoreInterface
    {
        $sCurrent = $this->tableName;
        try {
            foreach (BxDolAIVectorStoreMariaDb::DIMENSIONS as $iDimension) {
                $this->tableName = BxDolAIVectorStoreMariaDb::tableForDimension($iDimension);
                parent::delete(NeuronAI\RAG\VectorStore\Filter\FilterGroup::and(
                    NeuronAI\RAG\VectorStore\Filter\Filter::eq('sourceType', $this->sStoreId),
                    $filters
                ));
            }
        }
        finally {
            $this->tableName = $sCurrent;
        }

        return $this;
    }

    /**
     * Searches the table of the query width, limited to this store.
     */
    public function search(NeuronAI\RAG\VectorStore\SearchRequest $request): iterable
    {
        $oStoreFilter = NeuronAI\RAG\VectorStore\Filter\Filter::eq('sourceType', $this->sStoreId);
        $oFilters = $request->filters ? NeuronAI\RAG\VectorStore\Filter\FilterGroup::and($oStoreFilter, $request->filters) : $oStoreFilter;

        $sCurrent = $this->tableName;
        $this->tableName = BxDolAIVectorStoreMariaDb::tableForDimension(count($request->embedding));
        try {
            return parent::search(new NeuronAI\RAG\VectorStore\SearchRequest($request->embedding, $oFilters, $request->topK));
        }
        finally {
            $this->tableName = $sCurrent;
        }
    }
}

/** @} */

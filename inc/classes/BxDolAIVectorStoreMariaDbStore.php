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

    public function deleteBy(string $sourceType, ?string $sourceName = null): NeuronAI\RAG\VectorStore\VectorStoreInterface
    {
        foreach (BxDolAIVectorStoreMariaDb::DIMENSIONS as $iDimension) {
            $this->tableName = BxDolAIVectorStoreMariaDb::tableForDimension($iDimension);
            parent::deleteBy($sourceType, $sourceName);
        }

        return $this;
    }

    public function similaritySearch(array $embedding): iterable
    {
        $this->tableName = BxDolAIVectorStoreMariaDb::tableForDimension(count($embedding));

        $oStatement = $this->pdo->prepare(sprintf(
            <<<'SQL'
                SELECT id, content, sourceType, sourceName, metadata,
                       VEC_DISTANCE_COSINE(embedding, VEC_FromText(:embedding)) AS distance
                FROM %s
                WHERE sourceType = :storeId
                ORDER BY distance ASC
                LIMIT %d
                SQL,
            $this->tableName,
            $this->topK,
        ));

        $oStatement->execute([
            ':embedding' => json_encode($embedding),
            ':storeId' => $this->sStoreId,
        ]);

        $aDocuments = [];
        while ($aRow = $oStatement->fetch(PDO::FETCH_ASSOC)) {
            $oDocument = new NeuronAI\RAG\Document($aRow['content']);
            $oDocument->id = $aRow['id'];
            $oDocument->sourceType = $aRow['sourceType'];
            $oDocument->sourceName = $aRow['sourceName'];
            $oDocument->score = NeuronAI\RAG\VectorSimilarity::similarityFromDistance((float)$aRow['distance']);

            $aMetadata = json_decode($aRow['metadata'] ?? '{}', true);
            if (is_array($aMetadata)) {
                foreach ($aMetadata as $sKey => $mixedValue) {
                    if (!in_array($sKey, ['content', 'sourceType', 'sourceName', 'score', 'embedding', 'id'], true))
                        $oDocument->addMetadata($sKey, $mixedValue);
                }
            }

            $aDocuments[] = $oDocument;
        }

        return $aDocuments;
    }
}

/** @} */

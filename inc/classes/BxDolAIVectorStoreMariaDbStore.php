<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * MariaDB vector search limited to one Studio store.
 * Rows from every store share sys_agents_vector_mariadb and are marked with sourceType.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAIVectorStoreMariaDbStore extends NeuronAI\RAG\VectorStore\MariaDBVectorStore
{
    public function __construct(
        PDO $oPdo,
        string $sTable,
        int $iTopK,
        protected string $sStoreId,
    ) {
        parent::__construct($oPdo, $sTable, $iTopK);
    }

    public function similaritySearch(array $embedding): iterable
    {
        $oStatement = $this->pdo->prepare(sprintf(
            <<<'SQL'
                SELECT id, content, sourceType, sourceName, metadata,
                       VEC_DISTANCE_EUCLIDEAN(embedding, VEC_FromText(:embedding)) AS distance
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

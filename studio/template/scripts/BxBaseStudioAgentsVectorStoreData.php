<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioAgentsVectorStoreData extends BxTemplStudioGridAgents
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
        $this->addMarkers($this->_aBrowseParams);
    }

    protected function _delete ($mixedId)
    {
        $r = $this->_oDb->getVectorStoreDataById($mixedId);
        $oVectorStore = BxDolAIVectorStoreFactory::getVectorStoreInstance($r['vector_store_id']);
        if ($oVectorStore) {
            $oVectorStore->deleteBySource($r['vector_store_id'], $r['id']);
        }

        $mixedResult = parent::_delete($mixedId);
        return $mixedResult;
    }

    protected function _getCellSize ($mixedValue, $sKey, $aField, $aRow) 
    {
        $mixedValue = bx_format_bytes($mixedValue);
        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    } 

    protected function _getCellStatus ($mixedValue, $sKey, $aField, $aRow) 
    {
        switch ($mixedValue) {
            case 'pending':
                $mixedValue = '<span title="Pending">⏳</span>';
                break;
            case 'processing':
                $mixedValue = '<span title="Processing">⚙️</span>';
                break;
            case 'ready':
                $mixedValue = '<span title="Ready">✅</span>';
                break;
            case 'error':
                $mixedValue = '<span title="Error">❌</span>';
                break;
        }        
        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    } 

    /**
     * Process files which were added to the vector store. 
     * It takes files converts it to the vector and store in the appropriate vector store.
     */
    static public function processPendingData()
    { 
        $iLimit = 5; // TODO: add to settings
        for ($i = 0; $i < $iLimit; $i++) {
            $a = BxDolAiQuery::getVectorStorePendingData(1);
            if (!$a)
                break;
            foreach ($a as $r) {
                BxDolAiQuery::updateVectorStoreDataStatus($r['id'], 'processing');

                $aVectorStore = BxDolAiQuery::getVectorStoreObject($r['vector_store_id']);
                $oVectorStore = BxDolAIVectorStoreFactory::getVectorStoreInstance($aVectorStore['id']);
                $oEmbedder = BxDolAIModelFactory::getModelInstance($aVectorStore['embedding_provider_id']);
                $sError = '';

                if ($oEmbedder && $oVectorStore) {
                    try {
                        $aSettings = $r['settings'] ? json_decode($r['settings'], true) : [];
                        $aMetadata = $r['metadata'] ? json_decode($r['metadata'], true) : [];

                        $documents = NeuronAI\RAG\DataLoader\StringDataLoader::for($r['content'])
                            ->withSplitter(
                            new NeuronAI\RAG\Splitter\DelimiterTextSplitter(
                                    maxLength: isset($aSettings['chunk_size']) ? $aSettings['chunk_size'] : 512,
                                    separator: isset($aSettings['delimiter']) ? $aSettings['delimiter'] : '.',
                                    wordOverlap: isset($aSettings['overlap']) ? $aSettings['overlap'] : 2
                                )
                            )
                            ->getDocuments(); 
                        
                        foreach ($documents as $document) {
                            $document->sourceType = $r['vector_store_id'];
                            $document->sourceName = $r['id'];
                            if (!empty($aMetadata))
                                $document->metadata = $aMetadata;
                        }

                        $oVectorStore->addDocuments(
                            $oEmbedder->embedDocuments($documents)
                        );
                    } 
                    catch (Exception $e) {
                        $sError = "Error process vector store data ({$r['id']}): " . $e->getMessage();
                    }
                    if (!$sError)
                        BxDolAiQuery::updateVectorStoreDataStatus($r['id'], 'ready');
                } 
                else {
                    $sError = "Can't process vector store data with id {$r['id']}, missing embedder({$aVectorStore['embedding_provider_id']}) or vector store({$aVectorStore['id']}) instance";
                }

                if ($sError) {
                    bx_log('sys_agents', $sError, BX_LOG_ERR);
                    BxDolAiQuery::updateVectorStoreDataStatus($r['id'], 'error');
                }
            }
        }
    }
}

/** @} */

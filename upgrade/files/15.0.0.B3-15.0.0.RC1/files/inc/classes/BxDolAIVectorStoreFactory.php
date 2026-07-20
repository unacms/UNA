<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */


class BxDolAIVectorStoreFactory extends BxDolFactory 
{
    public static function getVectorStoreInstance(int $iId): NeuronAI\RAG\VectorStore\VectorStoreInterface 
    {
        if (isset($GLOBALS['bxDolClasses'][__CLASS__ . '_VectorStore_' . $iId]))
            return $GLOBALS['bxDolClasses'][__CLASS__ . '_VectorStore_' . $iId];

        $a = BxDolAIQuery::getVectorStoreObject($iId);
        if (!$a) {
            bx_log('sys_agents', "Vector store with id {$iId} not found", BX_LOG_ERR);
            throw new Exception("Vector store with id {$iId} not found");
        }

        $aParametersSystem = !empty($a['params']) ? json_decode($a['params'], true) : [];
        $aParametersUser = !empty($a['params_user']) ? json_decode($a['params_user'], true) : [];
        $aParameters = array_merge($aParametersSystem, $aParametersUser);

        // replace marker {topk} in $aParameters recoursively
        $aParameters = bx_replace_markers($aParameters, [
            'topk' => $a['topk'],
        ]);
        
        switch($a['type']) {
            case 'file':
                $sDirectoryStores = BX_DIRECTORY_STORAGE . 'vector_stores/';
                $sDirectory = $sDirectoryStores . $iId;
                $sFile = '/data.store';
                if (!file_exists($sDirectory . $sFile)) {
                    @mkdir($sDirectoryStores, BX_DOL_DIR_RIGHTS);
                    @chmod($sDirectoryStores, BX_DOL_DIR_RIGHTS);
                    @mkdir($sDirectory, BX_DOL_DIR_RIGHTS);
                    @chmod($sDirectory, BX_DOL_DIR_RIGHTS);
                    @touch($sDirectory . $sFile);
                    @chmod($sDirectory . $sFile, BX_DOL_FILE_RIGHTS);
                }
                $o = new NeuronAI\RAG\VectorStore\FileVectorStore(
                    directory: $sDirectory,
                    topK: $a['topk'] ?? 4,
                    name: 'data',
                    ext: '.store'
                );
                break;
            case 'pinecon':
                $o = new NeuronAI\RAG\VectorStore\PineconeVectorStore(
                    key: $a['key'],
                    indexUrl: $aParameters['indexUrl'],
                    topK: $a['topk'] ?? 4,
                    version: $aParameters['version'] ?? '2025-04',
                    namespace: $aParameters['namespace'] ?? '__default__'
                );
                break;
            case 'elasticsearch':
                $oClient = Elastic\Elasticsearch\ClientBuilder::create()
                    ->setHosts([$aParameters['client_params']['endpoint']])
                    ->setApiKey($aParameters['client_params']['key'])
                    ->build();
                
                $o = new NeuronAI\RAG\VectorStore\ElasticsearchVectorStore(
                    client: $oClient,
                    index: $aParameters['index'],
                    topK: $a['topk'] ?? 4
                );
                break;
            case 'opensearch':
                $oClient = (new OpenSearch\GuzzleClientFactory())->create([
                    'base_uri' => $aParameters['client_params']['endpoint'] ?? 'http://localhost:9200',
                ]);
        
                $o = NeuronAI\RAG\VectorStore\OpenSearchVectorStore(
                    client: $oClient,
                    index: $aParameters['index'],
                    topK: $a['topk'] ?? 4,
                );
                break;
            case 'typesense':
                $oClient = new \Typesense\Client($aParameters['client_params']);

                $o = new NeuronAI\RAG\VectorStore\TypesenseVectorStore(
                    client: $oClient,
                    collection: $aParameters['collection'],
                    vectorDimension: $aParameters['vectorDimension'] ?? 1024,
                    topK: $a['topk'] ?? 4,
                );
                break;
            case 'qdrant':
                $o = new NeuronAI\RAG\VectorStore\QdrantVectorStore(
                    collectionUrl: $aParameters['collectionUrl'],
                    key: $a['key'],
                    topK: $a['topk'] ?? 4,
                    dimension: $aParameters['dimension'] ?? 1024
                );
                break;
            case 'chromadb':
                $o = new NeuronAI\RAG\VectorStore\ChromaVectorStore(
                    collection: $aParameters['collection'],
                    host: $aParameters['host'] ?? 'http://localhost:8000',
                    tenant: $aParameters['tenant'] ?? 'default_tenant',
                    database: $aParameters['database'] ?? 'default_database',
                    key: $a['key'] ?? null,
                    topK: $a['topk'] ?? 4
                );
                break;
            case 'meilisearch':
                $o = new NeuronAI\RAG\VectorStore\MeilisearchVectorStore(
                    indexUid: $aParameters['indexUid'],
                    host: $aParameters['host'] ?? 'http://localhost:8000',
                    key: $a['key'] ?? null,
                    embedder: $aParameters['embedder'] ?? 'default',
                    topK: $a['topk'] ?? 4,
                    dimension: $aParameters['dimension'] ?? 1024
                );
                break;
            default:
                bx_log('sys_agents', "Vector store type {$a['type']} is not supported", BX_LOG_ERR);
                throw new Exception("Vector store type {$a['type']} is not supported");
        }

        $GLOBALS['bxDolClasses'][__CLASS__ . '_VectorStore_' . $iId] = $o;

        return $o;
    }
}

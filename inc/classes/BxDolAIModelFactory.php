<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAIModelFactory extends BxDolFactory
{
    public static function getModelInstance(int $iId, array $aOverrides = []): NeuronAI\Providers\AIProviderInterface | NeuronAI\RAG\Embeddings\EmbeddingsProviderInterface
    {
        $iMaxTokensOverride = (int)($aOverrides['max_tokens'] ?? 0);
        $sCacheKey = __CLASS__ . '_Model_' . $iId . ($iMaxTokensOverride > 0 ? '_' . $iMaxTokensOverride : '');
        if (isset($GLOBALS['bxDolClasses'][$sCacheKey]))
            return $GLOBALS['bxDolClasses'][$sCacheKey];

        $aProvidersWithKey = ['anthropic', 'openai-embeddings', 'voyageai-embeddings', 'openai-like-embeddings', 'openai-responses', 'openai-like'];
        $a = BxDolAIQuery::getModelObject($iId);
        if (!$a) {
            bx_log('sys_agents', "Agent AI Model with id {$iId} not found", BX_LOG_ERR);
            throw new Exception("Agent AI Model with id {$iId} not found");
        }
        $a['key'] = (string)$a['key'];
        if (in_array($a['type'], $aProvidersWithKey, true) && $a['key'] === '') {
            bx_log('sys_agents', "Model with id {$iId} has empty key, can't be used", BX_LOG_ERR);
            throw new Exception("Model with id {$iId} has empty key, can't be used");
        }

        if (!$a['active']) {
            bx_log('sys_agents', "Model with id {$iId} is not active, can't be used", BX_LOG_ERR);
            throw new Exception("Model with id {$iId} is not active, can't be used");
        }

        $aParametersSystem = !empty($a['params']) ? json_decode($a['params'], true) : [];
        $aParametersUser = !empty($a['params_user']) ? json_decode($a['params_user'], true) : [];
        $aParameters = array_merge($aParametersSystem, $aParametersUser);

        // replace markers {key} {model} in $aParameters recoursively
        $aParameters = bx_replace_markers($aParameters, [
            'key' => $a['key'],
            'model' => $a['model']
        ]);

        if ($iMaxTokensOverride > 0) {
            $aParameters['max_tokens'] = $iMaxTokensOverride;
            if (!isset($aParameters['parameters']) || !is_array($aParameters['parameters']))
                $aParameters['parameters'] = [];

            switch ($a['type']) {
                case 'openai-responses':
                    $aParameters['parameters']['max_output_tokens'] = $iMaxTokensOverride;
                    break;
                case 'azure-openai':
                    $aParameters['parameters']['max_completion_tokens'] = $iMaxTokensOverride;
                    break;
                case 'gemini':
                    if (!isset($aParameters['parameters']['generationConfig']) || !is_array($aParameters['parameters']['generationConfig']))
                        $aParameters['parameters']['generationConfig'] = [];
                    $aParameters['parameters']['generationConfig']['maxOutputTokens'] = $iMaxTokensOverride;
                    break;
                case 'ollama':
                    if (!isset($aParameters['parameters']['options']) || !is_array($aParameters['parameters']['options']))
                        $aParameters['parameters']['options'] = [];
                    $aParameters['parameters']['options']['num_predict'] = $iMaxTokensOverride;
                    break;
                case 'aws-bedrock':
                    if (!isset($aParameters['inferenceConfig']) || !is_array($aParameters['inferenceConfig']))
                        $aParameters['inferenceConfig'] = [];
                    $aParameters['inferenceConfig']['maxTokens'] = $iMaxTokensOverride;
                    break;
                default:
                    $aParameters['parameters']['max_tokens'] = $iMaxTokensOverride;
                    break;
            }
        }

        switch($a['type']) {
            // regular AI providers ------------------------
            case 'anthropic':
                $o = new NeuronAI\Providers\Anthropic\Anthropic(
                    key: $a['key'],
                    model: $a['model'],
                    version: $aParameters['version'] ?? '2023-06-01',
                    max_tokens: $aParameters['max_tokens'] ?? 8192,
                    parameters: $aParameters['parameters'] ?? [],
                );
                break;
            case 'openai-responses':
                $o = new NeuronAI\Providers\OpenAI\Responses\OpenAIResponses(
                    key: $a['key'],
                    model: $a['model'],
                    parameters: $aParameters['parameters'] ?? [],
                    strict_response: $aParameters['strict_response'] ?? false,
                );
                break;
            case 'azure-openai':
                $o = new NeuronAI\Providers\OpenAI\AzureOpenAI(
                    key: $a['key'],
                    model: $a['model'],
                    endpoint: $aParameters['endpoint'],
                    version: $aParameters['version'],
                    parameters: $aParameters['parameters'] ?? [],
                    strict_response: $aParameters['strict_response'] ?? false,
                );
                break;
            case 'openai-like':
                $o = new NeuronAI\Providers\OpenAILike(
                    baseUri: $aParameters['baseUri'],
                    key: $a['key'],
                    model: $a['model'],                    
                    parameters: $aParameters['parameters'] ?? [],
                    strict_response: $aParameters['strict_response'] ?? false,
                );
                break;
            case 'ollama':
                $o = new NeuronAI\Providers\Ollama\Ollama(
                    url: $aParameters['url'] ?? 'http://localhost:11434/api',
                    model: $a['model'],                    
                    parameters: $aParameters['parameters'] ?? [],
                );
                break;
            case 'gemini':
                $o = new NeuronAI\Providers\Gemini\Gemini(
                    key: $a['key'],
                    model: $a['model'],
                    parameters: $aParameters['parameters'] ?? [],
                );
                break;
            case 'mistral':
                $o = new NeuronAI\Providers\Mistral\Mistral(
                    key: $a['key'],
                    model: $a['model'],
                    parameters: $aParameters['parameters'] ?? [],
                    strict_response: $aParameters['strict_response'] ?? false,
                );
                break;
            case 'huggingface':
                $o = new NeuronAI\Providers\HuggingFace\HuggingFace(
                    key: $a['key'],
                    model: $a['model'],
                    inferenceProvider: $aParameters['inferenceProvider'] ?? 'hf-inference/models', // cohere, groq, etc - https://github.com/neuron-core/neuron-ai/blob/3.x/src/Providers/HuggingFace/InferenceProvider.php
                    parameters: $aParameters['parameters'] ?? [],
                    strict_response: $aParameters['strict_response'] ?? false,
                );
                break;
            case 'deepseek':
                $o = new NeuronAI\Providers\Deepseek\Deepseek(
                    key: $a['key'],
                    model: $a['model'],
                    parameters: $aParameters['parameters'] ?? [],
                    strict_response: $aParameters['strict_response'] ?? false,
                );
                break;
            case 'grok':
                $o = new NeuronAI\Providers\XAI\Grok(
                    key: $a['key'],
                    model: $a['model'],
                    parameters: $aParameters['parameters'] ?? [],
                    strict_response: $aParameters['strict_response'] ?? false,
                );
                break;
            case 'aws-bedrock':
                $oClient = new Aws\BedrockRuntime\BedrockRuntimeClient($aParameters['client_params']);

                $o = new NeuronAI\Providers\AWS\BedrockRuntime(
                    client: $oClient,
                    model: $a['model'],
                    inferenceConfig: $aParameters['inferenceConfig'] ?? [],
                );
                break;
            case 'cohere':
                $o = new NeuronAI\Providers\Cohere\Cohere(
                    key: $a['key'],
                    model: $a['model'],
                    baseUri: $aParameters['baseUri'] ?? 'https://api.cohere.ai/v2',
                    parameters: $aParameters['parameters'] ?? [],
                    strict_response: $aParameters['strict_response'] ?? false,
                );
                break;

            // embeddings models ------------------------
            case 'ollama-embeddings':
                $o = new NeuronAI\RAG\Embeddings\OllamaEmbeddingsProvider(
                    model: $a['model'],
                    url: $aParameters['url'] ?? 'http://localhost:11434/api',
                    parameters: $aParameters['parameters'] ?? [],
                );
                break;
            case 'voyageai-embeddings':
                $o = new NeuronAI\RAG\Embeddings\VoyageEmbeddingsProvider(
                    key: $a['key'],
                    model: $a['model'],
                    dimensions: !empty($aParameters['dimensions']) ? (int)$aParameters['dimensions'] : null
                );
                break;
            case 'openai-embeddings':
                $o = new NeuronAI\RAG\Embeddings\OpenAIEmbeddingsProvider(
                    key: $a['key'],
                    model: $a['model'],
                    dimensions: !empty($aParameters['dimensions']) ? (int)$aParameters['dimensions'] : 1024
                );
                break;
            case 'openai-like-embeddings':
                $o = new NeuronAI\RAG\Embeddings\OpenAILikeEmbeddings(
                    baseUri: $aParameters['baseUri'],
                    key: $a['key'],
                    model: $a['model'],                    
                    dimensions: !empty($aParameters['dimensions']) ? (int)$aParameters['dimensions'] : 1024
                );
                break;
            case 'aws-bedrock-embeddings':
                $oClient = new Aws\BedrockRuntime\BedrockRuntimeClient($aParameters['client_params']);
                $o = new NeuronAI\RAG\Embeddings\AwsBedrockEmbeddingsProvider(
                    client: $oClient,
                    model: $a['model']
                );
                break;
            default:
                bx_log('sys_agents', "Model type {$a['type']} is not supported", BX_LOG_ERR);
                throw new Exception("Model type {$a['type']} is not supported");
        }

        $GLOBALS['bxDolClasses'][$sCacheKey] = $o;

        return $o;
    }
}

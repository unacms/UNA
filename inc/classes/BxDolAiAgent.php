<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\RAG\RAG;
use NeuronAI\Agent\Observability\ToolCalled;
use NeuronAI\Chat\History\InMemoryMessageStore;
use NeuronAI\Chat\History\MessageStoreInterface;
use NeuronAI\Chat\Messages\Message;
use NeuronAI\Observability\LogListener;
use NeuronAI\Observability\ObservabilityEvent;

class BxDolAiAgent extends RAG
{
    public function __construct(protected array $aAgent, protected array $aParams = [])
    {
        // the thread of the agent is the identity of its workflow run and of its chat history
        parent::__construct(BxDolAiChat::threadId($this->aAgent, $this->aParams));

        $sKey = getParam('sys_agents_inspector_key');
        if ($sKey) {
            $oInspector = Inspector\Neuron\V4\InspectorSubscriber::instance(
                key: $sKey,
            );
            $this->subscribe(ObservabilityEvent::class, $oInspector);
        }
        else {
            $logger = new BxDolLoggerDb('sys_agents_' . $this->aAgent['id']);
            $this->subscribe(ObservabilityEvent::class, new LogListener($logger));
        }

        // what the agent did (comments, content, SQL) — shown as activity history
        $this->subscribe(ToolCalled::class, new BxDolAiActivityObserver($this->aAgent, $this->aParams));
    }

    protected function provider(): NeuronAI\Providers\AIProviderInterface
    {
        $aOverrides = [];
        if ((int)($this->aAgent['max_tokens'] ?? 0) > 0)
            $aOverrides['max_tokens'] = (int)$this->aAgent['max_tokens'];

        return BxDolAIModelFactory::getModelInstance((int)$this->aAgent['model_id'], $aOverrides);
    }

    protected function instructions(): string
    {
        $aPromptSystem = !empty($this->aAgent['prompt_system']) ? [$this->aAgent['prompt_system']] : [];
        $aPromptSteps = !empty($this->aAgent['prompt_steps']) ? [$this->aAgent['prompt_steps']] : [];
        $aPromptTools = !empty($this->aAgent['prompt_tools']) ? [$this->aAgent['prompt_tools']] : [];
        $aPromptOutput = !empty($this->aAgent['prompt_output']) ? [$this->aAgent['prompt_output']] : [];

        $aPromptTools[] = "Always use agent profile id = {$this->aAgent['profile_id']} as author ('profile_id' or 'author_profile_id' tool parameter), unless explicitly specified in the user instructions, no other variants strictly.";

        if ('alert' == $this->aAgent['trigger']) {
            if (!$this->aAgent['async']) {
                $aPromptTools[] = "Return array only, modified version of 'extra' array. Modifyable keys: " . $this->getAlertTriggerModifyableKeys() . ".";
            }

            $sDesc = trim(BxDolAiQuery::getAlertDesc($this->aAgent['alert']));
            if ('.' != mb_substr($sDesc, -1))
                $sDesc .= '.';
            $aPromptSystem[] = $sDesc;
        }

        $oPrompt = new NeuronAI\Agent\SystemPrompt(
            background: $aPromptSystem,
            steps: $aPromptSteps,
            output: $aPromptOutput,
            toolsUsage: $aPromptTools
        );
        return (string) $oPrompt;
    }

    /**
     * @return \NeuronAI\Tools\ToolInterface[]
     */
    protected function tools(): array
    {
        $aToolInstances = [];
        foreach (BxDolAiAgentTools::resolveIds($this->aAgent) as $iToolId) {
            if (!BxDolAiQuery::getToolObject($iToolId))
                continue;
            $aToolInstances[] = BxDolAIToolFactory::getToolInstance($iToolId);
        }

        return $aToolInstances;
    }
    
    protected function vectorStore(): NeuronAI\RAG\VectorStore\VectorStoreInterface
    {
        if ($this->aAgent['vector_store_id'])
            return BxDolAIVectorStoreFactory::getVectorStoreInstance($this->aAgent['vector_store_id']);
        else
            return new NeuronAI\RAG\VectorStore\MemoryVectorStore();
    }

    /**
     * Retrieval is built for every chat. A una-proxy store is searched on the
     * master. Any other store needs an embedding model on this site.
     */
    protected function retrieval(): NeuronAI\RAG\Retrieval\RetrievalInterface
    {
        if (($this->aAgent['vector_store_type'] ?? '') === 'una-proxy') {
            return new BxDolAiRetrievalUnaProxy(
                (string)getParam('sys_oauth_key'),
                (string)getParam('sys_oauth_secret')
            );
        }

        if (!isset($this->embeddingsProvider)) {
            if ((int)($this->aAgent['vector_store_id'] ?? 0) > 0)
                throw new Exception("Vector store {$this->aAgent['vector_store_id']} has no embedding model");

            return new BxDolAiRetrievalNone();
        }

        return new NeuronAI\RAG\Retrieval\SimilarityRetrieval(
            $this->resolveVectorStore(),
            $this->resolveEmbeddingsProvider()
        );
    }

    protected function embeddings(): NeuronAI\RAG\Embeddings\EmbeddingsProviderInterface
    {
        throw new Exception('Embedding model is not configured');
    }

    protected function messageStore(): MessageStoreInterface
    {
        if ($this->aAgent['chat_history_context'])
            return new BxDolAiChatHistory();

        return new InMemoryMessageStore();
    }

    protected function contextWindow(): int
    {
        if ($this->aAgent['chat_history_context'])
            return (int)$this->aAgent['chat_history_context'];

        return 50000;
    }

    /**
     * Save the changed version of a message already stored in the chat history of the agent.
     */
    public function updateStoredMessage(Message $oMessage): bool
    {
        $oStore = $this->resolveMessageStore();
        if (!($oStore instanceof BxDolAiChatHistory))
            return false;

        return $oStore->replace($this->requireWorkflowId(), $oMessage);
    }

    /**
     * Turn tool exceptions into a tool result so chat history stays a valid sequence.
     *
     * @return callable|null fn(\Throwable $e, \NeuronAI\Tools\ToolInterface $tool): string
     */
    protected function resolveToolErrorHandler(): ?callable
    {
        return function (\Throwable $e, NeuronAI\Tools\ToolInterface $tool): string {
            return 'Tool "' . $tool->getName() . '" failed: ' . $e->getMessage();
        };
    }

    protected function getAlertTriggerModifyableKeys(): string
    {
        if ('alert' != $this->aAgent['trigger'])
            return 'none';

        $aAlert = BxDolAiQuery::getAlert($this->aAgent['alert']);
        if (!$aAlert)
            return 'none';

        $aKeys = json_decode($aAlert['extra_refs']);
        if (!$aKeys)
            return 'none';

        return implode(',', $aKeys);
    }
}
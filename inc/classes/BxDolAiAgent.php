<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\RAG\RAG;
use NeuronAI\Observability\InspectorObserver;
use NeuronAI\Observability\LogObserver;

class BxDolAiAgent extends RAG
{
    public function __construct(protected array $aAgent, protected array $aParams = [])
    {
        parent::__construct();

        $sKey = getParam('sys_agents_inspector_key');
        if ($sKey) {
            $logger = InspectorObserver::instance(
                key: $sKey,
                autoFlush: true,
            );
            $this->observe($logger);
        }
        else {
            $logger = new BxDolLoggerDb('sys_agents_' . $this->aAgent['id']);
            $this->observe(new LogObserver($logger));
        }
    }

    protected function provider(): NeuronAI\Providers\AIProviderInterface
    {
        return BxDolAIModelFactory::getModelInstance($this->aAgent['model_id']);
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
        if ($this->aAgent['tools']) {
            $aTools = explode(',', $this->aAgent['tools']);
            $aToolInstances = [];
            foreach ($aTools as $iToolId) {
                $oTool = BxDolAIToolFactory::getToolInstance($iToolId);
                $aToolInstances[] = $oTool;                
            }
            return $aToolInstances;
        }
        else {
            return [];
        }
    }
    
    protected function vectorStore(): NeuronAI\RAG\VectorStore\VectorStoreInterface
    {
        if ($this->aAgent['vector_store_id'])
            return BxDolAIVectorStoreFactory::getVectorStoreInstance($this->aAgent['vector_store_id']);
        else
            return new NeuronAI\RAG\VectorStore\MemoryVectorStore();
    }

    protected function chatHistory(): NeuronAI\Chat\History\ChatHistoryInterface
    {
        if ($this->aAgent['chat_history_context']) {
            return new BxDolAiChatHistory(
                thread_id: $this->getСhatHistoryThreadId(),
                pdo: BxDolDb::getInstance()->getLink(),
                table: 'sys_agents_chat_history',
                contextWindow: $this->aAgent['chat_history_context']
            );
        }
        else {
            return new NeuronAI\Chat\History\InMemoryChatHistory(
                contextWindow: 50000
            );
        }
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

    protected function getСhatHistoryThreadId(): string
    {
        return BxDolAI::chatHistoryThreadId($this->aAgent, $this->aParams);
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
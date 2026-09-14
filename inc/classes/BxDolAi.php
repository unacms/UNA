<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAi extends BxDolFactory implements iBxDolSingleton
{
    protected $_oDb;
    protected $_iProfileId;

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_oDb = new BxDolAiQuery();

        $this->_iProfileId = (int)getParam('sys_profile_bot');
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__])) {
            $GLOBALS['bxDolClasses'][__CLASS__] = BxDolDb::getInstance()->isTableExists('sys_agents_agents') ? new BxDolAi() : null;
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public static function getAgentInstance(int $iId, array $aParams = []): NeuronAI\Agent\Agent
    {
        if (isset($GLOBALS['bxDolClasses'][__CLASS__ . '_Agent_' . $iId]))
            return $GLOBALS['bxDolClasses'][__CLASS__ . '_Agent_' . $iId];

        $a = BxDolAiQuery::getAgentObject($iId);
        if (!$a) {
            $s = "Agent with id {$iId} not found";
            bx_log('sys_agents', $s, BX_LOG_ERR);
            throw new Exception($s);
        }
        if (!$a['active']) {
            $s = "Agent with id {$iId} isn't active";
            bx_log('sys_agents', $s, BX_LOG_ERR);
            throw new Exception($s);
        }
        if (!$a['prompt_system'] || !$a['model_id']) {
            $s = "Agent with id {$iId} can't be used because it haven't prompt or AI model";
            bx_log('sys_agents', $s, BX_LOG_ERR);
            throw new Exception($s);
        }

        $o = BxDolAiAgent::make($a, $aParams);

        if ((int)$a['tools_max_run'] > 0)
            $o->toolMaxRuns($a['tools_max_run']);

        if ($a['vector_store_id']) {
            $aVectorStore = BxDolAiQuery::getVectorStoreObject($a['vector_store_id']);
            if ($aVectorStore && $aVectorStore['embedding_provider_id']) {
                $oEmbedder = self::getAiEmbeddingsProviderInstance($aVectorStore['embedding_provider_id']);
                $o->setEmbeddingsProvider($oEmbedder);
            }
        }

        $GLOBALS['bxDolClasses'][__CLASS__ . '_Agent_' . $iId] = $o;

        return $o;
    }

    public static function getAiProviderInstance(int $iId):NeuronAI\Providers\AIProviderInterface
    {
        return BxDolAIModelFactory::getModelInstance($iId);
    }

    public static function getAiEmbeddingsProviderInstance(int $iId):NeuronAI\RAG\Embeddings\EmbeddingsProviderInterface
    {
        return BxDolAIModelFactory::getModelInstance($iId);
    }

    public static function getDefaultModel()
    {
        return (int)getParam('sys_agents_model');
    }

    public function getProfileId()
    {
        return $this->_iProfileId;
    }

    public function getModels($aParams = [])
    {
        $aParamsDb = ['sample' => 'all_pairs'];
        if(isset($aParams['active']))
            $aParamsDb['active'] = $aParams['active'] === true ? 1 : 0;
        if(isset($aParams['capabilities']))
            $aParamsDb['capabilities'] = $aParams['capabilities'];

        return $this->_oDb->getModelsBy($aParamsDb);
    }

    public function callAgent($sType, $aAgent, $mixedParams = [])
    {
        return BxDolAiTrigger::getInstance($sType)->call($aAgent, $mixedParams);
    }

    /**
     * Whether the current (or given) member may interact with the agent
     * via chat, messenger, or form-input. Empty acl_levels means Nobody.
     * Site admins / Studio operators always may, so they can debug.
     */
    public function canInteract($aAgent, $iProfileId = false, $bAllowOperators = true)
    {
        if (!is_array($aAgent) || empty($aAgent['id']))
            return false;

        if ($bAllowOperators && isAdmin())
            return true;

        $iLevels = (int)($aAgent['acl_levels'] ?? 0);
        if (!$iLevels)
            return false;

        return (bool)BxDolAcl::getInstance()->isMemberLevelInSet($iLevels, $iProfileId);
    }

    /**
     * Direct HTTP chat (`sys-ai-chat`). Operators may talk to any trigger;
     * everyone else only `manual` and `message` agents they can interact with.
     */
    public function canChatDirectly($aAgent, $iProfileId = false)
    {
        if (!$this->canInteract($aAgent, $iProfileId))
            return false;

        if (isAdmin())
            return true;

        return in_array($aAgent['trigger'] ?? '', ['manual', 'message'], true);
    }

    public function extractChatPromptFromRequest($aData)
    {
        return BxDolAiTrigger::getInstance('chat')->extractPromptFromRequest($aData);
    }

    public function streamAgentChat($iAgentId, $sPrompt, $aParams = [], $sThreadId = null)
    {
        return BxDolAiTrigger::getInstance('chat')->stream($iAgentId, $sPrompt, $aParams, $sThreadId);
    }

    public function sendMessengerMessage($iSender, $iRecipient, $sMsg)
    {
        return BxDolAiTrigger::getInstance('message')->sendMessengerMessage($iSender, $iRecipient, $sMsg);
    }

    public function getAgentsByAlertUnitAndAction($sUnit, $sAction)
    {
        return BxDolAiTrigger::getInstance('alert')->getAgentsByUnitAndAction($sUnit, $sAction);
    }

    public function getAgentsBy($aParams)
    {
        return $this->_oDb->getAgentsBy($aParams);
    }

    public function getAgentsByProfileId($iProfileId)
    {
        return BxDolAiTrigger::getInstance('message')->getAgentsByProfileId($iProfileId);
    }

    public function getAgentsByFormObject($sFormObject)
    {
        return $this->_oDb->getAgentsByFormObject($sFormObject);
    }

    public function getAgentsByTriggerType($sTrigger)
    {
        return $this->_oDb->getAgentsByTriggerType($sTrigger);
    }

    public function getAgentByTriggerWebhookKey($sKey)
    {
        return BxDolAiTrigger::getInstance('webhook')->getAgentByKey($sKey);
    }
}

/** @} */

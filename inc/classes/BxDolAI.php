<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_AI_ASSISTANT', 'assistant');
define('BX_DOL_AI_AUTOMATOR_EVENT', 'event');
define('BX_DOL_AI_AUTOMATOR_SCHEDULER', 'scheduler');
define('BX_DOL_AI_AUTOMATOR_WEBHOOK', 'webhook');

define('BX_DOL_AI_AUTOMATOR_STATUS_AUTO', 'auto');
define('BX_DOL_AI_AUTOMATOR_STATUS_MANUAL', 'manual');
define('BX_DOL_AI_AUTOMATOR_STATUS_READY', 'ready');

class BxDolAI extends BxDolFactory implements iBxDolSingleton
{
    protected $_oDb;
    protected $_iProfileId;
    
    protected $_aExcludeAlertUnits;

    protected $_sCmtsAutomators;
    protected $_sCmtsAssistantsChats;

    protected $_bWriteLog;

    protected $_aChatContext;

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_oDb = new BxDolAIQuery();

        $this->_iProfileId = (int)getParam('sys_profile_bot'); 

        $this->_aExcludeAlertUnits = [
            'system', 'module_template_method_call'
        ];

        $this->_sCmtsAutomators = 'sys_agents_automators';
        $this->_sCmtsAssistantsChats = 'sys_agents_assistants_chats';

        $this->_bWriteLog = true;

        $this->_aChatContext = null;
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
            $GLOBALS['bxDolClasses'][__CLASS__] = BxDolDb::getInstance()->isTableExists('sys_agents_agents') ? new BxDolAI() : null;
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public static function getAgentInstance(int $iId, array $aParams = []): NeuronAI\Agent\Agent
    {
        if (isset($GLOBALS['bxDolClasses'][__CLASS__ . '_Agent_' . $iId]))
            return $GLOBALS['bxDolClasses'][__CLASS__ . '_Agent_' . $iId];

        $a = BxDolAIQuery::getAgentObject($iId);
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
            $aVectorStore = BxDolAIQuery::getVectorStoreObject($a['vector_store_id']);
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

    public static function callHelper($mixedHelper, $sMessage)
    {
        $oAI = BxDolAI::getInstance();
        if (is_numeric($mixedHelper))
            $aHelper = $oAI->getHelperById($mixedHelper);
        else
             $aHelper = $oAI->getHelperByName($mixedHelper);
        $oAIModel = $oAI->getModelObject($aHelper['model_id']);
        return $oAIModel->getResponseText($aHelper['prompt'], $sMessage);
    }

    public static function pruning()
    {
        BxDolAIAssistant::pruning();
    }

    public static function getDefaultApiKey()
    {
        return getParam('sys_agents_api_key');
    }

    public static function getDefaultModel()
    {
        return (int)getParam('sys_agents_model');
    }

    public static function getAssistantForStudio()
    {
        return ($iId = (int)getParam('sys_agents_studio_assistant')) != 0 ? $iId : 0;
    }

    public static function getAssistantForLiveSearch()
    {
        return ($iId = (int)getParam('sys_agents_live_search_assistant')) != 0 ? $iId : 0;
    }

    public static function getAssistantForAskBlock()
    {
        return ($iId = (int)getParam('sys_agents_ask_block_assistant')) != 0 ? $iId : 0;
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

        return $aModel = $this->_oDb->getModelsBy($aParamsDb);
    }

    public function getModel($iId)
    {
        $aModel = $this->_oDb->getModelsBy(['sample' => 'id', 'id' => $iId]);
        if(!empty($aModel['params']))
            $aModel['params'] = json_decode($aModel['params'], true);

        return $aModel;
    }

    public function getModelObject($iId)
    {
        if(!$iId)
            $iId = $this->getDefaultModel();
        if(!$iId)
            return false;

        return BxDolAIModel::getObjectInstance($iId);
    }
    
    public function getProviderObject($iId)
    {
        if(!$iId)
            return false;

        return BxDolAIProvider::getObjectInstance($iId);
    }   

    public function getAssistants($aParams = [])
    {
        $aParamsDb = ['sample' => 'all_pairs'];
        if(isset($aParams['active']))
            $aParamsDb['active'] = $aParams['active'] === true ? 1 : 0;
        if(isset($aParams['hidden']))
            $aParamsDb['hidden'] = $aParams['hidden'] === true ? 1 : 0;

        return $aModel = $this->_oDb->getAssistantsBy($aParamsDb);
    }

    public function getAssistantById($iId)
    {
        return $this->_oDb->getAssistantsBy(['sample' => 'id', 'id' => $iId]);
    }

    public function getAssistantByName($sName)
    {
        return $this->_oDb->getAssistantsBy(['sample' => 'name', 'name' => $sName]);
    }

    public function getAssistantChatById($iId)
    {
        return $this->_oDb->getChatsBy(['sample' => 'id', 'id' => $iId]);
    }

    public function getAssistantChatsTransient($iLifetime = 0)
    {
        return $this->_oDb->getChatsBy(['sample' => 'type', 'type' => BX_DOL_AI_ASST_TYPE_TRANSIENT, 'lifetime' => $iLifetime]);
    }

    public function updateAssistantChatById($iId, $aSet)
    {
        return $this->_oDb->updateChats($aSet, ['id' => $iId]);
    }

    public function getAssistantChatCmts()
    {
        return $this->_sCmtsAssistantsChats;
    }

    public function getAssistantChatCmtsObject($iId, $oTemplate = false)
    {
        $oCmts = BxDolCmts::getObjectInstance($this->_sCmtsAssistantsChats, (int)$iId, true, $oTemplate);
        if(!$oCmts || !$oCmts->isEnabled())
            return false;

        return $oCmts;
    }

    public function getHelperById($iId)
    {
        return $this->_oDb->getHelpersBy(['sample' => 'id', 'id' => $iId]);
    }
    
    public function getHelperByName($sName)
    {
        return $this->_oDb->getHelpersBy(['sample' => 'name', 'name' => $sName]);
    }

    public function getAutomator($iId, $bFullInfo = false)
    {
        $aAutomator = $this->_oDb->getAutomatorsBy(['sample' => 'id' . ($bFullInfo ? '_full' : ''), 'id' => $iId]);
        if(!empty($aAutomator['params']))
            $aAutomator['params'] = json_decode($aAutomator['params'], true);
        if($bFullInfo && !empty($aAutomator['model_params']))
            $aAutomator['model_params'] = json_decode($aAutomator['model_params'], true);

        return $aAutomator;
    }

    public function getAutomatorInstruction($sType, $mixedParams = false)
    {
        $mixedResult = '';

        switch($sType) {
            case 'profile':
                $mixedResult = "\n ProfileId for system actions = " . $mixedParams;
                break;

            case 'providers':
                $aProviders = $this->_oDb->getProvidersBy(['sample' => 'ids', 'ids' => $mixedParams]);
                if(!empty($aProviders) && is_array($aProviders)) {
                    $mixedResult = "\n Proividers list = [";
                    foreach($aProviders as $aProvider)
                        $mixedResult .= "\n {'ProviderName' => '" . $aProvider['name'] . "',  'ProviderType' => '" . $aProvider['type_name'] . "'}";
                    $mixedResult .= "\n ]";
                }
                break;

            case 'helpers':
                $aHelpers = $this->_oDb->getHelpersBy(['sample' => 'ids', 'ids' => $mixedParams]);
                if(!empty($aHelpers) && is_array($aHelpers)) {
                    $mixedResult = "\n Helpers list = [";
                    foreach($aHelpers as $aHelper)
                        $mixedResult .= "\n {'" . $aHelper['name'] . "', 'HelperDescription' => '" . $aHelper['description'] . "'}";
                    $mixedResult .= "\n ]";
                }
                break;

            case 'assistants':
                $aAssistants = $this->_oDb->getAssistantsBy(['sample' => 'ids', 'ids' => $mixedParams]);
                if(!empty($aAssistants) && is_array($aAssistants)) {
                    $mixedResult = "\n Assistants list = [";
                    foreach($aAssistants as $aAssistant)
                        $mixedResult .= "\n {'" . $aAssistant['name'] . "', 'AssistantDescription' => '" . $aAssistant['description'] . "'}";
                    $mixedResult .= "\n ]";
                }
                break;
        }

        return $mixedResult;
    }

    public function getAutomatorCmts()
    {
        return $this->_sCmtsAutomators;
    }

    public function getAutomatorCmtsObject($iId, $oTemplate = false)
    {
        $oCmts = BxDolCmts::getObjectInstance($this->_sCmtsAutomators, (int)$iId, true, $oTemplate);
        if(!$oCmts || !$oCmts->isEnabled())
            return false;

        return $oCmts;
    }

    public function hasAutomators($sType, $bActive = null)
    {
        $aParams = [
            'sample' => 'type', 
            'type' => $sType
        ];
        if($bActive !== null)
            $aParams['active'] = $bActive;

        return ($aAutomators = $this->_oDb->getAutomatorsBy($aParams)) && is_array($aAutomators);
    }

    public function getAutomatorsEvent($sUnit, $sAction)
    {
        if(in_array($sUnit, $this->_aExcludeAlertUnits))
            return [];

        return $this->_oDb->getAutomatorsBy([
            'sample' => 'events', 
            'alert_unit' => $sUnit,
            'alert_action' => $sAction,
            'active' => true
        ]);
    }

    public function getAutomatorsScheduler()
    {
        $aAutomators = $this->_oDb->getAutomatorsBy(['sample' => 'schedulers', 'active' => true]);
        foreach($aAutomators as &$aAutomator)
            if(!empty($aAutomator['params']))
                $aAutomator['params'] = json_decode($aAutomator['params'], true);

        return $aAutomators;
    }

    public function getAutomatorsWebhook($iProviderId)
    {
        $aAutomators = $this->_oDb->getAutomatorsBy(['sample' => 'webhooks', 'provider_id' => $iProviderId, 'active' => true]);
        foreach($aAutomators as &$aAutomator)
            if(!empty($aAutomator['params']))
                $aAutomator['params'] = json_decode($aAutomator['params'], true);

        return $aAutomators;
    }

    public function callAgent($sType, $aAgent, $mixedParams = [])
    {
        if ($mixedParams)
            $sParams = is_string($mixedParams) ? $mixedParams : json_encode($mixedParams);
        else
            $sParams = 'START';

        // update sample data
        $a = ['webhook' => 'webhook_sample'];
        if (isset($a[$sType]) && empty($aAgent[$a[$sType]])) {
            $this->_oDb->updateAgentField($aAgent['id'], $a[$sType], $sParams);
        }

        // set additional params
        $aParams = [];
        if ('message' == $sType || 'form-input' == $sType || 'alert' == $sType) {
            $aParams = ['chat_history_subindex' => (int)($mixedParams['sender_profile_id'] ?? 0)];
        }

        if ('message' == $sType && is_array($mixedParams) && isset($mixedParams['message_text'])) {
            $mixedParams['message_text'] = $this->applyChatInputLimit((string)$mixedParams['message_text'], $aAgent);
            $sParams = json_encode($mixedParams);
        }
        else if (is_string($mixedParams) && in_array($sType, ['manual', 'message'], true)) {
            $sParams = $this->applyChatInputLimit($sParams, $aAgent);
        }

        if (in_array($sType, ['manual', 'message'], true) && $this->isChatTurnLimitReached($aAgent, $this->getChatUserTurnCount($aAgent['id'], $aParams))) {
            $this->emitConversationClosed('limit', '', $aAgent, $aParams);
            return $this->getChatLimitMessage($aAgent);
        }

        if (in_array($sType, ['manual', 'message'], true) && $this->isChatSessionRateLimited($aAgent, $aParams))
            throw new Exception($this->getChatSessionRateLimitError());

        $this->_aChatContext = ['agent' => $aAgent, 'params' => $aParams];

        // call agent
        $mixed = '';
        try {                        
            $o = self::getAgentInstance($aAgent['id'], $aParams);
            if (!$o)
                return false;

            $oMessage = $o->chat(new NeuronAI\Chat\Messages\UserMessage($sParams))->getMessage();

            $mixed = $oMessage->getContent();

        } catch (Exception $exception) {            
            bx_log('sys_agents', "Exception in '{$aAgent['name']}' agent: " . $exception->getMessage() . " INPUT:" . $sParams, BX_LOG_ERR);
            $mixed = _t('_sys_agents_exception');
        }

        return $mixed;
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

    /**
     * Runner limits from the agent row. 0 = no cap. Never put these in the prompt.
     */
    public function applyChatInputLimit($sPrompt, $aAgent)
    {
        $sPrompt = (string)$sPrompt;
        $iMax = (int)($aAgent['max_input_chars'] ?? 0);
        if ($iMax <= 0)
            return $sPrompt;

        if (function_exists('mb_strlen') && function_exists('mb_substr')) {
            if (mb_strlen($sPrompt, 'UTF-8') > $iMax)
                return mb_substr($sPrompt, 0, $iMax, 'UTF-8');
            return $sPrompt;
        }

        return strlen($sPrompt) > $iMax ? substr($sPrompt, 0, $iMax) : $sPrompt;
    }

    public function getChatLimitMessage($aAgent)
    {
        $s = trim((string)($aAgent['limit_message'] ?? ''));
        return $s !== '' ? $s : 'This chat has reached its limit.';
    }

    public function getChatSessionRateLimitError()
    {
        $s = _t('_sys_agents_err_session_rate_limit');
        return ($s !== '' && $s !== '_sys_agents_err_session_rate_limit')
            ? $s
            : 'Too many chat sessions from this IP. Try again later.';
    }

    public function countChatUserTurns($aUiMessages)
    {
        $i = 0;
        if (!is_array($aUiMessages))
            return 0;
        foreach ($aUiMessages as $aMessage) {
            if (is_array($aMessage) && ($aMessage['role'] ?? '') === 'user')
                $i++;
        }
        return $i;
    }

    public function isChatTurnLimitReached($aAgent, $iTurns, $iRequestUserTurns = 0)
    {
        $iMax = (int)($aAgent['max_turns'] ?? 0);
        if ($iMax <= 0)
            return false;
        if ((int)$iTurns >= $iMax)
            return true;
        // Client transcript includes the message being submitted.
        return (int)$iRequestUserTurns > $iMax;
    }

    public function getChatUserTurnCount($iAgentId, $aParams = [])
    {
        if (!isset($aParams['chat_history_subindex']))
            $aParams = array_merge($this->resolveChatHistoryParams($iAgentId), $aParams);

        try {
            $o = self::getAgentInstance((int)$iAgentId, $aParams);
        } catch (Throwable $oException) {
            return 0;
        }

        $i = 0;
        foreach ($o->getChatHistory()->getMessages() as $oMessage) {
            if ($oMessage instanceof NeuronAI\Chat\Messages\ToolCallMessage
                || $oMessage instanceof NeuronAI\Chat\Messages\ToolResultMessage
            ) {
                continue;
            }
            if ($oMessage instanceof NeuronAI\Chat\Messages\UserMessage)
                $i++;
        }
        return $i;
    }

    /**
     * New chat threads per IP for this agent. 0 on the agent = no cap.
     * Continuation of an existing thread is not a new session.
     */
    public function isChatSessionRateLimited($aAgent, $aParams = [])
    {
        $iHour = (int)($aAgent['max_sessions_per_hour'] ?? 0);
        $iDay = (int)($aAgent['max_sessions_per_day'] ?? 0);
        if ($iHour <= 0 && $iDay <= 0)
            return false;

        if (!isset($aParams['chat_history_subindex']))
            $aParams = array_merge($this->resolveChatHistoryParams((int)($aAgent['id'] ?? 0)), $aParams);

        $sThreadId = self::chatHistoryThreadId($aAgent, $aParams);
        if (!$this->isNewChatSession($sThreadId))
            return false;

        $sIp = $this->getVisitorIpHash();
        if ($sIp === '0' || $sIp === '')
            return false;

        $sPrefix = ($aAgent['trigger'] ?? '') . ':' . ($aAgent['id'] ?? '');
        if ($sPrefix === ':')
            return false;

        if ($iHour > 0 && $this->countChatSessionsByIp($sIp, $sPrefix, 3600) >= $iHour)
            return true;
        if ($iDay > 0 && $this->countChatSessionsByIp($sIp, $sPrefix, 86400) >= $iDay)
            return true;

        return false;
    }

    protected function getVisitorIpHash()
    {
        if (!function_exists('getVisitorIP') || !function_exists('bx_get_ip_hash'))
            return '0';
        return (string)bx_get_ip_hash(getVisitorIP());
    }

    protected function isNewChatSession($sThreadId)
    {
        $sThreadId = (string)$sThreadId;
        if ($sThreadId === '')
            return true;

        $aRow = $this->_oDb->getRow("SELECT `ip`, `messages` FROM `sys_agents_chat_history` WHERE `thread_id` = :t", [
            't' => $sThreadId,
        ]);
        if (!$aRow)
            return true;

        $iIp = (int)($aRow['ip'] ?? 0);
        $sMessages = trim((string)($aRow['messages'] ?? ''));
        return $iIp <= 0 || $sMessages === '' || $sMessages === '[]';
    }

    protected function countChatSessionsByIp($sIp, $sPrefix, $iWindowSec)
    {
        $sSince = date('Y-m-d H:i:s', time() - (int)$iWindowSec);
        return (int)$this->_oDb->getOne("
            SELECT COUNT(*) FROM `sys_agents_chat_history`
            WHERE `ip` = :ip
              AND (`thread_id` = :prefix OR `thread_id` LIKE :prefix_like)
              AND `created_at` >= :since
        ", [
            'ip' => $sIp,
            'prefix' => $sPrefix,
            'prefix_like' => $sPrefix . ':%',
            'since' => $sSince,
        ]);
    }

    public function extractChatPromptFromRequest($aData)
    {
        if (!is_array($aData))
            return '';

        if (!empty($aData['prompt']) && is_string($aData['prompt']))
            return trim($aData['prompt']);

        if (empty($aData['messages']) || !is_array($aData['messages']))
            return '';

        for ($i = count($aData['messages']) - 1; $i >= 0; $i--) {
            $aMessage = $aData['messages'][$i];
            if (!is_array($aMessage))
                continue;

            if (($aMessage['role'] ?? '') !== 'user')
                continue;

            if (isset($aMessage['content']) && is_string($aMessage['content']))
                return trim($aMessage['content']);

            if (!empty($aMessage['parts']) && is_array($aMessage['parts'])) {
                $aText = [];
                foreach ($aMessage['parts'] as $aPart) {
                    if (is_array($aPart) && ($aPart['type'] ?? '') === 'text' && isset($aPart['content']))
                        $aText[] = $aPart['content'];
                }
                $s = trim(implode("\n", $aText));
                if ($s !== '')
                    return $s;
            }
        }

        return '';
    }

    /**
     * Guests: UNA session id. Members: profile id.
     * Guest chats remember agent ids in session so login can adopt those threads.
     */
    public function resolveChatHistoryParams($iAgentId = 0)
    {
        $iAgentId = (int)$iAgentId;
        $iProfileId = (int)bx_get_logged_profile_id();
        $oSession = BxDolSession::getInstance();
        $sSessionKey = 'ai_chat_agent_ids';

        if ($iProfileId) {
            $aIds = $oSession->getValue($sSessionKey);
            if (is_array($aIds) && $aIds) {
                $sSessionId = (string)$oSession->getId();
                if ($iAgentId)
                    $aIds[] = $iAgentId;
                foreach (array_unique(array_map('intval', $aIds)) as $iStoredAgentId) {
                    if (!$iStoredAgentId || $sSessionId === '')
                        continue;
                    $aAgent = BxDolAIQuery::getAgentObject($iStoredAgentId);
                    if ($aAgent)
                        $this->_oDb->adoptGuestChatHistory($aAgent, $sSessionId, $iProfileId);
                }
                $oSession->unsetValue($sSessionKey);
            }

            return [
                'sender_profile_id' => $iProfileId,
                'chat_history_subindex' => (string)$iProfileId,
            ];
        }

        if ($iAgentId) {
            $aIds = $oSession->getValue($sSessionKey);
            $aIds = array_map('intval', is_array($aIds) ? $aIds : []);
            if (!in_array($iAgentId, $aIds, true)) {
                $aIds[] = $iAgentId;
                $oSession->setValue($sSessionKey, $aIds);
            }
        }

        return [
            'sender_profile_id' => 0,
            'chat_history_subindex' => (string)$oSession->getId(),
        ];
    }

    /**
     * `{trigger}:{agentId}:{contextPid}:{userSubindex}`.
     * Context is omitted when 0 so existing site-wide threads still load.
     * User suffix (session id or profile id) stays last so adopt can replace it.
     */
    public static function chatHistoryThreadId($aAgent, $aParams = [])
    {
        $s = ($aAgent['trigger'] ?? '') . ':' . ($aAgent['id'] ?? '');
        $iContextPid = (int)($aParams['chat_history_context_pid'] ?? 0);
        if ($iContextPid > 0)
            $s .= ':' . $iContextPid;
        if (isset($aParams['chat_history_subindex']) && $aParams['chat_history_subindex'] !== '')
            $s .= ':' . (string)$aParams['chat_history_subindex'];
        return $s;
    }

    public function getChatHistoryRowId($aAgent, $aParams = [])
    {
        $sThreadId = self::chatHistoryThreadId($aAgent, $aParams);
        if ($sThreadId === '' || $sThreadId === ':')
            return 0;
        return (int)$this->_oDb->getOne("SELECT `id` FROM `sys_agents_chat_history` WHERE `thread_id` = :t", [
            't' => $sThreadId,
        ]);
    }

    public function getCurrentChatHistoryId()
    {
        if (!is_array($this->_aChatContext))
            return 0;

        $aAgent = $this->_aChatContext['agent'] ?? null;
        $aParams = $this->_aChatContext['params'] ?? [];
        if (!is_array($aAgent))
            return 0;

        return $this->getChatHistoryRowId($aAgent, is_array($aParams) ? $aParams : []);
    }

    public function emitConversationClosed($sReason, $sSummary = '', $aAgent = null, $aParams = null)
    {
        if (!is_array($aAgent) && is_array($this->_aChatContext))
            $aAgent = $this->_aChatContext['agent'] ?? null;
        if (!is_array($aParams) && is_array($this->_aChatContext))
            $aParams = $this->_aChatContext['params'] ?? [];
        if (!is_array($aAgent) || empty($aAgent['id']))
            return false;

        $iHistoryId = $this->getChatHistoryRowId($aAgent, is_array($aParams) ? $aParams : []);
        if ($iHistoryId <= 0)
            return false;

        if ($this->_oDb->isFieldExists('sys_agents_chat_history', 'closed_reason')) {
            $sClosed = (string)$this->_oDb->getOne(
                "SELECT `closed_reason` FROM `sys_agents_chat_history` WHERE `id` = :id",
                ['id' => $iHistoryId]
            );
            if ($sClosed !== '')
                return false;
        }

        bx_alert('system', 'agent_conversation_closed', $iHistoryId, 0, [
            'agent_id' => (int)$aAgent['id'],
            'summary' => (string)$sSummary,
            'reason' => (string)$sReason,
        ]);
        return true;
    }

    /**
     * @return array{thread_id:string,chat_history_context_pid:int,chat_history_subindex:string}|false
     */
    public static function parseChatHistoryThreadId($aAgent, $sThreadId)
    {
        $sThreadId = (string)$sThreadId;
        $sBase = ($aAgent['trigger'] ?? '') . ':' . ($aAgent['id'] ?? '');
        if ($sBase === ':' || $sThreadId === '')
            return false;
        if ($sThreadId !== $sBase && strpos($sThreadId, $sBase . ':') !== 0)
            return false;

        $sRest = $sThreadId === $sBase ? '' : substr($sThreadId, strlen($sBase) + 1);
        $aParts = $sRest === '' ? [] : explode(':', $sRest);
        $iContext = 0;
        $sSub = '';
        if (count($aParts) >= 2) {
            $iContext = (int)$aParts[0];
            $sSub = implode(':', array_slice($aParts, 1));
        } elseif (count($aParts) === 1) {
            $sSub = $aParts[0];
        }

        return [
            'thread_id' => $sThreadId,
            'chat_history_context_pid' => $iContext,
            'chat_history_subindex' => $sSub,
        ];
    }

    public function isOwnAgentChatThread($aAgent, $sThreadId)
    {
        $aParsed = self::parseChatHistoryThreadId($aAgent, $sThreadId);
        if (!$aParsed)
            return false;

        $aMine = $this->resolveChatHistoryParams((int)$aAgent['id']);
        $sMine = (string)($aMine['chat_history_subindex'] ?? '');
        return $sMine !== '' && $aParsed['chat_history_subindex'] === $sMine;
    }

    public function storedChatJsonToUiMessages($sJson)
    {
        $aStored = json_decode((string)$sJson, true);
        if (!is_array($aStored) || $aStored === [])
            return [];

        $aResult = [];
        $i = 0;
        foreach ($aStored as $aMessage) {
            if (!is_array($aMessage))
                continue;

            $sType = (string)($aMessage['type'] ?? '');
            if ($sType === 'tool_call' || $sType === 'tool_call_result')
                continue;

            $sRole = (string)($aMessage['role'] ?? '');
            if ($sRole === 'model')
                $sRole = 'assistant';
            if ($sRole !== 'user' && $sRole !== 'assistant')
                continue;

            $aParts = [];
            $mixedContent = $aMessage['content'] ?? '';
            if (is_string($mixedContent) && $mixedContent !== '') {
                $aParts[] = ['type' => 'text', 'content' => $mixedContent];
            } elseif (is_array($mixedContent)) {
                foreach ($mixedContent as $aBlock) {
                    if (!is_array($aBlock))
                        continue;
                    $sBlockType = (string)($aBlock['type'] ?? '');
                    $sBlockText = (string)($aBlock['content'] ?? '');
                    if ($sBlockText === '')
                        continue;
                    if ($sBlockType === 'text' || $sBlockType === '')
                        $aParts[] = ['type' => 'text', 'content' => $sBlockText];
                }
            }
            $sId = '';
            if (!empty($aMessage['__id']) && is_string($aMessage['__id']))
                $sId = $aMessage['__id'];
            elseif (!empty($aMessage['metadata']['__id']) && is_string($aMessage['metadata']['__id']))
                $sId = $aMessage['metadata']['__id'];

            $mixedActions = $aMessage['actions'] ?? ($aMessage['metadata']['actions'] ?? null);
            $aUi = $this->finalizeUiChatMessage($sId !== '' ? $sId : ('msg_' . $i), $sRole, $aParts, $mixedActions);
            if (!$aUi)
                continue;

            $aResult[] = $aUi;
            $i++;
        }

        return $aResult;
    }

    public function getChatHistoryUiMessagesByThread($aAgent, $sThreadId)
    {
        if (!self::parseChatHistoryThreadId($aAgent, $sThreadId))
            return false;

        $sJson = $this->_oDb->getOne("SELECT `messages` FROM `sys_agents_chat_history` WHERE `thread_id` = :t", [
            't' => (string)$sThreadId,
        ]);

        return $this->storedChatJsonToUiMessages($sJson);
    }

    public function getChatHistoryArtifactsByThread($aAgent, $sThreadId)
    {
        if (!self::parseChatHistoryThreadId($aAgent, $sThreadId))
            return [];

        return $this->_oDb->getChatArtifactsByThreadId((string)$sThreadId);
    }

    public function listAgentChatThreads($aAgent)
    {
        $aMineParams = $this->resolveChatHistoryParams((int)$aAgent['id']);
        $sMySub = (string)($aMineParams['chat_history_subindex'] ?? '');
        $sMyDefault = self::chatHistoryThreadId($aAgent, $aMineParams);

        $aOut = [];
        $bHaveMineDefault = false;
        $aRows = $this->_oDb->getAgentChatHistoryRows($aAgent);
        if (!is_array($aRows))
            $aRows = [];

        $aHistoryIds = [];
        foreach ($aRows as $aRow)
            $aHistoryIds[] = (int)($aRow['id'] ?? 0);
        $aArtifactsMap = $this->_oDb->getChatArtifactsForAgent($aAgent);
        if (!$aArtifactsMap && $aHistoryIds)
            $aArtifactsMap = $this->_oDb->getChatArtifactsByHistoryIds($aHistoryIds);

        foreach ($aRows as $aRow) {
            $sThreadId = (string)($aRow['thread_id'] ?? '');
            $aParsed = self::parseChatHistoryThreadId($aAgent, $sThreadId);
            if (!$aParsed)
                continue;

            $aUi = $this->storedChatJsonToUiMessages($aRow['messages'] ?? '');
            if (!$aUi && $sThreadId !== $sMyDefault)
                continue;

            $bMine = ($sMySub !== '' && $aParsed['chat_history_subindex'] === $sMySub);
            if ($sThreadId === $sMyDefault)
                $bHaveMineDefault = true;

            $iHistoryId = (int)($aRow['id'] ?? 0);
            $aArtifacts = ($iHistoryId && !empty($aArtifactsMap[$iHistoryId])) ? $aArtifactsMap[$iHistoryId] : [];
            $aOut[] = $this->formatAgentChatThread($aParsed, $aRow, $aUi, $bMine, $aArtifacts);
        }

        if (!$bHaveMineDefault && $sMyDefault !== '') {
            $aParsedMine = self::parseChatHistoryThreadId($aAgent, $sMyDefault);
            if ($aParsedMine)
                $aOut[] = $this->formatAgentChatThread($aParsedMine, [], [], true);
        }

        usort($aOut, function ($a, $b) {
            return strcmp((string)$b['updated_sort'], (string)$a['updated_sort']);
        });

        return $aOut;
    }

    protected function formatAgentChatThread($aParsed, $aRow, $aUi, $bMine, $aArtifacts = [])
    {
        $iContext = (int)$aParsed['chat_history_context_pid'];
        $sSub = (string)$aParsed['chat_history_subindex'];
        $sContextName = '';
        if ($iContext > 0) {
            $oContext = BxDolProfile::getInstance($iContext);
            $sContextName = $oContext ? $oContext->getDisplayName() : ('#' . $iContext);
        }

        $sTitle = _t('_sys_agents_agents_txt_guest_chat');
        $oProfile = (ctype_digit($sSub) && (int)$sSub > 0) ? BxDolProfile::getInstance((int)$sSub) : false;
        if ($oProfile)
            $sTitle = $oProfile->getDisplayName();
        if ($sContextName !== '')
            $sTitle .= ' · ' . $sContextName;

        $sReason = trim((string)($aRow['closed_reason'] ?? ''));
        $sStatus = $sReason !== '' ? 'closed' : 'opened';
        $sStatusLabel = $sStatus;
        if ($sStatus === 'closed' && $sReason !== '')
            $sStatusLabel .= ' (' . $sReason . ')';

        $aArtifacts = is_array($aArtifacts) ? $aArtifacts : [];
        $sCreated = $this->formatAgentChatThreadTime($aRow['created_at'] ?? '');
        $sUpdated = $this->formatAgentChatThreadTime($aRow['updated_at'] ?? '');
        $sUpdatedRaw = (string)($aRow['updated_at'] ?? '');

        $sMeta = 'status: ' . $sStatusLabel;
        $sDates = '';
        if ($sCreated !== '' && $sUpdated !== '')
            $sDates = $sCreated . ' - ' . $sUpdated;
        else if ($sCreated !== '')
            $sDates = $sCreated;
        else if ($sUpdated !== '')
            $sDates = $sUpdated;
        if ($sDates !== '')
            $sMeta .= "\n" . $sDates;

        return [
            'thread_id' => $aParsed['thread_id'],
            'writable' => $bMine ? 1 : 0,
            'context_pid' => $iContext,
            'title' => $sTitle,
            'meta' => $sMeta,
            'status' => $sStatus,
            'closed_reason' => $sReason,
            'created_at' => $sCreated,
            'updated_at' => $sUpdated,
            'artifacts' => is_array($aArtifacts) ? $aArtifacts : [],
            'updated_sort' => $sUpdatedRaw,
            'class_mine' => $bMine ? ' bx-agents-popup-chat-thread-mine' : '',
        ];
    }

    protected function formatAgentChatThreadTime($mixed): string
    {
        $s = trim((string)$mixed);
        if ($s === '' || $s === '0')
            return '';
        $i = ctype_digit($s) ? (int)$s : (int)strtotime($s);
        if ($i <= 86400)
            return '';
        return date('d.m.Y H:i', $i);
    }

    /**
     * Context from chat HTTP (`?context=`). Missing/0 = site-wide. Invalid/denied = false (403).
     * Posting in a group is not the same as viewing it; chat requires post by default.
     * @return int|false
     */
    public function resolveChatHistoryContextPid($bRequirePost = true)
    {
        $mixed = bx_get('context');
        if ($mixed === false)
            return 0;

        $iPid = (int)$mixed;
        if ($iPid <= 0)
            return 0;

        $oProfile = BxDolProfile::getInstance($iPid);
        if (!$oProfile || !bx_srv('system', 'is_module_context', [$oProfile->getModule()]))
            return false;

        if (!$this->isAllowedContextChat($oProfile, $bRequirePost))
            return false;

        return $iPid;
    }

    /**
     * Context of the current page (AI agent block).
     * `bx_get_page_info()` reads the URL; App page JSON merges `i`/`id` into $_GET instead.
     * @param bool $bRequirePost also require posting into the context (membership / post ACL)
     */
    public function resolveChatHistoryContextPidFromPage($bRequirePost = false)
    {
        $aInfo = bx_get_page_info();
        if ($aInfo && !empty($aInfo['context_profile_id']))
            return $this->filterContextPid((int)$aInfo['context_profile_id'], $bRequirePost);

        $sUri = bx_get('i');
        $iContentId = (int)bx_process_input(bx_get('id'), BX_DATA_INT);
        if ($sUri && $iContentId > 0) {
            $oPage = BxDolPage::getObjectInstanceByURI($sUri);
            $sModule = $oPage ? (string)$oPage->getModule() : '';
            if ($sModule !== '' && bx_srv('system', 'is_module_context', [$sModule])) {
                $oProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $sModule);
                if ($oProfile && ($iPid = $this->filterContextPid((int)$oProfile->id(), $bRequirePost)))
                    return $iPid;
            }
        }

        $iPid = (int)bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if ($iPid > 0 && ($iPid = $this->filterContextPid($iPid, $bRequirePost)))
            return $iPid;

        return 0;
    }

    public function filterContextPid($iPid, $bRequirePost = false)
    {
        $iPid = (int)$iPid;
        if ($iPid <= 0)
            return 0;

        $oProfile = BxDolProfile::getInstance($iPid);
        if (!$oProfile || !bx_srv('system', 'is_module_context', [$oProfile->getModule()]))
            return 0;

        if (!$this->isAllowedContextChat($oProfile, $bRequirePost))
            return 0;

        return $iPid;
    }

    protected function isAllowedContextChat($oProfile, $bRequirePost = false)
    {
        if ($oProfile->checkAllowedProfileView() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        if ($bRequirePost && $oProfile->checkAllowedPostInProfile() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return true;
    }

    /**
     * Transcript for TanStack `useChat` hydrate / `initialMessages`.
     * Loads the same NeuronAI chat history the agent uses when streaming.
     *
     * @param bool $bAppendLimitMessage when the session is at max_turns, append limit_message for the UI
     */
    public function getChatHistoryUiMessages($iAgentId, $aParams = [], $bAppendLimitMessage = true)
    {
        if (!isset($aParams['chat_history_subindex']))
            $aParams = array_merge($this->resolveChatHistoryParams($iAgentId), $aParams);

        $aAgent = BxDolAIQuery::getAgentObject((int)$iAgentId);
        if (!$aAgent || empty($aAgent['chat_history_context']))
            return [];

        $sThreadId = self::chatHistoryThreadId($aAgent, $aParams);
        $sJson = $this->_oDb->getOne("SELECT `messages` FROM `sys_agents_chat_history` WHERE `thread_id` = :t", [
            't' => $sThreadId,
        ]);
        $aStored = json_decode((string)$sJson, true);
        if (!is_array($aStored) || $aStored === [])
            return [];

        try {
            $o = self::getAgentInstance((int)$iAgentId, $aParams);
        } catch (Exception $oException) {
            bx_log('sys_agents', "Hydrate exception for agent {$iAgentId}: " . $oException->getMessage(), BX_LOG_ERR);
            return [];
        }

        $aResult = $this->neuronMessagesToUiMessages($o->getChatHistory()->getMessages());
        if ($bAppendLimitMessage && $this->isChatTurnLimitReached($aAgent, $this->countChatUserTurns($aResult))) {
            $aResult[] = [
                'id' => 'agent_limit_message',
                'role' => 'assistant',
                'parts' => [['type' => 'text', 'content' => $this->getChatLimitMessage($aAgent)]],
            ];
        }

        return $aResult;
    }

    /**
     * @param NeuronAI\Chat\Messages\Message[] $aMessages
     * @return array<int, array<string, mixed>>
     */
    protected function neuronMessagesToUiMessages($aMessages)
    {
        $aResult = [];
        $i = 0;

        foreach ($aMessages as $oMessage) {
            if (
                $oMessage instanceof NeuronAI\Chat\Messages\ToolCallMessage
                || $oMessage instanceof NeuronAI\Chat\Messages\ToolResultMessage
            ) {
                continue;
            }

            $sRole = $oMessage->getRole();
            if ($sRole === 'model')
                $sRole = 'assistant';
            if ($sRole !== 'user' && $sRole !== 'assistant')
                continue;

            $aParts = [];
            foreach ($oMessage->getContentBlocks() as $oBlock) {
                if ($oBlock instanceof NeuronAI\Chat\Messages\ContentBlocks\ReasoningContent) {
                    if ($oBlock->content !== '')
                        $aParts[] = ['type' => 'thinking', 'content' => $oBlock->content];
                    continue;
                }

                if ($oBlock instanceof NeuronAI\Chat\Messages\ContentBlocks\TextContent && $oBlock->content !== '')
                    $aParts[] = ['type' => 'text', 'content' => $oBlock->content];
            }

            $sId = $oMessage->getMetadata('__id');
            $aUi = $this->finalizeUiChatMessage(
                is_string($sId) && $sId !== '' ? $sId : ('msg_' . $i),
                $sRole,
                $aParts,
                $sRole === 'assistant' ? $oMessage->getMetadata('actions') : null
            );
            if (!$aUi)
                continue;

            $aResult[] = $aUi;
            $i++;
        }

        return $aResult;
    }

    /**
     * Split assistant JSON {content, actions} into UI text + actions.
     * User messages pass through unchanged.
     *
     * @param array<int, array<string, mixed>> $aParts
     * @return array<string, mixed>|null
     */
    protected function finalizeUiChatMessage($sId, $sRole, $aParts, $mixedActions = null)
    {
        $aActions = $sRole === 'assistant' ? $this->sanitizeChatActions($mixedActions) : [];
        if ($sRole === 'assistant') {
            $sText = '';
            foreach ($aParts as $aPart) {
                if (($aPart['type'] ?? '') === 'text')
                    $sText .= (string)($aPart['content'] ?? '');
            }
            $aParsed = $this->parseAssistantChatPayload($sText);
            if ($aParsed) {
                $aKept = [];
                foreach ($aParts as $aPart) {
                    if (($aPart['type'] ?? '') === 'text')
                continue;
                    $aKept[] = $aPart;
                }
                if ($aParsed['content'] !== '')
                    $aKept[] = ['type' => 'text', 'content' => $aParsed['content']];
                $aParts = $aKept;
                if (!$aActions)
                    $aActions = $aParsed['actions'];
            }
        }

        if (!$aParts && !$aActions)
            return null;

        $aOut = [
            'id' => $sId,
                'role' => $sRole,
                'parts' => $aParts,
            ];
        if ($sRole === 'assistant')
            $aOut['actions'] = $aActions;

        return $aOut;
    }

    /**
     * @return array{content: string, actions: array}|null
     */
    protected function parseAssistantChatPayload($sText)
    {
        $s = trim((string)$sText);
        if ($s === '')
            return null;

        if (preg_match('/^```(?:json)?\s*(\{.*\})\s*```$/s', $s, $aM))
            $s = trim($aM[1]);

        if ($s === '' || $s[0] !== '{') {
            $iStart = strpos($s, '{');
            $iEnd = strrpos($s, '}');
            if ($iStart === false || $iEnd === false || $iEnd <= $iStart)
                return null;
            $s = substr($s, $iStart, $iEnd - $iStart + 1);
        }

        $a = json_decode($s, true);
        if (!is_array($a) || !array_key_exists('content', $a) || !is_string($a['content']))
            return null;
        if (!array_key_exists('actions', $a))
            return null;

        return [
            'content' => $a['content'],
            'actions' => $this->sanitizeChatActions($a['actions']),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function sanitizeChatActions($mixed)
    {
        if (!is_array($mixed))
            return [];

        $aOut = [];
        foreach ($mixed as $aItem) {
            if (!is_array($aItem))
                continue;

            $sType = strtolower(trim((string)($aItem['type'] ?? '')));
            $sLabel = trim((string)($aItem['label'] ?? ''));
            if ($sLabel === '')
                continue;
            if (function_exists('mb_substr'))
                $sLabel = mb_substr($sLabel, 0, 80);
            else
                $sLabel = substr($sLabel, 0, 80);

            if ($sType === 'reply') {
                $aOut[] = ['type' => 'reply', 'label' => $sLabel];
            } elseif ($sType === 'link') {
                $sUrl = trim((string)($aItem['url'] ?? ''));
                if (!$this->isAllowedChatActionUrl($sUrl))
                    continue;
                $aOut[] = ['type' => 'link', 'label' => $sLabel, 'url' => $sUrl];
            }

            if (count($aOut) >= 8)
                break;
        }

        return $aOut;
    }

    protected function isAllowedChatActionUrl($sUrl)
    {
        $a = parse_url((string)$sUrl);
        if (($a['scheme'] ?? '') !== 'https' || empty($a['host']))
            return false;

        $sHost = strtolower((string)$a['host']);
        $aAllowed = ['hiweave.com', 'www.hiweave.com'];
        if (defined('BX_DOL_URL_ROOT')) {
            $aSite = parse_url(BX_DOL_URL_ROOT);
            if (!empty($aSite['host']))
                $aAllowed[] = strtolower((string)$aSite['host']);
        }

        return in_array($sHost, $aAllowed, true);
    }

    protected function sseChatEvent($aPayload)
    {
        return 'data: ' . json_encode($aPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
    }

    protected function parseSseChatEvent($sEvent)
    {
        $s = trim((string)$sEvent);
        if (!preg_match('/^data:\s*(.+)$/s', $s, $aM))
            return null;

        $a = json_decode($aM[1], true);
        return is_array($a) ? $a : null;
    }

    protected function resetChatActionsSseState()
    {
        return [
            'mode' => 'undecided',
            'buf' => '',
            'messageId' => '',
            'held' => [],
        ];
    }

    protected function emitHeldChatActionsSse(&$aState, $fEmit)
    {
        foreach ($aState['held'] as $sHeld)
            $fEmit($sHeld);
        $aState['held'] = [];
    }

    protected function emitParsedChatActionsSse(&$aState, $fEmit, $aParsed)
    {
        $sId = $aState['messageId'] !== '' ? $aState['messageId'] : ('msg_' . uniqid());
        $fEmit($this->sseChatEvent([
            'type' => 'TEXT_MESSAGE_START',
            'messageId' => $sId,
            'role' => 'assistant',
        ]));
        if ($aParsed['content'] !== '') {
            $fEmit($this->sseChatEvent([
                'type' => 'TEXT_MESSAGE_CONTENT',
                'messageId' => $sId,
                'delta' => $aParsed['content'],
            ]));
        }
        $fEmit($this->sseChatEvent([
            'type' => 'TEXT_MESSAGE_END',
            'messageId' => $sId,
        ]));
        if (!empty($aParsed['actions'])) {
            $fEmit($this->sseChatEvent([
                'type' => 'CUSTOM',
                'name' => 'chat_actions',
                'messageId' => $sId,
                'value' => $aParsed['actions'],
            ]));
        }
        $aState = $this->resetChatActionsSseState();
    }

    protected function processChatActionsSseEvent($sEvent, &$aState, $fEmit)
    {
        $aPayload = $this->parseSseChatEvent($sEvent);
        $sType = is_array($aPayload) ? (string)($aPayload['type'] ?? '') : '';

        if ($sType === 'TEXT_MESSAGE_START') {
            if ($aState['held'] || $aState['buf'] !== '')
                $this->flushChatActionsSseState($aState, $fEmit);
            $aState['messageId'] = (string)($aPayload['messageId'] ?? '');
            $aState['held'][] = $sEvent;
            return;
        }

        if ($sType === 'TEXT_MESSAGE_CONTENT') {
            $sDelta = (string)($aPayload['delta'] ?? '');
            $aState['buf'] .= $sDelta;
            if ($aState['mode'] === 'text') {
                $fEmit($sEvent);
                return;
            }
            if ($aState['mode'] === 'undecided') {
                $mixed = $this->chatActionsStreamLooksLikeJson($aState['buf']);
                if ($mixed === false) {
                    $aState['mode'] = 'text';
                    $this->emitHeldChatActionsSse($aState, $fEmit);
                    $fEmit($sEvent);
                    return;
                }
                if ($mixed === true)
                    $aState['mode'] = 'json';
            }
            $aState['held'][] = $sEvent;
            return;
        }

        if ($sType === 'TEXT_MESSAGE_END') {
            $aParsed = $this->parseAssistantChatPayload($aState['buf']);
            if ($aParsed && ($aState['mode'] === 'json' || $aState['mode'] === 'undecided')) {
                $this->emitParsedChatActionsSse($aState, $fEmit, $aParsed);
                return;
            }
            $this->emitHeldChatActionsSse($aState, $fEmit);
            $fEmit($sEvent);
            $aState = $this->resetChatActionsSseState();
            return;
        }

        if ($sType === 'RUN_ERROR' || $sType === 'RUN_FINISHED') {
            $this->flushChatActionsSseState($aState, $fEmit);
            $fEmit($sEvent);
            return;
        }

        if ($aState['mode'] === 'json' || $aState['held'])
            $this->flushChatActionsSseState($aState, $fEmit);

        $fEmit($sEvent);
    }

    protected function chatActionsStreamLooksLikeJson($sBuf)
    {
        $s = ltrim((string)$sBuf);
        if ($s === '')
            return null;
        $sFirst = $s[0];
        if ($sFirst === '{' || $sFirst === '`')
            return true;
        return false;
    }

    protected function flushChatActionsSseState(&$aState, $fEmit)
    {
        if ($aState['buf'] === '' && !$aState['held'])
            return;

        $aParsed = $this->parseAssistantChatPayload($aState['buf']);
        if ($aParsed && $aState['mode'] !== 'text') {
            $this->emitParsedChatActionsSse($aState, $fEmit, $aParsed);
            return;
        }

        $this->emitHeldChatActionsSse($aState, $fEmit);
        $aState = $this->resetChatActionsSseState();
    }

    protected function persistAssistantChatActions($oAgent)
    {
        if (!is_object($oAgent) || !method_exists($oAgent, 'getChatHistory'))
            return;

        $oHistory = $oAgent->getChatHistory();
        if (!($oHistory instanceof BxDolAiChatHistory) || !method_exists($oHistory, 'persistMessages'))
            return;

        $aMessages = $oHistory->getMessages();
        for ($i = count($aMessages) - 1; $i >= 0; $i--) {
            $oMessage = $aMessages[$i];
            if (
                $oMessage instanceof NeuronAI\Chat\Messages\ToolCallMessage
                || $oMessage instanceof NeuronAI\Chat\Messages\ToolResultMessage
            ) {
                continue;
        }

            $sRole = $oMessage->getRole();
            if ($sRole === 'model')
                $sRole = 'assistant';
            if ($sRole !== 'assistant')
                return;

            $aParsed = $this->parseAssistantChatPayload((string)$oMessage->getContent());
            if (!$aParsed)
                return;

            $oMessage->setContents($aParsed['content']);
            $oMessage->addMetadata('actions', $aParsed['actions']);
            $oHistory->persistMessages();
            return;
        }
    }

    public function streamAgentChat($iAgentId, $sPrompt, $aParams = [], $sThreadId = null)
    {
        if (!isset($aParams['chat_history_subindex']))
            $aParams = array_merge($this->resolveChatHistoryParams($iAgentId), $aParams);

        // Staging header.inc.php dumps HTML on fatals and warns on null error_get_last().
        // Any HTML after SSE is parsed by TanStack as "unterminated trailing data".
        @ini_set('display_errors', '0');
        @ini_set('zlib.output_compression', '0');
        @ini_set('implicit_flush', '1');
        if (function_exists('apache_setenv'))
            @apache_setenv('no-gzip', '1');
        while (ob_get_level())
            ob_end_clean();

        // UNA BxDolDb::pdoExceptionHandler dumps HTML 503 on uncaught PDOException.
        restore_exception_handler();

        $oAdapter = new NeuronAI\Chat\Messages\Stream\Adapters\AGUIAdapter($sThreadId);

        http_response_code(200);
        foreach ($oAdapter->getHeaders() as $sName => $sValue)
            header($sName . ': ' . $sValue);

        $fEmit = function ($sEvent) {
            echo $sEvent;
            if (ob_get_level())
                ob_flush();
            flush();
        };

        $aAgent = BxDolAIQuery::getAgentObject((int)$iAgentId);
        if ($aAgent)
            $this->_aChatContext = ['agent' => $aAgent, 'params' => $aParams];

        if ($aAgent && $this->isChatSessionRateLimited($aAgent, $aParams)) {
            $this->emitChatErrorSse($oAdapter, $fEmit, $this->getChatSessionRateLimitError());
            error_clear_last();
            @ini_set('display_errors', '0');
            exit;
        }

        $iRequestTurns = (int)($aParams['request_user_turns'] ?? 0);
        if ($aAgent && $this->isChatTurnLimitReached($aAgent, $this->getChatUserTurnCount((int)$iAgentId, $aParams), $iRequestTurns)) {
            $this->emitConversationClosed('limit', '', $aAgent, $aParams);
            $this->emitChatLimitSse($oAdapter, $fEmit, $this->getChatLimitMessage($aAgent));
            error_clear_last();
            @ini_set('display_errors', '0');
            exit;
        }

        $sPrompt = $this->applyChatInputLimit((string)$sPrompt, $aAgent ?: []);

        $bStarted = false;
        $aSseState = $this->resetChatActionsSseState();
        $o = null;
        try {
            $o = self::getAgentInstance((int)$iAgentId, $aParams);
            $oHandler = $o->stream(new NeuronAI\Chat\Messages\UserMessage($sPrompt));

            foreach ($oHandler->events($oAdapter) as $sEvent) {
                $bStarted = true;
                $this->processChatActionsSseEvent($sEvent, $aSseState, $fEmit);
            }

            $this->flushChatActionsSseState($aSseState, $fEmit);
            $this->persistAssistantChatActions($o);

            if ($aAgent && $this->isChatTurnLimitReached($aAgent, $this->getChatUserTurnCount((int)$iAgentId, $aParams)))
                $this->emitConversationClosed('limit', '', $aAgent, $aParams);
        } catch (Throwable $oException) {
            bx_log('sys_agents', "Stream exception for agent {$iAgentId}: " . $oException->getMessage() . " INPUT:" . $sPrompt);
            $this->flushChatActionsSseState($aSseState, $fEmit);
            if (!$bStarted) {
                foreach ($oAdapter->start() as $sEvent)
                    $fEmit($sEvent);
            }
            $sMsg = $oException->getMessage();
            $fEmit('data: ' . json_encode(['type' => 'RUN_ERROR', 'message' => $sMsg !== '' ? $sMsg : _t('_sys_agents_exception')]) . "\n\n");
            foreach ($oAdapter->end() as $sEvent)
                $fEmit($sEvent);
        }

        error_clear_last();
        @ini_set('display_errors', '0');
        exit;
    }

    /**
     * SSE assistant reply without calling the model. Used when max_turns is hit.
     */
    protected function emitChatLimitSse($oAdapter, $fEmit, $sMessage)
    {
        foreach ($oAdapter->start() as $sEvent)
            $fEmit($sEvent);

        $oChunk = new NeuronAI\Chat\Messages\Stream\Chunks\TextChunk('msg_limit', (string)$sMessage);
        foreach ($oAdapter->transform($oChunk) as $sEvent)
            $fEmit($sEvent);

        foreach ($oAdapter->end() as $sEvent)
            $fEmit($sEvent);
    }

    /**
     * SSE error without an assistant bubble. Used when a new session is rate-limited.
     */
    protected function emitChatErrorSse($oAdapter, $fEmit, $sMessage)
    {
        foreach ($oAdapter->start() as $sEvent)
            $fEmit($sEvent);

        $sMsg = trim((string)$sMessage);
        $fEmit('data: ' . json_encode([
            'type' => 'RUN_ERROR',
            'message' => $sMsg !== '' ? $sMsg : _t('_sys_agents_exception'),
        ]) . "\n\n");

        foreach ($oAdapter->end() as $sEvent)
            $fEmit($sEvent);
    }

    public function sendMessengerMessage ($iSender, $iRecipient, $sMsg) 
    {        
        $oMessengerModule = BxDolModule::getInstance('bx_messenger');

        $aAutoReplyData = [
            'message' => $sMsg,
            'participants' => [$iSender, $iRecipient],
        ];

        $iSaveProfileId = $oMessengerModule->setProfileId($iSender);
        $a = $oMessengerModule->sendMessage($aAutoReplyData, $iRecipient, $iSender);
        $oMessengerModule->setProfileId($iSaveProfileId);

        return $a;
    }

    public function getAgentsByAlertUnitAndAction($sUnit, $sAction)
    {
        $aAgents = [];
        $a = $this->_oDb->getAgentsWithAlert();
        foreach ($a as $r) {
            $aAlert = explode(':', $r['alert']); // TODO: remake to concantenate $sUnit and $sAction and then compare
            if (count($aAlert) == 2 && $aAlert[0] == $sUnit && $aAlert[1] == $sAction)
                $aAgents[] = $r;
        }

        return $aAgents;
    }

    public function getAgentsBy($aParams)
    {
        return $this->_oDb->getAgentsBy($aParams);
    }

    public function getAgentsByProfileId($iProfileId)
    {
        return $this->_oDb->getAgentsByProfileId($iProfileId);
    }
    
    public function getAgentsByFormObject($sFormObject)
    {
        return $this->_oDb->getAgentsByFormObject($sFormObject);
    }

    public function getAgentsByTriggerType($sTrigger)
    {
        return $this->_oDb->getAgentsByTriggerType($sTrigger);
    }

    public function getAgentById($iId)
    {
        return $this->_oDb->getAgentById($iId);
    }

    public function getAgentByTriggerWebhookKey($sKey)
    {
        return $this->_oDb->getAgentByTriggerWebhookKey($sKey);
    }

    public function callAutomator($sType, $aParams = [])
    {
        $sMethod = '_callAutomator' . bx_gen_method_name($sType);
        if(!method_exists($this, $sMethod))
            return false;

        return $this->$sMethod($aParams);
    }

    protected function _callAutomatorEvent($aParams = [])
    {
        if(!isset($aParams['automator'], $aParams['alert']) || !is_a($aParams['alert'], 'BxDolAlerts'))
            return false;
        
        $oAlert = &$aParams['alert'];

        $this->evalCode($aParams['automator'], ['alert' => $oAlert]);
    }

    protected function _callAutomatorScheduler($aParams = [])
    {
        if(!isset($aParams['automator']))
            return false;
        
        $this->evalCode($aParams['automator']);
    }

    protected function _callAutomatorWebhook($aParams = [])
    {
        if(!isset($aParams['automator']))
            return false;

        $this->evalCode($aParams['automator']);
    }

    public function evalCode($aAutomator, $aParams = [])
    {
        try {
            $this->_evalCode($aAutomator, $aParams);
        }
        catch (Exception $oException) {
            $this->log($oException->getFile() . ':' . $oException->getLine() . ' ' . $oException->getMessage());
        }
        catch (Error $oError) {
            $this->log($oError->getFile() . ':' . $oError->getLine() . ' ' . $oError->getMessage());
        }
    }

    public function emulCode($aAutomator, $aParams = [])
    {
        ob_start();

        try {
            $this->_evalCode($aAutomator, $aParams);
        }
        catch (Exception $oException) {
            return $oException->getMessage();
        }
        catch (Error $oError) {
            return $oError->getMessage();
        }
        finally {
            $sOutput = ob_get_clean();

            if(!empty($sOutput))
                return $sOutput;
        }
    }

    public function log($mixedContents, $sSection = '')
    {
        if(!$this->_bWriteLog)
            return;

        if(is_array($mixedContents))
            $mixedContents = var_export($mixedContents, true);	
        else if(is_object($mixedContents))
            $mixedContents = json_encode($mixedContents);

        if(empty($sSection))
            $sSection = "Core";

        bx_log('sys_agents', ":\n[" . $sSection . "] " . $mixedContents, BX_LOG_ERR);
    }

    protected function _evalCode($aAutomator, $aParams = [])
    {
        $sCode = '';
        switch($aAutomator['type']) {
            case BX_DOL_AI_AUTOMATOR_EVENT:
                $sCode = $aAutomator['code']. '; onAlert($aParams["alert"]->iObject , $aParams["alert"]->iSender , $aParams["alert"]->aExtras);';
                break;

            case BX_DOL_AI_AUTOMATOR_SCHEDULER:
                $sCode = $aAutomator['code'] . '; onCron();';
                break;

            case BX_DOL_AI_AUTOMATOR_WEBHOOK:
                $sCode = $aAutomator['code'] . '; onHook();';
                break;
        }

        eval($sCode);
    }
}

class BxDolAIMessage
{
    /**
     * @var string - message Type with following values: hb, ai 
     */
    protected $_sType;
    
    /**
     * @var mixed - an array of message parts (text, image_url) or a string.
     */
    protected $_mixedContent;
    
    /**
     * @var array - an array of of files attached to the message.
     */
    protected $_aAttachments;

    public function __construct($sType)
    {
        $this->_sType = $sType;
    }

    public function isAi()
    {
        return $this->_sType == 'ai';
    }

    public function getContent()
    {
        return $this->_mixedContent;
    }

    public function getAttachments()
    {
        return $this->_aAttachments;
    }
}

class BxDolAIMessageString extends BxDolAIMessage
{
    public function __construct($sType, $sContent)
    {
        parent::__construct($sType);

        $this->_mixedContent = is_string($sContent) ? $sContent : '';
    }
}

class BxDolAIMessageArray extends BxDolAIMessage
{
    public function __construct($sType, $aContent = '')
    {
        parent::__construct($sType);

        $this->_mixedContent = is_array($aContent) ? $aContent : [];
    }

    public function addText($sText)
    {
        $this->_mixedContent[] = [
            'type' => 'text',
            'text' => $sText
        ];
    }

    public function addImageUrl($sUrl, $sDetail = 'high')
    {
        $this->_mixedContent[] = [
            'type' => 'image_url',
            'image_url' => [
                'url' => $sUrl,
                'detail' => $sDetail
            ]
        ];
    }

    public function addAttachments($mixedAttachments, $mixedTools = false)
    {
        if(!is_array($mixedAttachments))
            $mixedAttachments = [$mixedAttachments];

        if(!$mixedTools)
            $mixedTools = [['type' => 'file_search']];

        foreach($mixedAttachments as $sAttachment)
            $this->_aAttachments[] = [
                'file_id' => $sAttachment,
                'tools' => $mixedTools
            ];
    }
}

class BxDolAIMessages
{
    /**
     * @var array - an array of items (messages)
     */
    protected $_aItems;

    public function __construct($aItems = [])
    {
        $this->_aItems = !empty($aItems) && is_array($aItems) ? $aItems : [];
    }

    public function add($sType, $mixedMessage)
    {
        $sClass = 'BxDolAIMessage' . (is_string($mixedMessage) ? 'String' : 'Array');
        $this->_aItems[] = new $sClass($sType, $mixedMessage);
    }

    public function getAll()
    {
        return $this->_aItems;
    }

    public function getLast()
    {
        return end($this->_aItems);
    }
}

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
     * Guest threads: `g:{clientKey}` (NEO header) or `s:{memberSession}` (UNA cookie).
     * Members: profile id. Guest key is kept in session and adopted on login.
     */
    public function resolveChatHistoryParams()
    {
        $iProfileId = (int)bx_get_logged_profile_id();
        $oSession = BxDolSession::getInstance();
        $sHeaderKey = $this->readAiGuestKeyFromRequest();
        $sSessionKey = 'ai_chat_guest_subindex';

        if ($iProfileId) {
            $sGuest = $sHeaderKey ? ('g:' . $sHeaderKey) : '';
            if ($sGuest === '') {
                $sStored = $oSession->getValue($sSessionKey);
                if ($this->isAiGuestSubindex($sStored))
                    $sGuest = $sStored;
            }
            if ($sGuest !== '')
                $this->_oDb->adoptGuestChatHistory($sGuest, $iProfileId);
            if ($oSession->isValue($sSessionKey))
                $oSession->unsetValue($sSessionKey);

            return [
                'sender_profile_id' => $iProfileId,
                'chat_history_subindex' => (string)$iProfileId,
            ];
        }

        $oSession->start(true);
        $sSessionId = (string)$oSession->getId();
        $sSubindex = $sHeaderKey ? ('g:' . $sHeaderKey) : ('s:' . ($sSessionId !== '' ? $sSessionId : '0'));
        $oSession->setValue($sSessionKey, $sSubindex);

        return [
            'sender_profile_id' => 0,
            'chat_history_subindex' => $sSubindex,
        ];
    }

    /**
     * `{trigger}:{agentId}:{contextPid}:{userSubindex}`.
     * Context is omitted when 0 so existing site-wide threads still load.
     * User suffix stays last so adoptGuestChatHistory keeps matching.
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

    /**
     * Context from chat HTTP (`?context=`). Missing/0 = site-wide. Invalid/unviewable = false (403).
     * @return int|false
     */
    public function resolveChatHistoryContextPid()
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

        if ($oProfile->checkAllowedProfileView() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return $iPid;
    }

    /**
     * Context of the current page (AI agent block JSON).
     * Prefer `bx_get_page_info()`; API page JSON falls back to $_GET after getPageAPI merges params.
     */
    public function resolveChatHistoryContextPidFromPage()
    {
        if (function_exists('bx_get_page_info')) {
            $aInfo = bx_get_page_info();
            if ($aInfo && !empty($aInfo['context_profile_id']))
                return $this->filterViewableContextPid((int)$aInfo['context_profile_id']);
        }

        if (($iPid = (int)bx_process_input(bx_get('profile_id'), BX_DATA_INT)) > 0) {
            $oProfile = BxDolProfile::getInstance($iPid);
            if ($oProfile && bx_srv('system', 'is_module_context', [$oProfile->getModule()]))
                return $this->filterViewableContextPid((int)$oProfile->id());
        }

        $oPage = BxDolPage::getObjectInstanceByURI();
        $sModule = $oPage ? (string)$oPage->getModule() : '';
        $iContentId = (int)bx_process_input(bx_get('id'), BX_DATA_INT);
        if ($iContentId > 0 && $sModule !== '' && bx_srv('system', 'is_module_context', [$sModule])) {
            $oProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $sModule);
            if ($oProfile)
                return $this->filterViewableContextPid((int)$oProfile->id());
        }

        return 0;
    }

    protected function filterViewableContextPid($iPid)
    {
        $iPid = (int)$iPid;
        if ($iPid <= 0)
            return 0;

        $oProfile = BxDolProfile::getInstance($iPid);
        if (!$oProfile || $oProfile->checkAllowedProfileView() !== CHECK_ACTION_RESULT_ALLOWED)
            return 0;

        return $iPid;
    }

    /**
     * Transcript for TanStack `useChat` hydrate / `initialMessages`.
     * Loads the same NeuronAI chat history the agent uses when streaming.
     */
    public function getChatHistoryUiMessages($iAgentId, $aParams = [])
    {
        if (!isset($aParams['chat_history_subindex']))
            $aParams = array_merge($this->resolveChatHistoryParams(), $aParams);

        $aAgent = BxDolAiQuery::getAgentObject((int)$iAgentId);
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

        return $this->neuronMessagesToUiMessages($o->getChatHistory()->getMessages());
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

            if (!$aParts)
                continue;

            $sId = $oMessage->getMetadata('__id');
            $aResult[] = [
                'id' => is_string($sId) && $sId !== '' ? $sId : ('msg_' . $i),
                'role' => $sRole,
                'parts' => $aParts,
            ];
            $i++;
        }

        return $aResult;
    }

    protected function readAiGuestKeyFromRequest()
    {
        $s = $_SERVER['HTTP_X_UNA_AI_GUEST_KEY'] ?? '';
        if ($s === '' && function_exists('apache_request_headers')) {
            foreach (apache_request_headers() as $sName => $sValue) {
                if (strtolower((string)$sName) === 'x-una-ai-guest-key') {
                    $s = $sValue;
                    break;
                }
            }
        }
        return $this->sanitizeAiGuestKey($s);
    }

    protected function sanitizeAiGuestKey($s)
    {
        $s = is_string($s) ? $s : '';
        return preg_match('/^[A-Za-z0-9_-]{16,64}$/', $s) ? $s : '';
    }

    protected function isAiGuestSubindex($s)
    {
        $s = is_string($s) ? $s : '';
        if ($s === '' || (strncmp($s, 'g:', 2) !== 0 && strncmp($s, 's:', 2) !== 0))
            return false;
        return $this->sanitizeAiGuestKey(substr($s, 2)) !== '';
    }

    public function streamAgentChat($iAgentId, $sPrompt, $aParams = [], $sThreadId = null)
    {
        if (!isset($aParams['chat_history_subindex']))
            $aParams = array_merge($this->resolveChatHistoryParams(), $aParams);

        $oAdapter = new NeuronAI\Chat\Messages\Stream\Adapters\AGUIAdapter($sThreadId);

        foreach ($oAdapter->getHeaders() as $sName => $sValue)
            header($sName . ': ' . $sValue);

        if (function_exists('apache_setenv'))
            @apache_setenv('no-gzip', '1');
        @ini_set('zlib.output_compression', '0');
        @ini_set('implicit_flush', '1');
        while (ob_get_level())
            ob_end_flush();

        try {
            $o = self::getAgentInstance((int)$iAgentId, $aParams);
            $oHandler = $o->stream(new NeuronAI\Chat\Messages\UserMessage($sPrompt));

            foreach ($oHandler->events($oAdapter) as $sEvent) {
                echo $sEvent;
                if (ob_get_level())
                    ob_flush();
                flush();
            }
        } catch (Exception $oException) {
            bx_log('sys_agents', "Stream exception for agent {$iAgentId}: " . $oException->getMessage() . " INPUT:" . $sPrompt, BX_LOG_ERR);
            echo 'data: ' . json_encode(['type' => 'RUN_ERROR', 'message' => _t('_sys_agents_exception')]) . "\n\n";
            flush();
        }

        exit;
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

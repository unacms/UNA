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

    protected $_aChatContext;

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_oDb = new BxDolAiQuery();

        $this->_iProfileId = (int)getParam('sys_profile_bot'); 

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

    public function setChatContext($aAgent, $aParams)
    {
        $this->_aChatContext = ['agent' => $aAgent, 'params' => $aParams];
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
        return BxDolAiTrigger::getInstance('chat')->extractPromptFromRequest($aData);
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
                    $aAgent = BxDolAiQuery::getAgentObject($iStoredAgentId);
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
    public function parseAssistantChatPayload($sText)
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

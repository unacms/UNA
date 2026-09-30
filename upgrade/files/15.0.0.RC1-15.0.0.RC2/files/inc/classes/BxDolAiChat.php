<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiChat
{
    protected $_oDb;
    protected $_oUi;
    protected $_aChatContext;

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new self();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function __construct()
    {
        $this->_oDb = new BxDolAiQuery();
        $this->_oUi = BxDolAiChatUi::getInstance();
        $this->_aChatContext = null;
    }

    public function setChatContext($aAgent, $aParams)
    {
        $this->_aChatContext = ['agent' => $aAgent, 'params' => $aParams];
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
    public static function threadId($aAgent, $aParams = [])
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
     * @return array{thread_id:string,chat_history_context_pid:int,chat_history_subindex:string}|false
     */
    public static function parseThreadId($aAgent, $sThreadId)
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

    public function getChatHistoryRowId($aAgent, $aParams = [])
    {
        return $this->_oDb->getChatHistoryIdByThreadId(self::threadId($aAgent, $aParams));
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

        $sClosed = $this->_oDb->getChatHistoryClosedReasonById($iHistoryId);
        if ($sClosed !== '')
            return false;

        bx_alert('system', 'agent_conversation_closed', $iHistoryId, 0, [
            'agent_id' => (int)$aAgent['id'],
            'summary' => (string)$sSummary,
            'reason' => (string)$sReason,
        ]);
        return true;
    }

    public function isOwnAgentChatThread($aAgent, $sThreadId)
    {
        $aParsed = self::parseThreadId($aAgent, $sThreadId);
        if (!$aParsed)
            return false;

        $aMine = $this->resolveChatHistoryParams((int)$aAgent['id']);
        $sMine = (string)($aMine['chat_history_subindex'] ?? '');
        return $sMine !== '' && $aParsed['chat_history_subindex'] === $sMine;
    }

    public function getChatHistoryUiMessagesByThread($aAgent, $sThreadId)
    {
        if (!self::parseThreadId($aAgent, $sThreadId))
            return false;

        $sJson = $this->_oDb->getChatHistoryMessagesByThreadId((string)$sThreadId);

        return $this->_oUi->storedChatJsonToUiMessages($sJson);
    }

    public function getChatHistoryArtifactsByThread($aAgent, $sThreadId)
    {
        if (!self::parseThreadId($aAgent, $sThreadId))
            return [];

        return $this->_oDb->getChatArtifactsByThreadId((string)$sThreadId);
    }

    public function listAgentChatThreads($aAgent)
    {
        $aMineParams = $this->resolveChatHistoryParams((int)$aAgent['id']);
        $sMySub = (string)($aMineParams['chat_history_subindex'] ?? '');
        $sMyDefault = self::threadId($aAgent, $aMineParams);

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
            $aParsed = self::parseThreadId($aAgent, $sThreadId);
            if (!$aParsed)
                continue;

            $aUi = $this->_oUi->storedChatJsonToUiMessages($aRow['messages'] ?? '');
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
            $aParsedMine = self::parseThreadId($aAgent, $sMyDefault);
            if ($aParsedMine)
                $aOut[] = $this->formatAgentChatThread($aParsedMine, [], [], true);
        }

        usort($aOut, function ($a, $b) {
            return strcmp((string)$b['updated_sort'], (string)$a['updated_sort']);
        });

        return $aOut;
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

        $sThreadId = self::threadId($aAgent, $aParams);
        $sJson = $this->_oDb->getChatHistoryMessagesByThreadId($sThreadId);
        $aStored = json_decode((string)$sJson, true);
        if (!is_array($aStored) || $aStored === [])
            return [];

        try {
            $o = BxDolAi::getAgentInstance((int)$iAgentId, $aParams);
        } catch (Exception $oException) {
            bx_log('sys_agents', "Hydrate exception for agent {$iAgentId}: " . $oException->getMessage(), BX_LOG_ERR);
            return [];
        }

        $aResult = $this->_oUi->neuronMessagesToUiMessages($o->getChatHistory()->getMessages());
        $oLimits = BxDolAiChatLimits::getInstance();
        if ($bAppendLimitMessage && $oLimits->isChatTurnLimitReached($aAgent, $oLimits->countChatUserTurns($aResult))) {
            $aResult[] = [
                'id' => 'agent_limit_message',
                'role' => 'assistant',
                'parts' => [['type' => 'text', 'content' => $oLimits->getChatLimitMessage($aAgent)]],
            ];
        }

        return $aResult;
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

    protected function isAllowedContextChat($oProfile, $bRequirePost = false)
    {
        if ($oProfile->checkAllowedProfileView() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        if ($bRequirePost && $oProfile->checkAllowedPostInProfile() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return true;
    }
}

/** @} */

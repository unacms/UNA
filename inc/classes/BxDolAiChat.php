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

    /**
     * Buttons queued by the `chat_buttons` tool during the current turn. The chat
     * trigger emits them after the assistant text and pins them to the stored message.
     */
    protected $_aPendingChatActions = [];

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
        $this->_aPendingChatActions = [];
    }

    public function setChatContext($aAgent, $aParams)
    {
        $this->_aChatContext = ['agent' => $aAgent, 'params' => $aParams];
    }

    /**
     * Optional `?chat=` partition. Not identity — owner stays profile id / session id.
     * `{owner}.{chat}` so parseThreadId does not treat the nonce as a context pid.
     */
    public static function sanitizeChatQueryId($s)
    {
        $s = is_string($s) ? $s : '';
        $s = preg_replace('/[^A-Za-z0-9_-]/', '', $s);
        $s = substr($s, 0, 64);
        return strlen($s) >= 8 ? $s : '';
    }

    /**
     * Owner (profile id or guest session id) of a `{owner}` / `{owner}.{chat}` subindex.
     */
    public static function chatHistoryOwnerFromSubindex($sSub)
    {
        $sSub = (string)$sSub;
        if ($sSub === '')
            return '';
        $i = strpos($sSub, '.');
        return $i === false ? $sSub : substr($sSub, 0, $i);
    }

    /**
     * Guests: UNA session id. Members: profile id.
     * Guest chats remember agent ids in session so login can adopt those threads.
     * `?chat=` appends a conversation id without changing the owner.
     */
    public function resolveChatHistoryParams($iAgentId = 0)
    {
        $iAgentId = (int)$iAgentId;
        $iProfileId = (int)bx_get_logged_profile_id();
        $oSession = BxDolSession::getInstance();
        $sSessionKey = 'ai_chat_agent_ids';
        $sChat = self::sanitizeChatQueryId(bx_get('chat'));

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

            $sOwner = (string)$iProfileId;
            return [
                'sender_profile_id' => $iProfileId,
                'chat_history_subindex' => $sChat !== '' ? ($sOwner . '.' . $sChat) : $sOwner,
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

        $sOwner = (string)$oSession->getId();
        return [
            'sender_profile_id' => 0,
            'chat_history_subindex' => $sChat !== '' ? ($sOwner . '.' . $sChat) : $sOwner,
        ];
    }

    /**
     * `{trigger}:{agentId}:{contextPid}:{userSubindex}`.
     * Context is omitted when 0 so existing site-wide threads still load.
     * User suffix (session id or profile id, optionally `.{chat}`) stays last so adopt can replace it.
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

    /**
     * No `?chat=` in the request means "the conversation I am in", not "the base
     * thread": the newest open thread for this owner+context (a `?chat=` partition
     * or the base thread). Otherwise a block without `allow_new` would keep talking
     * to a base thread the agent closed days ago, while Studio shows a newer chat.
     *
     * Explicit `?chat=` (subindex with a dot) is left alone. Falls back to the base
     * thread when nothing is open.
     */
    public function resolveCurrentChatThread($aAgent, $aParams)
    {
        $sSub = (string)($aParams['chat_history_subindex'] ?? '');
        if ($sSub === '' || strpos($sSub, '.') !== false)
            return $aParams;

        $sCurrent = $this->_oDb->getCurrentOpenChatThreadId($aAgent, $sSub, (int)($aParams['chat_history_context_pid'] ?? 0));
        if ($sCurrent === '')
            return $aParams;

        $aParsed = self::parseThreadId($aAgent, $sCurrent);
        if (!$aParsed || (string)$aParsed['chat_history_subindex'] === '')
            return $aParams;

        $aParams['chat_history_subindex'] = (string)$aParsed['chat_history_subindex'];
        return $aParams;
    }

    /**
     * Create the `?chat=` history row immediately, so the thread exists (and lists)
     * before its first message. The owner's other threads are left as they are: a
     * "New chat" is one more conversation, not the end of the previous one — people
     * switch back to an earlier open thread from the history panel and go on.
     * Threads close only when the agent or the turn limit closes them.
     *
     * @return int history row id, 0 when this is not a `?chat=` thread
     */
    public function openPartitionedChatThread($aAgent, $aParams)
    {
        $sSub = (string)($aParams['chat_history_subindex'] ?? '');
        if (strpos($sSub, '.') === false)
            return 0;

        $sThreadId = self::threadId($aAgent, $aParams);
        if ($sThreadId === '')
            return 0;

        return (int)$this->_oDb->ensureChatHistoryRow($sThreadId);
    }

    /**
     * `chat_buttons` tool: queue buttons for the reply being generated.
     *
     * @return int number of accepted buttons
     */
    public function setPendingChatActions($mixed)
    {
        $a = $this->_oUi->sanitizeChatActions($this->normalizeChatButtonsInput($mixed));
        if (!$a)
            return 0;

        $this->_aPendingChatActions = $this->_oUi->mergeChatActions($this->_aPendingChatActions, $a);
        return count($a);
    }

    public function getPendingChatActions()
    {
        return $this->_oUi->sanitizeChatActions($this->_aPendingChatActions);
    }

    public function takePendingChatActions()
    {
        $a = $this->getPendingChatActions();
        $this->_aPendingChatActions = [];
        return $a;
    }

    public function resetPendingChatActions()
    {
        $this->_aPendingChatActions = [];
    }

    protected function normalizeChatButtonsInput($mixed)
    {
        if (!is_array($mixed))
            return [];

        if (isset($mixed['buttons']) && is_array($mixed['buttons']))
            $mixed = $mixed['buttons'];

        if (isset($mixed['type']) && (isset($mixed['label']) || isset($mixed['url'])))
            return [$mixed];

        return $mixed;
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

    /**
     * Thread belongs to the current profile / guest session (any `?chat=` partition of theirs).
     */
    public function isOwnAgentChatThread($aAgent, $sThreadId)
    {
        $aParsed = self::parseThreadId($aAgent, $sThreadId);
        if (!$aParsed)
            return false;

        $aMine = $this->resolveChatHistoryParams((int)$aAgent['id']);
        $sMineOwner = self::chatHistoryOwnerFromSubindex($aMine['chat_history_subindex'] ?? '');
        $sRowOwner = self::chatHistoryOwnerFromSubindex($aParsed['chat_history_subindex']);
        return $sMineOwner !== '' && $sMineOwner === $sRowOwner;
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

    public function getChatHistoryClosedReasonByThread($aAgent, $sThreadId)
    {
        if (!self::parseThreadId($aAgent, $sThreadId))
            return '';

        return $this->_oDb->getChatHistoryClosedReasonById($this->_oDb->getChatHistoryIdByThreadId((string)$sThreadId));
    }

    /**
     * Every thread of this agent (Studio chat popup): all owners, all contexts.
     */
    public function listAgentChatThreads($aAgent)
    {
        $aMineParams = $this->resolveChatHistoryParams((int)$aAgent['id']);
        $sMySub = (string)($aMineParams['chat_history_subindex'] ?? '');
        $sMyOwner = self::chatHistoryOwnerFromSubindex($sMySub);
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
            // A `?chat=` thread is listed even before its first message (it was opened on purpose).
            $bPartition = strpos((string)$aParsed['chat_history_subindex'], '.') !== false;
            if (!$aUi && $sThreadId !== $sMyDefault && !$bPartition)
                continue;

            $bMine = ($sMyOwner !== '' && $sMyOwner === self::chatHistoryOwnerFromSubindex($aParsed['chat_history_subindex']));
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
     * The caller's own conversations with this agent, for the chat widget's history
     * panel (`system/get_ai_chat_threads`). Unlike listAgentChatThreads (Studio, every
     * owner) this only reads the current profile's / guest session's rows: any
     * context, base thread and `?chat=` partitions, newest first. Closed threads
     * with nothing in them are skipped; the open one is listed even when empty so
     * the panel can mark it as current.
     *
     * @return array<int, array<string, mixed>> see formatOwnAgentChatThread
     */
    public function listOwnAgentChatThreads($aAgent)
    {
        $aMine = $this->resolveChatHistoryParams((int)$aAgent['id']);
        $sOwner = self::chatHistoryOwnerFromSubindex($aMine['chat_history_subindex'] ?? '');
        if ($sOwner === '')
            return [];

        $aRows = $this->_oDb->getOwnerAgentChatHistoryRows($aAgent, $sOwner);
        if (!is_array($aRows))
            return [];

        $aOut = [];
        foreach ($aRows as $aRow) {
            $aParsed = self::parseThreadId($aAgent, (string)($aRow['thread_id'] ?? ''));
            // LIKE matched the owner loosely; the parsed id is the authority.
            if (!$aParsed || self::chatHistoryOwnerFromSubindex($aParsed['chat_history_subindex']) !== $sOwner)
                continue;

            $aUi = $this->_oUi->storedChatJsonToUiMessages($aRow['messages'] ?? '');
            $sReason = trim((string)($aRow['closed_reason'] ?? ''));
            if (!$aUi && $sReason !== '')
                continue;

            $aOut[] = $this->formatOwnAgentChatThread($aParsed, $aRow, $aUi);
        }

        return $aOut;
    }

    /**
     * `chat_title` tool: store the title the agent chose for the conversation it is
     * in right now (`_aChatContext`, set by the chat trigger). Set once —
     * a thread that already has a title keeps it.
     *
     * @return int 1 saved, 0 already titled, -1 no current thread or no `title` column yet
     */
    public function setCurrentChatThreadTitle($sTitle)
    {
        $sTitle = trim((string)$sTitle);
        if ($sTitle === '' || !is_array($this->_aChatContext))
            return -1;
        if (!$this->_oDb->isFieldExists('sys_agents_chat_history', 'title'))
            return -1;

        $aAgent = $this->_aChatContext['agent'] ?? null;
        $aParams = $this->_aChatContext['params'] ?? [];
        if (!is_array($aAgent))
            return -1;

        $sThreadId = self::threadId($aAgent, is_array($aParams) ? $aParams : []);
        if ($sThreadId === '' || $sThreadId === ':')
            return -1;

        // The row may not be there yet on the very first turn: the history is
        // persisted after the tools ran. Create it, so the title has somewhere to go.
        $this->_oDb->ensureChatHistoryRow($sThreadId);
        if ($this->_oDb->getChatHistoryTitle($sThreadId) !== '')
            return 0;

        return $this->_oDb->setChatHistoryTitle($sThreadId, $sTitle) ? 1 : -1;
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
        $sOwner = self::chatHistoryOwnerFromSubindex($sSub);
        $oProfile = (ctype_digit($sOwner) && (int)$sOwner > 0) ? BxDolProfile::getInstance((int)$sOwner) : false;
        if ($oProfile)
            $sTitle = $oProfile->getDisplayName();
        if ($sContextName !== '')
            $sTitle .= ' · ' . $sContextName;
        $sThreadTitle = trim((string)($aRow['title'] ?? ''));
        if ($sThreadTitle !== '')
            $sTitle .= ' · ' . $sThreadTitle;

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
            'messages' => is_array($aUi) ? $aUi : [],
            'updated_sort' => $sUpdatedRaw,
            'class_mine' => $bMine ? ' bx-agents-popup-chat-thread-mine' : '',
        ];
    }

    /**
     * One history-panel item. `chat` is the `?chat=` nonce ('' for the base thread),
     * so the client can tell which row its live widget is talking to. `title` is the
     * one the agent gave (`chat_title` tool) or the first thing the person typed (the
     * hidden "[page opened…" bootstrap is skipped), `preview` the last line said; both plain text.
     */
    protected function formatOwnAgentChatThread($aParsed, $aRow, $aUi)
    {
        $iContext = (int)$aParsed['chat_history_context_pid'];
        $sContextName = '';
        if ($iContext > 0) {
            $oContext = BxDolProfile::getInstance($iContext);
            $sContextName = $oContext ? $oContext->getDisplayName() : ('#' . $iContext);
        }

        $sSub = (string)$aParsed['chat_history_subindex'];
        $iDot = strpos($sSub, '.');
        $sChat = $iDot === false ? '' : substr($sSub, $iDot + 1);

        $sTitle = trim((string)($aRow['title'] ?? ''));
        $sPreview = '';
        foreach ($aUi as $aMessage) {
            $sText = $this->_oUi->uiChatMessagePlainText($aMessage);
            if ($sText === '')
                continue;
            if ($sTitle === '' && ($aMessage['role'] ?? '') === 'user' && strpos($sText, '[page opened') !== 0)
                $sTitle = $this->clipChatThreadText($sText, 80);
            $sPreview = $sText;
        }
        if ($sPreview !== '' && strpos($sPreview, '[page opened') === 0)
            $sPreview = '';

        $sReason = trim((string)($aRow['closed_reason'] ?? ''));
        return [
            'thread_id' => (string)$aParsed['thread_id'],
            'chat' => $sChat,
            'context_pid' => $iContext,
            'context_name' => $sContextName,
            'status' => $sReason !== '' ? 'closed' : 'opened',
            'closed_reason' => $sReason,
            'title' => $sTitle,
            'preview' => $this->clipChatThreadText($sPreview, 120),
            'messages_count' => count($aUi),
            'created_ts' => $this->chatThreadTimestamp($aRow['created_at'] ?? ''),
            'updated_ts' => $this->chatThreadTimestamp($aRow['updated_at'] ?? ''),
        ];
    }

    protected function clipChatThreadText($s, $iMax)
    {
        $s = (string)$s;
        if (get_mb_len($s) <= $iMax)
            return $s;
        return rtrim(get_mb_substr($s, 0, $iMax - 1)) . '…';
    }

    /** Unix timestamp for a `created_at` / `updated_at` cell, 0 when unset. */
    protected function chatThreadTimestamp($mixed)
    {
        $s = trim((string)$mixed);
        if ($s === '' || $s === '0')
            return 0;
        $i = ctype_digit($s) ? (int)$s : (int)strtotime($s);
        return $i > 86400 ? $i : 0;
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

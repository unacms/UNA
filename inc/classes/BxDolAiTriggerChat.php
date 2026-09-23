<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiTriggerChat extends BxDolAiTrigger
{
    protected $_sType = 'manual';

    protected function appliesChatLimits()
    {
        return true;
    }

    /**
     * HTTP/SSE only. GET hydrates transcript; POST streams (or falls back to call()).
     */
    public function handle($mixed = null)
    {
        $iAgentId = (int)$mixed;
        $sMethod = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '';
        if ('GET' === $sMethod)
            return $this->hydrate($iAgentId);

        if ('POST' !== $sMethod)
            return echoJson(['code' => 405, 'msg' => _t('_error occured')]);

        $aAgent = $this->loadAgent($iAgentId);
        if (!$aAgent)
            return echoJson(['code' => $iAgentId ? 404 : 400, 'msg' => _t('_sys_agents_agent_not_found')]);

        $oAi = $this->getAi();
        if (!$oAi)
            return echoJson(['code' => 503, 'msg' => _t('_sys_agents_exception')]);

        if (!$oAi->canChatDirectly($aAgent))
            return echoJson(['code' => 403, 'msg' => _t('_sys_agents_unauthorized')]);

        $sJson = file_get_contents('php://input');
        $aData = json_decode($sJson, true);
        if (json_last_error() !== JSON_ERROR_NONE)
            return echoJson(['code' => 400, 'msg' => _t('_sys_agents_json_field_err')]);

        $aTurn = $this->extractUserTurnFromRequest($aData);
        $sPrompt = BxDolAiChatLimits::getInstance()->applyChatInputLimit($aTurn['text'], $aAgent);
        $oMessage = BxDolAiChatImages::getInstance()->makeUserMessage($sPrompt, $aTurn['images']);
        if (!$oMessage)
            return echoJson(['code' => 400, 'msg' => _t('_sys_agents_json_field_err')]);

        $aParams = $this->historyParams($aAgent);
        if (!$aParams)
            return echoJson(['code' => 403, 'msg' => _t('_sys_agents_unauthorized')]);

        $aParams['request_user_turns'] = BxDolAiChatLimits::getInstance()->countChatUserTurns($aData['messages'] ?? []);

        $sThreadId = !empty($aData['threadId']) ? $aData['threadId'] : null;

        if (class_exists('NeuronAI\Chat\Messages\Stream\Adapters\AGUIAdapter')) {
            $this->stream($aAgent['id'], $oMessage, $aParams, $sThreadId);
            return;
        }

        try {
            $sReply = $this->call($aAgent, $sPrompt !== '' ? $sPrompt : ' ');
        } catch (Throwable $o) {
            return echoJson(['code' => 500, 'msg' => $o->getMessage(), 'messages' => []]);
        }
        return echoJson(['code' => 200, 'msg' => $sReply, 'text' => $sReply]);
    }

    /**
     * Composer image upload (`system/ai_chat_upload`): one `$_FILES['file']` into the chat images storage.
     *
     * @return array{file_id:int,url:string,mime:string}|array{error:string,code?:int}
     */
    public function upload($iAgentId)
    {
        $aAgent = $this->loadAgent($iAgentId);
        if (!$aAgent)
            return ['error' => _t('_sys_agents_agent_not_found'), 'code' => (int)$iAgentId ? 404 : 400];

        $oAi = $this->getAi();
        if (!$oAi || !$oAi->canChatDirectly($aAgent))
            return ['error' => _t('_sys_agents_unauthorized'), 'code' => 403];

        $aParams = $this->historyParams($aAgent);
        if (!$aParams)
            return ['error' => _t('_sys_agents_unauthorized'), 'code' => 403];

        $aFile = $_FILES['file'] ?? null;
        if (!is_array($aFile))
            return ['error' => 'No file'];

        $aStored = BxDolAiChatImages::getInstance()->storeUpload($aFile, (int)bx_get_logged_profile_id());
        if (!empty($aStored['error']))
            return ['error' => $aStored['error']];

        return $aStored;
    }

    /**
     * The caller's own conversations with an agent (`system/get_ai_chat_threads`).
     *
     * @return array{threads:array}|array{error:string,code:int}
     */
    public function listThreads($iAgentId)
    {
        $aAgent = $this->loadAgent($iAgentId);
        if (!$aAgent)
            return ['error' => _t('_sys_agents_agent_not_found'), 'code' => (int)$iAgentId ? 404 : 400];

        $oAi = $this->getAi();
        if (!$oAi || !$oAi->canChatDirectly($aAgent))
            return ['error' => _t('_sys_agents_unauthorized'), 'code' => 403];

        return ['threads' => BxDolAiChat::getInstance()->listOwnAgentChatThreads($aAgent)];
    }

    /**
     * One of the caller's earlier conversations, read-only (`system/get_ai_chat_thread`):
     * the transcript in the same UI message shape hydrate returns. Does not open or
     * close anything — which thread is current is left as it was.
     *
     * @return array{messages:array,status:string,closed_reason:string,artifacts:array}|array{error:string,code:int}
     */
    public function getThread($iAgentId, $sThreadId = '')
    {
        $aAgent = $this->loadAgent($iAgentId);
        if (!$aAgent)
            return ['error' => _t('_sys_agents_agent_not_found'), 'code' => (int)$iAgentId ? 404 : 400];

        $oAi = $this->getAi();
        if (!$oAi || !$oAi->canChatDirectly($aAgent))
            return ['error' => _t('_sys_agents_unauthorized'), 'code' => 403];

        $oChat = BxDolAiChat::getInstance();
        $sThreadId = trim((string)$sThreadId);
        if ($sThreadId === '' || !$oChat->isOwnAgentChatThread($aAgent, $sThreadId))
            return ['error' => _t('_sys_agents_unauthorized'), 'code' => 403];

        $aMessages = $oChat->getChatHistoryUiMessagesByThread($aAgent, $sThreadId);
        if ($aMessages === false)
            return ['error' => _t('_sys_agents_agent_not_found'), 'code' => 404];

        $sReason = trim((string)$oChat->getChatHistoryClosedReasonByThread($aAgent, $sThreadId));
        return [
            'messages' => is_array($aMessages) ? $aMessages : [],
            'status' => $sReason !== '' ? 'closed' : 'opened',
            'closed_reason' => $sReason,
            'artifacts' => $oChat->getChatHistoryArtifactsByThread($aAgent, $sThreadId),
        ];
    }

    public function extractPromptFromRequest($aData)
    {
        $aTurn = $this->extractUserTurnFromRequest($aData);
        return $aTurn['text'];
    }

    /**
     * Last user turn: text + image URLs from AG-UI `content` / `parts`.
     *
     * @return array{text:string,images:array<int,array{url:string,mime:string}>}
     */
    public function extractUserTurnFromRequest($aData)
    {
        $aEmpty = ['text' => '', 'images' => []];
        if (!is_array($aData))
            return $aEmpty;

        $sPrompt = (!empty($aData['prompt']) && is_string($aData['prompt'])) ? trim($aData['prompt']) : '';

        if (empty($aData['messages']) || !is_array($aData['messages']))
            return $sPrompt !== '' ? ['text' => $sPrompt, 'images' => []] : $aEmpty;

        $oImages = BxDolAiChatImages::getInstance();
        for ($i = count($aData['messages']) - 1; $i >= 0; $i--) {
            $aMessage = $aData['messages'][$i];
            if (!is_array($aMessage) || ($aMessage['role'] ?? '') !== 'user')
                continue;

            $aParts = [];
            if (!empty($aMessage['parts']) && is_array($aMessage['parts']))
                $aParts = array_merge($aParts, $aMessage['parts']);
            if (isset($aMessage['content']) && is_array($aMessage['content']))
                $aParts = array_merge($aParts, $aMessage['content']);

            $aText = [];
            $aImages = [];
            foreach ($aParts as $aPart) {
                if (!is_array($aPart))
                    continue;
                $sType = strtolower((string)($aPart['type'] ?? ''));
                if ($sType === 'text') {
                    $s = trim((string)($aPart['content'] ?? $aPart['text'] ?? ''));
                    if ($s !== '')
                        $aText[] = $s;
                    continue;
                }
                $aImage = $oImages->parseRequestPart($aPart);
                if ($aImage)
                    $aImages[] = $aImage;
            }

            if (!$aParts && isset($aMessage['content']) && is_string($aMessage['content']))
                $aText[] = trim($aMessage['content']);

            $sText = trim(implode("\n", $aText));
            if ($sText === '' && $sPrompt !== '')
                $sText = $sPrompt;

            return [
                'text' => $sText,
                'images' => array_slice($aImages, 0, BxDolAiChatImages::MAX_PER_TURN),
            ];
        }

        return $aEmpty;
    }

    /**
     * @param string|NeuronAI\Chat\Messages\UserMessage $mixedPrompt plain text, or a ready user message (text + images)
     */
    public function stream($iAgentId, $mixedPrompt, $aParams = [], $sThreadId = null)
    {
        $oChat = BxDolAiChat::getInstance();
        $oLimits = BxDolAiChatLimits::getInstance();
        if (!isset($aParams['chat_history_subindex']))
            $aParams = array_merge($oChat->resolveChatHistoryParams($iAgentId), $aParams);

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

        $aAgent = BxDolAiQuery::getAgentObject((int)$iAgentId);
        if ($aAgent)
            $oChat->setChatContext($aAgent, $aParams);

        if ($aAgent && $oLimits->isChatSessionRateLimited($aAgent, $aParams)) {
            $this->emitErrorSse($oAdapter, $fEmit, $oLimits->getChatSessionRateLimitError());
            error_clear_last();
            @ini_set('display_errors', '0');
            exit;
        }

        if ($aAgent)
            $oChat->openPartitionedChatThread($aAgent, $aParams);

        $iRequestTurns = (int)($aParams['request_user_turns'] ?? 0);
        if ($aAgent && $oLimits->isChatTurnLimitReached($aAgent, $oLimits->getChatUserTurnCount((int)$iAgentId, $aParams), $iRequestTurns)) {
            $oChat->emitConversationClosed('limit', '', $aAgent, $aParams);
            $this->emitLimitSse($oAdapter, $fEmit, $oLimits->getChatLimitMessage($aAgent));
            error_clear_last();
            @ini_set('display_errors', '0');
            exit;
        }

        $oUserMessage = $mixedPrompt instanceof NeuronAI\Chat\Messages\UserMessage
            ? $mixedPrompt
            : BxDolAiChatImages::getInstance()->makeUserMessage($oLimits->applyChatInputLimit((string)$mixedPrompt, $aAgent ?: []), []);
        $sPrompt = $oUserMessage ? (string)$oUserMessage->getContent() : '';

        $oChat->resetPendingChatActions();
        $bStarted = false;
        $aSseState = $this->resetActionsSseState();
        $o = null;
        try {
            if (!$oUserMessage)
                throw new Exception('Empty chat message');
            $o = BxDolAi::getAgentInstance((int)$iAgentId, $aParams);
            $oHandler = $o->stream($oUserMessage);

            foreach ($oHandler->events($oAdapter) as $sChunk) {
                $bStarted = true;
                foreach ($this->splitSseEvents($sChunk) as $sEvent) {
                    $aPayload = $this->parseSseEvent($sEvent);
                    $sType = is_array($aPayload) ? (string)($aPayload['type'] ?? '') : '';
                    // Buttons queued by tools must reach the client before RUN_FINISHED.
                    if ($sType === 'RUN_FINISHED')
                        $this->finishActionsSse($o, $aSseState, $fEmit);
                    $this->processActionsSseEvent($sEvent, $aSseState, $fEmit);
                }
            }

            $this->flushActionsSseState($aSseState, $fEmit);
            if (empty($aSseState['customEmitted']))
                $this->finishActionsSse($o, $aSseState, $fEmit);

            if ($aAgent && $oLimits->isChatTurnLimitReached($aAgent, $oLimits->getChatUserTurnCount((int)$iAgentId, $aParams)))
                $oChat->emitConversationClosed('limit', '', $aAgent, $aParams);
        } catch (Throwable $oException) {
            bx_log('sys_agents', "Stream exception for agent {$iAgentId}: " . $oException->getMessage() . " INPUT:" . $sPrompt);
            $this->flushActionsSseState($aSseState, $fEmit);
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

    protected function hydrate($iAgentId)
    {
        if (false !== bx_get('offset'))
            return echoJson(['code' => 405, 'msg' => _t('_error occured'), 'messages' => [], 'activeRun' => null, 'interrupts' => null]);

        $aAgent = $this->loadAgent($iAgentId);
        if (!$aAgent)
            return echoJson(['code' => (int)$iAgentId ? 404 : 400, 'msg' => _t('_sys_agents_agent_not_found'), 'messages' => [], 'activeRun' => null, 'interrupts' => null]);

        $oAi = $this->getAi();
        if (!$oAi)
            return echoJson(['code' => 503, 'msg' => _t('_sys_agents_exception'), 'messages' => [], 'activeRun' => null, 'interrupts' => null]);

        if (!$oAi->canChatDirectly($aAgent))
            return echoJson(['code' => 403, 'msg' => _t('_sys_agents_unauthorized'), 'messages' => [], 'activeRun' => null, 'interrupts' => null]);

        $aParams = $this->historyParams($aAgent);
        if (!$aParams)
            return echoJson(['code' => 403, 'msg' => _t('_sys_agents_unauthorized'), 'messages' => [], 'activeRun' => null, 'interrupts' => null]);

        $oChat = BxDolAiChat::getInstance();
        $oChat->openPartitionedChatThread($aAgent, $aParams);

        try {
            $aMessages = $oChat->getChatHistoryUiMessages($aAgent['id'], $aParams);
        } catch (Throwable $o) {
            $aMessages = [];
        }

        if (!is_array($aMessages))
            $aMessages = [];

        return echoJson([
            'messages' => $aMessages,
            'activeRun' => null,
            'interrupts' => null,
        ]);
    }

    /**
     * Member/guest subindex + optional `?context=` (group/org profile id).
     * Invalid context is 403 — never fall back to the site-wide thread.
     * Without `?chat=`, follow the owner's current open thread (see BxDolAiChat::resolveCurrentChatThread).
     */
    protected function historyParams($aAgent)
    {
        $oChat = BxDolAiChat::getInstance();
        $mixedContext = $oChat->resolveChatHistoryContextPid();
        if ($mixedContext === false)
            return false;

        $aParams = $oChat->resolveChatHistoryParams((int)$aAgent['id']);
        $aParams['chat_history_context_pid'] = (int)$mixedContext;
        return $oChat->resolveCurrentChatThread($aAgent, $aParams);
    }

    protected function loadAgent($iAgentId)
    {
        $iAgentId = (int)$iAgentId;
        if (!$iAgentId)
            return false;

        $aAgent = BxDolAiQuery::getAgentObject($iAgentId);
        if (!$aAgent || empty($aAgent['active']))
            return false;

        return $aAgent;
    }

    protected function sseEvent($aPayload)
    {
        return 'data: ' . json_encode($aPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
    }

    /**
     * One adapter chunk may carry several SSE frames (`data: …\n\n` ×N). Split so each is processed on its own.
     *
     * @return string[]
     */
    protected function splitSseEvents($sChunk)
    {
        $s = trim(str_replace(["\r\n", "\r"], "\n", (string)$sChunk));
        if ($s === '')
            return [$sChunk];

        $aOut = [];
        foreach (preg_split('/\n\s*\n/', $s) as $sFrame) {
            $sFrame = trim($sFrame);
            if ($sFrame !== '')
                $aOut[] = $sFrame . "\n\n";
        }
        return $aOut ?: [$sChunk];
    }

    protected function parseSseEvent($sEvent)
    {
        $s = str_replace(["\r\n", "\r"], "\n", (string)$sEvent);
        $aLast = null;
        foreach (preg_split('/\n\s*\n/', trim($s)) as $sFrame) {
            $aData = [];
            foreach (explode("\n", $sFrame) as $sLine) {
                if (stripos($sLine, 'data:') === 0)
                    $aData[] = ltrim(substr($sLine, 5));
            }
            if (!$aData)
                continue;
            $a = json_decode(implode("\n", $aData), true);
            if (is_array($a))
                $aLast = $a;
        }
        return $aLast;
    }

    /**
     * `lastMessageId` / `lastText` remember the assistant message just finished (so
     * buttons queued by a tool can be attached to it); `customEmitted` — the
     * `chat_actions` event went out for this turn already.
     */
    protected function resetActionsSseState($aKeep = [])
    {
        return array_merge([
            'mode' => 'undecided',
            'buf' => '',
            'messageId' => '',
            'held' => [],
            'lastMessageId' => '',
            'lastText' => '',
            'customEmitted' => false,
        ], $aKeep);
    }

    protected function rememberActionsSseTurn(&$aState, $sMessageId = '', $sText = '', $bCustom = null)
    {
        $aState = $this->resetActionsSseState([
            'lastMessageId' => $sMessageId !== '' ? $sMessageId : (string)($aState['lastMessageId'] ?? ''),
            'lastText' => $sText !== '' ? $sText : (string)($aState['lastText'] ?? ''),
            'customEmitted' => $bCustom === null ? !empty($aState['customEmitted']) : (bool)$bCustom,
        ]);
    }

    protected function emitHeldActionsSse(&$aState, $fEmit)
    {
        foreach ($aState['held'] as $sHeld)
            $fEmit($sHeld);
        $aState['held'] = [];
    }

    protected function emitParsedActionsSse(&$aState, $fEmit, $aParsed)
    {
        $sId = $aState['messageId'] !== '' ? $aState['messageId'] : ('msg_' . uniqid());
        $fEmit($this->sseEvent([
            'type' => 'TEXT_MESSAGE_START',
            'messageId' => $sId,
            'role' => 'assistant',
        ]));
        if ($aParsed['content'] !== '') {
            $fEmit($this->sseEvent([
                'type' => 'TEXT_MESSAGE_CONTENT',
                'messageId' => $sId,
                'delta' => $aParsed['content'],
            ]));
        }
        $fEmit($this->sseEvent([
            'type' => 'TEXT_MESSAGE_END',
            'messageId' => $sId,
        ]));
        $bCustom = false;
        if (!empty($aParsed['actions']))
            $bCustom = $this->emitActionsCustomSse($sId, $aParsed['actions'], $fEmit);

        $aState = $this->resetActionsSseState([
            'lastMessageId' => $sId,
            'lastText' => (string)($aParsed['content'] ?? ''),
            'customEmitted' => !empty($aState['customEmitted']) || $bCustom,
        ]);
        if (empty($aState['customEmitted']))
            $this->emitPendingActionsSse($aState, $fEmit, $aParsed['actions'] ?? []);
    }

    /**
     * `chat_actions` custom event: `messageId` + `value` (the buttons) — what the App chat widget reads.
     */
    protected function emitActionsCustomSse($sMessageId, $aActions, $fEmit)
    {
        $aActions = BxDolAiChatUi::getInstance()->sanitizeChatActions($aActions);
        if (!$aActions)
            return false;

        $fEmit($this->sseEvent([
            'type' => 'CUSTOM',
            'name' => 'chat_actions',
            'messageId' => (string)$sMessageId,
            'value' => $aActions,
        ]));
        return true;
    }

    /**
     * Buttons queued by the `chat_buttons` tool (plus `$aExtra`), once per turn,
     * pinned to the last assistant message.
     */
    protected function emitPendingActionsSse(&$aState, $fEmit, $aExtra = [])
    {
        if (!empty($aState['customEmitted']))
            return false;

        $oChat = BxDolAiChat::getInstance();
        $aActions = BxDolAiChatUi::getInstance()->mergeChatActions($oChat->getPendingChatActions(), $aExtra);
        if (!$aActions)
            return false;

        $sMid = (string)($aState['lastMessageId'] ?? '');
        if ($sMid === '')
            $sMid = (string)($aState['messageId'] ?? '');

        if (!$this->emitActionsCustomSse($sMid, $aActions, $fEmit))
            return false;

        $aState['customEmitted'] = true;
        return true;
    }

    /**
     * End of the model turn: flush held text, pin actions to the stored assistant
     * message, emit whatever buttons are still pending.
     */
    protected function finishActionsSse($oAgent, &$aState, $fEmit)
    {
        $this->flushActionsSseState($aState, $fEmit);
        $aDone = $this->persistAssistantActions($oAgent, (string)($aState['lastText'] ?? ''));
        if (($aState['lastMessageId'] ?? '') === '' && !empty($aDone['messageId']))
            $aState['lastMessageId'] = (string)$aDone['messageId'];
        $this->emitPendingActionsSse($aState, $fEmit, $aDone['actions'] ?? []);
    }

    protected function processActionsSseEvent($sEvent, &$aState, $fEmit)
    {
        $oUi = BxDolAiChatUi::getInstance();
        $aPayload = $this->parseSseEvent($sEvent);
        $sType = is_array($aPayload) ? (string)($aPayload['type'] ?? '') : '';

        if ($sType === 'TEXT_MESSAGE_START') {
            if ($aState['held'] || $aState['buf'] !== '')
                $this->flushActionsSseState($aState, $fEmit);
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
                $mixed = $this->actionsStreamLooksLikeJson($aState['buf']);
                if ($mixed === false) {
                    $aState['mode'] = 'text';
                    $this->emitHeldActionsSse($aState, $fEmit);
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
            $aParsed = $oUi->parseAssistantChatPayload($aState['buf']);
            if ($aParsed && ($aState['mode'] === 'json' || $aState['mode'] === 'undecided')) {
                $this->emitParsedActionsSse($aState, $fEmit, $aParsed);
                return;
            }
            $sId = (string)($aState['messageId'] ?? '');
            $sText = (string)($aState['buf'] ?? '');
            $this->emitHeldActionsSse($aState, $fEmit);
            $fEmit($sEvent);
            $this->rememberActionsSseTurn($aState, $sId, $sText);
            $this->emitPendingActionsSse($aState, $fEmit);
            return;
        }

        if ($sType === 'RUN_ERROR' || $sType === 'RUN_FINISHED') {
            $this->flushActionsSseState($aState, $fEmit);
            $fEmit($sEvent);
            return;
        }

        // Tool call frames are internal: not forwarded, but they end the text so far.
        if ($sType === 'TOOL_CALL_START' || $sType === 'TOOL_CALL_ARGS' || $sType === 'TOOL_CALL_END' || $sType === 'TOOL_CALL_RESULT') {
            if ($aState['mode'] === 'json' || $aState['held'] || $aState['buf'] !== '')
                $this->flushActionsSseState($aState, $fEmit);
            return;
        }

        if ($aState['mode'] === 'json' || $aState['held'])
            $this->flushActionsSseState($aState, $fEmit);

        $fEmit($sEvent);
    }

    protected function actionsStreamLooksLikeJson($sBuf)
    {
        $s = ltrim((string)$sBuf);
        if ($s === '')
            return null;
        $sFirst = $s[0];
        if ($sFirst === '{' || $sFirst === '`')
            return true;
        return false;
    }

    protected function flushActionsSseState(&$aState, $fEmit)
    {
        if ($aState['buf'] === '' && !$aState['held'])
            return;

        $aParsed = BxDolAiChatUi::getInstance()->parseAssistantChatPayload($aState['buf']);
        if ($aParsed && $aState['mode'] !== 'text') {
            $this->emitParsedActionsSse($aState, $fEmit, $aParsed);
            return;
        }

        $sId = (string)($aState['messageId'] ?? '');
        $sText = (string)($aState['buf'] ?? '');
        $this->emitHeldActionsSse($aState, $fEmit);
        $this->rememberActionsSseTurn($aState, $sId, $sText);
    }

    /**
     * Pin this turn's actions (JSON payload and/or `chat_buttons` tool) to the last
     * assistant message in history, so hydrate shows them again.
     *
     * @return array{messageId: string, actions: array}
     */
    protected function persistAssistantActions($oAgent, $sThisTurnText = '')
    {
        $oUi = BxDolAiChatUi::getInstance();
        $aEmpty = ['messageId' => '', 'actions' => []];
        $aPending = BxDolAiChat::getInstance()->takePendingChatActions();

        if (!is_object($oAgent) || !method_exists($oAgent, 'getChatHistory'))
            return ['messageId' => '', 'actions' => $aPending];

        $oHistory = $oAgent->getChatHistory();
        if (!is_object($oHistory) || !method_exists($oHistory, 'getMessages'))
            return ['messageId' => '', 'actions' => $aPending];

        $aMessages = $oHistory->getMessages();
        for ($i = count($aMessages) - 1; $i >= 0; $i--) {
            $oMessage = $aMessages[$i];
            if ($oMessage instanceof NeuronAI\Chat\Messages\ToolResultMessage)
                continue;

            // When the model obeys "do not write another message after chat_buttons"
            // the turn ends on the ToolCallMessage: pin the buttons to it, or they
            // would be lost from history.
            $sRole = $oMessage->getRole();
            if ($sRole === 'model' || $oMessage instanceof NeuronAI\Chat\Messages\ToolCallMessage)
                $sRole = 'assistant';
            if ($sRole !== 'assistant')
                return ['messageId' => '', 'actions' => $aPending];

            $sStored = (string)$oMessage->getContent();
            $aParsed = $oUi->parseAssistantChatPayload($sStored);
            if (!$aParsed && $sThisTurnText !== '')
                $aParsed = $oUi->parseAssistantChatPayload($sThisTurnText);

            $aActions = $oUi->mergeChatActions($aPending, is_array($aParsed) ? ($aParsed['actions'] ?? []) : []);
            if (!$aActions)
                return $aEmpty;

            if ($aParsed && method_exists($oMessage, 'setContents'))
                $oMessage->setContents($aParsed['content']);
            if (method_exists($oMessage, 'addMetadata'))
                $oMessage->addMetadata('actions', $aActions);
            if (method_exists($oHistory, 'persistMessages'))
                $oHistory->persistMessages();

            $sId = method_exists($oMessage, 'getMetadata') ? $oMessage->getMetadata('__id') : '';
            return [
                'messageId' => is_string($sId) ? $sId : '',
                'actions' => $aActions,
            ];
        }

        return ['messageId' => '', 'actions' => $aPending];
    }

    /**
     * SSE assistant reply without calling the model. Used when max_turns is hit.
     */
    protected function emitLimitSse($oAdapter, $fEmit, $sMessage)
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
    protected function emitErrorSse($oAdapter, $fEmit, $sMessage)
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
}

/** @} */

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

        $sPrompt = $this->extractPromptFromRequest($aData);
        if (!$sPrompt)
            return echoJson(['code' => 400, 'msg' => _t('_sys_agents_json_field_err')]);

        $aParams = $this->historyParams($aAgent);
        if (!$aParams)
            return echoJson(['code' => 403, 'msg' => _t('_sys_agents_unauthorized')]);

        $aParams['request_user_turns'] = $oAi->countChatUserTurns($aData['messages'] ?? []);

        $sThreadId = !empty($aData['threadId']) ? $aData['threadId'] : null;

        if (class_exists('NeuronAI\Chat\Messages\Stream\Adapters\AGUIAdapter')) {
            $this->stream($aAgent['id'], $sPrompt, $aParams, $sThreadId);
            return;
        }

        try {
            $sReply = $this->call($aAgent, $sPrompt);
        } catch (Throwable $o) {
            return echoJson(['code' => 500, 'msg' => $o->getMessage(), 'messages' => []]);
        }
        return echoJson(['code' => 200, 'msg' => $sReply, 'text' => $sReply]);
    }

    public function extractPromptFromRequest($aData)
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

    public function stream($iAgentId, $sPrompt, $aParams = [], $sThreadId = null)
    {
        $oAi = $this->getAi();
        if ($oAi && !isset($aParams['chat_history_subindex']))
            $aParams = array_merge($oAi->resolveChatHistoryParams($iAgentId), $aParams);

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
        if ($aAgent && $oAi)
            $oAi->setChatContext($aAgent, $aParams);

        if ($aAgent && $oAi && $oAi->isChatSessionRateLimited($aAgent, $aParams)) {
            $this->emitErrorSse($oAdapter, $fEmit, $oAi->getChatSessionRateLimitError());
            error_clear_last();
            @ini_set('display_errors', '0');
            exit;
        }

        $iRequestTurns = (int)($aParams['request_user_turns'] ?? 0);
        if ($aAgent && $oAi && $oAi->isChatTurnLimitReached($aAgent, $oAi->getChatUserTurnCount((int)$iAgentId, $aParams), $iRequestTurns)) {
            $oAi->emitConversationClosed('limit', '', $aAgent, $aParams);
            $this->emitLimitSse($oAdapter, $fEmit, $oAi->getChatLimitMessage($aAgent));
            error_clear_last();
            @ini_set('display_errors', '0');
            exit;
        }

        $sPrompt = $oAi ? $oAi->applyChatInputLimit((string)$sPrompt, $aAgent ?: []) : (string)$sPrompt;

        $bStarted = false;
        $aSseState = $this->resetActionsSseState();
        $o = null;
        try {
            $o = BxDolAi::getAgentInstance((int)$iAgentId, $aParams);
            $oHandler = $o->stream(new NeuronAI\Chat\Messages\UserMessage($sPrompt));

            foreach ($oHandler->events($oAdapter) as $sEvent) {
                $bStarted = true;
                $this->processActionsSseEvent($sEvent, $aSseState, $fEmit);
            }

            $this->flushActionsSseState($aSseState, $fEmit);
            $this->persistAssistantActions($o);

            if ($aAgent && $oAi && $oAi->isChatTurnLimitReached($aAgent, $oAi->getChatUserTurnCount((int)$iAgentId, $aParams)))
                $oAi->emitConversationClosed('limit', '', $aAgent, $aParams);
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

        try {
            $aMessages = $oAi->getChatHistoryUiMessages($aAgent['id'], $aParams);
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
     */
    protected function historyParams($aAgent)
    {
        $oAi = $this->getAi();
        $mixedContext = $oAi->resolveChatHistoryContextPid();
        if ($mixedContext === false)
            return false;

        $aParams = $oAi->resolveChatHistoryParams((int)$aAgent['id']);
        $aParams['chat_history_context_pid'] = (int)$mixedContext;
        return $aParams;
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

    protected function parseSseEvent($sEvent)
    {
        $s = trim((string)$sEvent);
        if (!preg_match('/^data:\s*(.+)$/s', $s, $aM))
            return null;

        $a = json_decode($aM[1], true);
        return is_array($a) ? $a : null;
    }

    protected function resetActionsSseState()
    {
        return [
            'mode' => 'undecided',
            'buf' => '',
            'messageId' => '',
            'held' => [],
        ];
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
        if (!empty($aParsed['actions'])) {
            $fEmit($this->sseEvent([
                'type' => 'CUSTOM',
                'name' => 'chat_actions',
                'messageId' => $sId,
                'value' => $aParsed['actions'],
            ]));
        }
        $aState = $this->resetActionsSseState();
    }

    protected function processActionsSseEvent($sEvent, &$aState, $fEmit)
    {
        $oAi = $this->getAi();
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
            $aParsed = $oAi->parseAssistantChatPayload($aState['buf']);
            if ($aParsed && ($aState['mode'] === 'json' || $aState['mode'] === 'undecided')) {
                $this->emitParsedActionsSse($aState, $fEmit, $aParsed);
                return;
            }
            $this->emitHeldActionsSse($aState, $fEmit);
            $fEmit($sEvent);
            $aState = $this->resetActionsSseState();
            return;
        }

        if ($sType === 'RUN_ERROR' || $sType === 'RUN_FINISHED') {
            $this->flushActionsSseState($aState, $fEmit);
            $fEmit($sEvent);
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
        $oAi = $this->getAi();
        if ($aState['buf'] === '' && !$aState['held'])
            return;

        $aParsed = $oAi->parseAssistantChatPayload($aState['buf']);
        if ($aParsed && $aState['mode'] !== 'text') {
            $this->emitParsedActionsSse($aState, $fEmit, $aParsed);
            return;
        }

        $this->emitHeldActionsSse($aState, $fEmit);
        $aState = $this->resetActionsSseState();
    }

    protected function persistAssistantActions($oAgent)
    {
        $oAi = $this->getAi();
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

            $aParsed = $oAi->parseAssistantChatPayload((string)$oMessage->getContent());
            if (!$aParsed)
                return;

            $oMessage->setContents($aParsed['content']);
            $oMessage->addMetadata('actions', $aParsed['actions']);
            $oHistory->persistMessages();
            return;
        }
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

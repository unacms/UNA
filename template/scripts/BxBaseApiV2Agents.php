<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: the site's AI agents the viewer may chat with, the viewer's chats with them, and a
 * turn of a chat with the reply streamed as it is written. The apps' agent chats (the desktop
 * app's Agent button and chat panels) are built on it.
 *
 * Agents are core (BxDolAi*, Studio > Agents), not a module. What the site's own chat widget
 * (`sys-ai-chat/{id}`, BxDolAiTriggerChat, NEO's ai-agent molecule) does is done here through the
 * same classes, so the same rules hold:
 * - an agent is listed and may be talked to when it is active, its trigger is `manual` or
 *   `message` (the agents meant for people), and the viewer may interact with it
 *   (BxDolAi::canChatDirectly: its "Visible for" levels, `acl_levels`; administrators always);
 * - a chat is one of the viewer's own threads of the agent's history (`sys_agents_chat_history`,
 *   thread `manual:<agent>:<profile>#<chat>`): `chat` is its nonce (8 to 64 letters, digits,
 *   `-` and `_`, BxDolAiChat::sanitizeChatQueryId), and `default` the thread without one that the
 *   site's widget talks to before a "New chat"; chats in a context (a group's agent block) are the
 *   site's and left out;
 * - a turn goes through BxDolAiTriggerChat::streamTo: the session and turn limits, the input
 *   limit, the history, the agent's tools, and the AG-UI events the site's widget reads.
 *
 * Guests get the agents their level may talk to; their chats need a sign-in, since API v2 keeps
 * no guest session that a guest's chat would belong to.
 */
class BxBaseApiV2Agents
{
    /** The id of the thread without a chat nonce (the site widget's first chat). */
    const DEFAULT_CHAT = 'default';

    /** A chat id: `default`, or a nonce as BxDolAiChat::sanitizeChatQueryId keeps it. */
    const CHAT_PATTERN = '^(default|[A-Za-z0-9_-]{8,64})$';

    /** The longest message when the agent sets no `max_input_chars`. */
    const INPUT_MAX = 8000;

    /** How many chats GET /agents/{id}/chats lists at most, the newest first. */
    const CHATS_MAX = 50;

    #[BxDolApiV2Operation(
        method: 'GET', path: '/agents', id: 'listAgents', tag: 'agents',
        summary: 'The AI agents the viewer may chat with',
        description: 'The site\'s agents (Studio > Agents) the viewer may talk to: active, meant for people (trigger `manual` or `message`) and with the viewer\'s membership level among theirs ("Visible for"; administrators may talk to every one). `default_id` is the site\'s operator agent (Studio > Settings > Agents, `sys_agents_operator_agent`) when the viewer may talk to it, else the first one, else null: a client shows no agent chat at all without one. Guests get the agents guests may talk to (an empty list on most sites).',
        responses: [200 => 'AgentList'],
    )]
    public function listAgents(BxDolApiV2Request $oReq)
    {
        $oAi = BxDolAi::getInstance();
        if (!$oAi)
            return ['items' => [], 'default_id' => null];

        $iOperator = (int)getParam('sys_agents_operator_agent');
        $aItems = [];
        $sDefault = null;
        foreach ((new BxDolAiQuery())->getChatAgents() as $aAgent) {
            if (!$oAi->canChatDirectly($aAgent))
                continue;
            $aItems[] = $this->_agent($aAgent, (int)$aAgent['id'] === $iOperator);
            if ((int)$aAgent['id'] === $iOperator)
                $sDefault = BxDolApiV2Map::id($aAgent['id']);
        }
        if ($sDefault === null && $aItems)
            $sDefault = $aItems[0]['id'];
        foreach ($aItems as $i => $a)
            $aItems[$i]['default'] = $a['id'] === $sDefault;

        return ['items' => $aItems, 'default_id' => $sDefault];
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/agents/{id}/chats', id: 'listAgentChats', tag: 'agents', auth: 'required',
        summary: 'The viewer\'s chats with an agent, the latest first',
        description: 'The viewer\'s own chats with the agent (the history the site\'s chat widget lists), the most recently active first, at most ' . self::CHATS_MAX . '. A closed chat with nothing in it is left out. 403 for an agent the viewer may not talk to.',
        responses: [200 => 'AgentChatList', 403 => null, 404 => null],
    )]
    public function listAgentChats(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $aAgent = $this->_chatAgent($oReq->id());

        $aItems = [];
        $this->_withChat(null, function () use ($aAgent, &$aItems) {
            foreach (BxDolAiChat::getInstance()->listOwnAgentChatThreads($aAgent) as $a) {
                // the site's own: a chat in a context (a group's agent block)
                if ((int)$a['context_pid'] > 0)
                    continue;
                $aItems[] = $this->_chat($a);
                if (count($aItems) >= self::CHATS_MAX)
                    break;
            }
        });
        return ['items' => $aItems];
    }

    #[BxDolApiV2Operation(
        method: 'POST', path: '/agents/{id}/chats', id: 'createAgentChat', tag: 'agents', auth: 'required',
        summary: 'Start a new chat with an agent',
        description: 'A new, empty chat of the viewer\'s with the agent, listed at once (as the site widget\'s New chat). The chats before stay open. 403 for an agent the viewer may not talk to.',
        responses: [201 => 'AgentChat', 403 => null, 404 => null],
    )]
    public function createAgentChat(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $aAgent = $this->_chatAgent($oReq->id());

        $sChat = bin2hex(random_bytes(8));
        $aChat = null;
        $this->_withChat($sChat, function () use ($aAgent, $sChat, &$aChat) {
            $oChat = BxDolAiChat::getInstance();
            $aParams = $oChat->resolveChatHistoryParams((int)$aAgent['id']);
            $oChat->openPartitionedChatThread($aAgent, $aParams);
            $aChat = $this->_ownChat($aAgent, $sChat);
        });
        if (!$aChat)
            throw new BxDolApiV2Problem(500, 'internal_error', 'The chat could not be started');

        return BxDolApiV2Response::created($aChat, '/agents/' . (int)$aAgent['id'] . '/chats/' . $sChat);
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/agents/{id}/chats/{chat}', id: 'getAgentChat', tag: 'agents', auth: 'required',
        summary: 'One of the viewer\'s chats with an agent, with its messages',
        description: 'The chat and its messages, oldest first: what the person wrote and what the agent answered, as text (Markdown, as written) and as HTML (the text through Markdown in safe mode, as the site turns an agent\'s reply into a Messenger message), without the tools\' results. A chat of someone else\'s, or of another agent, is 404, as is one in a context.',
        params: [
            'chat' => ['in' => 'path', 'required' => true, 'schema' => ['type' => 'string', 'pattern' => self::CHAT_PATTERN], 'description' => 'The chat\'s id: `default` or its nonce'],
        ],
        responses: [200 => 'AgentChatThread', 403 => null, 404 => null],
    )]
    public function getAgentChat(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $aAgent = $this->_chatAgent($oReq->id());
        $sChat = $this->_chatId($oReq);

        $aResult = null;
        $this->_withChat($sChat, function () use ($aAgent, $sChat, &$aResult) {
            $aChat = $this->_ownChat($aAgent, $sChat);
            if (!$aChat)
                return;
            $oChat = BxDolAiChat::getInstance();
            $aMessages = $oChat->getChatHistoryUiMessagesByThread($aAgent, $this->_threadId($aAgent, $sChat));
            $aResult = ['chat' => $aChat, 'messages' => $this->_messages(is_array($aMessages) ? $aMessages : [])];
        });
        if (!$aResult)
            throw BxDolApiV2Problem::notFound('The chat');

        return $aResult;
    }

    #[BxDolApiV2Operation(
        method: 'POST', path: '/agents/{id}/chats/{chat}/messages', id: 'sendAgentMessage', tag: 'agents', auth: 'required', limit: 'agent',
        summary: 'Write to an agent and read its reply as it is written',
        description: 'A turn of the chat: the viewer\'s message, and the agent\'s reply streamed as Server-Sent Events while the agent writes it (`text/event-stream`, each event `data: <JSON>`, an AgentEvent). These are AG-UI\'s events, the ones the site\'s chat widget reads: `RUN_STARTED`; `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT` with the next piece of the reply in `delta` (Markdown), `TEXT_MESSAGE_END`; tool calls (`TOOL_CALL_*`); `CUSTOM` events named `chat_actions` (buttons the agent offers, `value.actions`) and `chat_session` (`value.closed`: the agent closed the chat); then `RUN_FINISHED`, or `RUN_ERROR` with `message` when the agent could not answer (no model set up, the model failed, the session limit). The chat keeps both messages, so GET /agents/{id}/chats/{chat} has them, the reply as HTML too. Closing the connection stops the reply. The message is text, at most the agent\'s `max_input_chars` (' . self::INPUT_MAX . ' when it sets none). A chat that does not exist yet is started by it (as the site widget does). 403 for an agent the viewer may not talk to, 404 for a chat of someone else\'s.',
        params: [
            'chat' => ['in' => 'path', 'required' => true, 'schema' => ['type' => 'string', 'pattern' => self::CHAT_PATTERN], 'description' => 'The chat\'s id: `default` or its nonce'],
        ],
        body: 'NewAgentMessage',
        responses: [200 => 'sse:AgentEvent', 403 => null, 404 => null],
    )]
    public function sendAgentMessage(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $aAgent = $this->_chatAgent($oReq->id());
        $sChat = $this->_chatId($oReq);
        $aBody = $oReq->body();

        $sText = trim((string)($aBody['text'] ?? ''));
        $iMax = (int)($aAgent['max_input_chars'] ?? 0) > 0 ? (int)$aAgent['max_input_chars'] : self::INPUT_MAX;
        if ($sText === '')
            throw BxDolApiV2Problem::validation([['field' => 'text', 'code' => 'required', 'message' => 'Write something']]);
        if (get_mb_len($sText) > $iMax)
            throw BxDolApiV2Problem::validation([['field' => 'text', 'code' => 'too_long', 'message' => 'At most ' . $iMax . ' characters']]);

        // someone else's thread can't be named: the thread is always the viewer's own (its owner is
        // the viewer's profile); one that exists already must be the viewer's site-wide one
        $aParams = null;
        $this->_withChat($sChat, function () use ($aAgent, &$aParams) {
            $aParams = BxDolAiChat::getInstance()->resolveChatHistoryParams((int)$aAgent['id']);
        });
        $aParams['chat_history_context_pid'] = 0;
        $sThreadId = BxDolAiChat::threadId($aAgent, $aParams);

        $oTrigger = new BxDolAiTriggerChat();
        return BxDolApiV2Response::stream(function ($fWrite) use ($oTrigger, $aAgent, $sText, $aParams, $sThreadId, $sChat) {
            // the history and the agent read the chat's nonce from the request, as the widget's do
            $this->_withChat($sChat, function () use ($oTrigger, $aAgent, $sText, $aParams, $sThreadId, $fWrite) {
                $oTrigger->streamTo((int)$aAgent['id'], $sText, $aParams, $sThreadId, $fWrite);
            });
        });
    }

    /**
     * The agent by its id when the viewer may chat with it: 404 for none (or not active, or not
     * meant for people), 403 for one the viewer may not talk to.
     */
    protected function _chatAgent($iId)
    {
        $oAi = BxDolAi::getInstance();
        $aAgent = $oAi ? BxDolAiQuery::getAgentObject((int)$iId) : false;
        if (!$aAgent || empty($aAgent['active']) || !in_array($aAgent['trigger'] ?? '', ['manual', 'message'], true))
            throw BxDolApiV2Problem::notFound('The agent');
        if (!$oAi->canChatDirectly($aAgent))
            throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text(_t('_sys_agents_unauthorized')));
        return $aAgent;
    }

    /** The chat id of the path: '' for `default`, else the nonce. */
    protected function _chatId(BxDolApiV2Request $oReq)
    {
        $s = (string)$oReq->path('chat');
        if ($s === self::DEFAULT_CHAT)
            return '';
        $sChat = BxDolAiChat::sanitizeChatQueryId($s);
        if ($sChat === '' || $sChat !== $s)
            throw BxDolApiV2Problem::notFound('The chat');
        return $sChat;
    }

    /**
     * Run what reads the chat from the request (`?chat=`, `?context=`: BxDolAiChat) with this
     * chat's nonce and no context, and put the request back after.
     * @param string|null $sChat the nonce, '' for the default thread, null for none
     */
    protected function _withChat($sChat, callable $f)
    {
        $aKeep = ['chat' => $_GET['chat'] ?? null, 'context' => $_GET['context'] ?? null];
        unset($_GET['context'], $_GET['chat']);
        if ($sChat !== null && $sChat !== '')
            $_GET['chat'] = $sChat;
        try {
            return $f();
        }
        finally {
            unset($_GET['chat'], $_GET['context']);
            foreach ($aKeep as $sKey => $m)
                if ($m !== null)
                    $_GET[$sKey] = $m;
        }
    }

    /** The viewer's site-wide thread of a chat. */
    protected function _threadId($aAgent, $sChat)
    {
        $aParams = BxDolAiChat::getInstance()->resolveChatHistoryParams((int)$aAgent['id']);
        $aParams['chat_history_context_pid'] = 0;
        return BxDolAiChat::threadId($aAgent, $aParams);
    }

    /**
     * The viewer's chat (AgentChat), from the list the site's widget reads, or null for one that
     * is not the viewer's or has no history row (the default thread before its first message is
     * an empty chat of its own).
     */
    protected function _ownChat($aAgent, $sChat)
    {
        $oChat = BxDolAiChat::getInstance();
        $sThreadId = $this->_threadId($aAgent, $sChat);
        if (!$oChat->isOwnAgentChatThread($aAgent, $sThreadId))
            return null;
        foreach ($oChat->listOwnAgentChatThreads($aAgent) as $a)
            if ((string)$a['thread_id'] === $sThreadId)
                return $this->_chat($a);
        // not written to yet
        return $sChat === '' ? $this->_chat(['chat' => '', 'title' => '', 'preview' => '', 'status' => 'opened', 'closed_reason' => '', 'messages_count' => 0, 'created_ts' => 0, 'updated_ts' => 0]) : null;
    }

    /** An AgentChat of a row of BxDolAiChat::listOwnAgentChatThreads. */
    protected function _chat(array $a)
    {
        return [
            'id' => (string)$a['chat'] !== '' ? (string)$a['chat'] : self::DEFAULT_CHAT,
            'title' => (string)$a['title'],
            'preview' => (string)$a['preview'],
            'status' => (string)$a['status'] === 'closed' ? 'closed' : 'open',
            'closed_reason' => (string)$a['closed_reason'] !== '' ? (string)$a['closed_reason'] : null,
            'messages_count' => (int)$a['messages_count'],
            'created_at' => (int)$a['created_ts'] > 0 ? BxDolApiV2Map::date((int)$a['created_ts']) : null,
            'updated_at' => (int)$a['updated_ts'] > 0 ? BxDolApiV2Map::date((int)$a['updated_ts']) : null,
        ];
    }

    /**
     * AgentMessages of the history's UI messages: the person's and the agent's text, the hidden
     * bootstrap turns (`[page opened ...`, the agent's hidden first message) left out.
     */
    protected function _messages(array $aUi)
    {
        $oUi = BxDolAiChatUi::getInstance();
        $oParsedown = new Parsedown();
        $oParsedown->setSafeMode(true);
        $aResult = [];
        foreach ($aUi as $i => $aMessage) {
            $sRole = (string)($aMessage['role'] ?? '');
            if ($sRole !== 'user' && $sRole !== 'assistant')
                continue;
            $aTexts = [];
            foreach ((array)($aMessage['parts'] ?? []) as $aPart)
                if (is_array($aPart) && ($aPart['type'] ?? '') === 'text' && is_string($aPart['content'] ?? null))
                    $aTexts[] = $aPart['content'];
            $sText = trim(implode("\n\n", $aTexts));
            if ($sText === '' || ($sRole === 'user' && strpos($oUi->uiChatMessagePlainText($aMessage), '[page opened') === 0))
                continue;
            $aResult[] = [
                'id' => (string)($aMessage['id'] ?? ('m' . $i)),
                'role' => $sRole,
                'text' => $sText,
                'html' => $sRole === 'assistant' ? (string)$oParsedown->text($sText) : BxDolApiV2Map::htmlFromText($sText),
            ];
        }
        return $aResult;
    }

    /** An Agent. */
    protected function _agent(array $aAgent, $bOperator)
    {
        $sTitle = trim((string)($aAgent['title'] ?? ''));
        return [
            'id' => BxDolApiV2Map::id($aAgent['id']),
            'name' => (string)$aAgent['name'],
            'title' => $sTitle !== '' ? $sTitle : (string)$aAgent['name'],
            'description' => trim((string)($aAgent['description'] ?? '')),
            'icon' => BxDolApiV2Map::badgeIcon((string)($aAgent['icon'] ?? '')),
            'operator' => (bool)$bOperator,
            'default' => false,
            'max_input_chars' => (int)($aAgent['max_input_chars'] ?? 0) > 0 ? (int)$aAgent['max_input_chars'] : self::INPUT_MAX,
        ];
    }

    public static function schemas()
    {
        $aChat = [
            'type' => 'object',
            'description' => 'One of the viewer\'s chats with an agent',
            'additionalProperties' => false,
            'required' => ['id', 'title', 'preview', 'status', 'closed_reason', 'messages_count', 'created_at', 'updated_at'],
            'properties' => [
                'id' => ['type' => 'string', 'pattern' => self::CHAT_PATTERN, 'description' => 'The chat\'s nonce, or `default` for the thread the site\'s widget talks to before a New chat', 'example' => '9f2c4e1a7b3d5e60'],
                'title' => ['type' => 'string', 'description' => 'The title the agent gave it, else the first thing the person wrote; empty for a new chat'],
                'preview' => ['type' => 'string', 'description' => 'The last thing said, plain text'],
                'status' => ['type' => 'string', 'enum' => ['open', 'closed']],
                'closed_reason' => ['type' => ['string', 'null'], 'description' => 'Why the agent or the site closed it (`limit`: the turn limit)'],
                'messages_count' => ['type' => 'integer', 'minimum' => 0],
                'created_at' => ['type' => ['string', 'null'], 'format' => 'date-time'],
                'updated_at' => ['type' => ['string', 'null'], 'format' => 'date-time'],
            ],
        ];
        return [
            'Agent' => [
                'type' => 'object',
                'description' => 'An AI agent of the site (Studio > Agents) the viewer may chat with',
                'additionalProperties' => false,
                'required' => ['id', 'name', 'title', 'description', 'icon', 'operator', 'default', 'max_input_chars'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'name' => ['type' => 'string', 'example' => 'una_operator'],
                    'title' => ['type' => 'string', 'description' => 'Its title, else its name', 'example' => 'UNA operator'],
                    'description' => ['type' => 'string'],
                    'icon' => ['type' => ['string', 'null'], 'description' => 'A Lucide icon name, null for none'],
                    'operator' => ['type' => 'boolean', 'description' => 'The site\'s operator agent (`sys_agents_operator_agent`)'],
                    'default' => ['type' => 'boolean', 'description' => 'The one a client starts a chat with (`default_id`)'],
                    'max_input_chars' => ['type' => 'integer', 'description' => 'The longest message it takes'],
                ],
            ],
            'AgentList' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['items', 'default_id'],
                'properties' => [
                    'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Agent']],
                    'default_id' => ['oneOf' => [['$ref' => '#/components/schemas/Id'], ['type' => 'null']], 'description' => 'The agent a new chat goes to; null: no agent for this viewer'],
                ],
            ],
            'AgentChat' => $aChat,
            'AgentChatList' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['items'],
                'properties' => [
                    'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/AgentChat']],
                ],
            ],
            'AgentMessage' => [
                'type' => 'object',
                'description' => 'A message of a chat with an agent',
                'additionalProperties' => false,
                'required' => ['id', 'role', 'text', 'html'],
                'properties' => [
                    'id' => ['type' => 'string'],
                    'role' => ['type' => 'string', 'enum' => ['user', 'assistant'], 'description' => '`user`: the viewer; `assistant`: the agent'],
                    'text' => ['type' => 'string', 'description' => 'As written: the agent writes Markdown'],
                    'html' => ['type' => 'string', 'description' => 'The text as HTML: the agent\'s Markdown in safe mode, the viewer\'s paragraphs'],
                ],
            ],
            'AgentChatThread' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['chat', 'messages'],
                'properties' => [
                    'chat' => ['$ref' => '#/components/schemas/AgentChat'],
                    'messages' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/AgentMessage']],
                ],
            ],
            'NewAgentMessage' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['text'],
                'properties' => [
                    'text' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100000, 'description' => 'What the viewer writes, plain text; at most the agent\'s `max_input_chars`'],
                ],
            ],
            'AgentEvent' => [
                'type' => 'object',
                'description' => 'An AG-UI event of an agent\'s run (https://docs.ag-ui.com): `type` says which; the ones a client needs are listed in sendAgentMessage',
                'required' => ['type'],
                'properties' => [
                    'type' => ['type' => 'string', 'example' => 'TEXT_MESSAGE_CONTENT'],
                    'messageId' => ['type' => 'string'],
                    'delta' => ['type' => 'string', 'description' => 'TEXT_MESSAGE_CONTENT: the next piece of the reply (Markdown)'],
                    'message' => ['type' => 'string', 'description' => 'RUN_ERROR: why the agent could not answer'],
                    'name' => ['type' => 'string', 'description' => 'CUSTOM: `chat_actions` or `chat_session`'],
                    'value' => ['type' => 'object', 'description' => 'CUSTOM: its value'],
                ],
            ],
        ];
    }
}

/** @} */

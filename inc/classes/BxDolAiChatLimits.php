<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiChatLimits
{
    protected $_oDb;

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new self();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function __construct()
    {
        $this->_oDb = new BxDolAiQuery();
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
            $aParams = array_merge(BxDolAiChat::getInstance()->resolveChatHistoryParams($iAgentId), $aParams);

        try {
            $o = BxDolAi::getAgentInstance((int)$iAgentId, $aParams);
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
            $aParams = array_merge(BxDolAiChat::getInstance()->resolveChatHistoryParams((int)($aAgent['id'] ?? 0)), $aParams);

        $sThreadId = BxDolAiChat::threadId($aAgent, $aParams);
        if (!$this->_oDb->isNewChatSession($sThreadId))
            return false;

        $sIp = $this->getVisitorIpHash();
        if ($sIp === '0' || $sIp === '')
            return false;

        $sPrefix = ($aAgent['trigger'] ?? '') . ':' . ($aAgent['id'] ?? '');
        if ($sPrefix === ':')
            return false;

        if ($iHour > 0 && $this->_oDb->countChatSessionsByIp($sIp, $sPrefix, 3600) >= $iHour)
            return true;
        if ($iDay > 0 && $this->_oDb->countChatSessionsByIp($sIp, $sPrefix, 86400) >= $iDay)
            return true;

        return false;
    }

    protected function getVisitorIpHash()
    {
        if (!function_exists('getVisitorIP') || !function_exists('bx_get_ip_hash'))
            return '0';
        return (string)bx_get_ip_hash(getVisitorIP());
    }
}

/** @} */

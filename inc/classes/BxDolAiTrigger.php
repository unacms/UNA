<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

interface iBxDolAiTrigger
{
    public function getType();

    /**
     * Host entry point (alert, cron, webhook, HTTP).
     * @param mixed $mixed host-specific context
     */
    public function handle($mixed = null);

    /**
     * Run one agent. Used by handle() and background jobs.
     */
    public function call($aAgent, $mixedParams = []);
}

class BxDolAiTrigger extends BxDol implements iBxDolAiTrigger
{
    protected $_sType = '';

    public static function getInstance($sType)
    {
        if ('chat' === $sType)
            $sType = 'manual';

        $aMap = [
            'alert' => 'BxDolAiTriggerAlert',
            'message' => 'BxDolAiTriggerMessage',
            'webhook' => 'BxDolAiTriggerWebhook',
            'scheduler' => 'BxDolAiTriggerScheduler',
            'form-input' => 'BxDolAiTriggerFormInput',
            'manual' => 'BxDolAiTriggerChat',
        ];

        $sClass = $aMap[$sType] ?? 'BxDolAiTrigger';
        $sKey = __CLASS__ . '_' . $sType;
        if (!isset($GLOBALS['bxDolClasses'][$sKey])) {
            $o = new $sClass();
            if ('BxDolAiTrigger' === $sClass)
                $o->_sType = $sType;
            $GLOBALS['bxDolClasses'][$sKey] = $o;
        }

        return $GLOBALS['bxDolClasses'][$sKey];
    }

    public function getType()
    {
        return $this->_sType;
    }

    public function handle($mixed = null)
    {
        return false;
    }

    public function call($aAgent, $mixedParams = [])
    {
        $oAi = $this->getAi();
        if (!$oAi)
            return false;

        if ($mixedParams)
            $sParams = is_string($mixedParams) ? $mixedParams : json_encode($mixedParams);
        else
            $sParams = 'START';

        $sSampleField = $this->getSampleField();
        if ($sSampleField && empty($aAgent[$sSampleField])) {
            $oDb = new BxDolAiQuery();
            $oDb->updateAgentField($aAgent['id'], $sSampleField, $sParams);
        }

        $aParams = $this->getCallChatHistoryParams($aAgent, $mixedParams);
        $sParams = $this->limitCallInput($aAgent, $mixedParams, $sParams);

        $oLimits = BxDolAiChatLimits::getInstance();
        $oChat = BxDolAiChat::getInstance();
        if ($this->appliesChatLimits()) {
            if ($oLimits->isChatTurnLimitReached($aAgent, $oLimits->getChatUserTurnCount($aAgent['id'], $aParams))) {
                $oChat->emitConversationClosed('limit', '', $aAgent, $aParams);
                return $oLimits->getChatLimitMessage($aAgent);
            }

            if ($oLimits->isChatSessionRateLimited($aAgent, $aParams))
                throw new Exception($oLimits->getChatSessionRateLimitError());
        }

        $oChat->setChatContext($aAgent, $aParams);

        $mixed = '';
        try {
            $o = BxDolAi::getAgentInstance($aAgent['id'], $aParams);
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

    protected function getAi()
    {
        return BxDolAi::getInstance();
    }

    protected function getSampleField()
    {
        return '';
    }

    protected function usesSenderChatHistory()
    {
        return false;
    }

    protected function appliesChatLimits()
    {
        return false;
    }

    protected function getCallChatHistoryParams($aAgent, $mixedParams)
    {
        if (!$this->usesSenderChatHistory() || !is_array($mixedParams))
            return [];

        return ['chat_history_subindex' => (int)($mixedParams['sender_profile_id'] ?? 0)];
    }

    protected function limitCallInput($aAgent, $mixedParams, $sParams)
    {
        if (!$this->appliesChatLimits())
            return $sParams;

        $oLimits = BxDolAiChatLimits::getInstance();
        if (is_array($mixedParams) && isset($mixedParams['message_text'])) {
            $mixedParams['message_text'] = $oLimits->applyChatInputLimit((string)$mixedParams['message_text'], $aAgent);
            return json_encode($mixedParams);
        }

        if (is_string($mixedParams))
            return $oLimits->applyChatInputLimit($sParams, $aAgent);

        return $sParams;
    }

    protected function enqueue($aAgent, $mixedParams)
    {
        BxDolBackgroundJobs::getInstance()->add(bin2hex(random_bytes(16)), [
            'system', 'call_agent',
            [$this->getType(), $aAgent, $mixedParams],
            'TemplServices'
        ]);
    }

    protected function runOrEnqueue($aAgent, $mixedParams)
    {
        if (!empty($aAgent['async'])) {
            $this->enqueue($aAgent, $mixedParams);
            return null;
        }

        return $this->call($aAgent, $mixedParams);
    }
}

/** @} */

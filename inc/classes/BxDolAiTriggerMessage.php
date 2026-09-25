<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiTriggerMessage extends BxDolAiTrigger
{
    protected $_sType = 'message';

    /**
     * The agent's out-of-domain answer: not posted into the talk.
     */
    const NO_REPLY = 'NO_REPLY';

    protected function usesSenderChatHistory()
    {
        return true;
    }

    protected function appliesChatLimits()
    {
        return true;
    }

    /**
     * Messenger history is per talk (lot), not mixed with the sender's Studio chat.
     */
    protected function getCallChatHistoryParams($aAgent, $mixedParams)
    {
        $aParams = parent::getCallChatHistoryParams($aAgent, $mixedParams);

        $iLot = is_array($mixedParams) ? (int)($mixedParams['message_lot_id'] ?? 0) : 0;
        if ($iLot > 0)
            $aParams['chat_history_subindex'] = 'lot' . $iLot;

        return $aParams;
    }

    /**
     * limit_message is for chat widgets; in a talk the agent just goes quiet.
     */
    protected function getChatLimitReply($aAgent)
    {
        return null;
    }

    public function response($oAlert)
    {
        BxDolAiTrigger::getInstance($this->getType())->handle($oAlert);
    }

    public function handle($mixed = null)
    {
        $oAlert = $mixed;
        if (!$oAlert || 'bx_messenger' != $oAlert->sUnit || 'got_jot' != $oAlert->sAction)
            return false;

        $aJotInfo = isset($oAlert->aExtras['subobject_info']) && is_array($oAlert->aExtras['subobject_info'])
            ? $oAlert->aExtras['subobject_info']
            : [];

        return $this->processMessage(
            $oAlert->iSender,
            (int)($oAlert->aExtras['recipient_id'] ?? 0),
            (int)$oAlert->iObject,
            (int)($oAlert->aExtras['subobject_id'] ?? 0),
            $aJotInfo
        );
    }

    public function getAgentsByProfileId($iProfileId)
    {
        $oDb = new BxDolAiQuery();
        return $oDb->getAgentsByProfileId($iProfileId);
    }

    /**
     * Drains `$GLOBALS['glAgentsCallQueue']` once; jobs queued while a reply is
     * being posted (got_jot fires again) are picked up by the same loop, never re-run.
     */
    public function processCallQueue($bFinishRequest = true, $bExit = true)
    {
        if ($bFinishRequest) {
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            } else {
                @ob_end_flush();
                @flush();
            }
        }

        if (empty($GLOBALS['glAgentsCallQueueLock'])) {
            $GLOBALS['glAgentsCallQueueLock'] = true;
            try {
                while (!empty($GLOBALS['glAgentsCallQueue'])) {
                    $aBatch = $GLOBALS['glAgentsCallQueue'];
                    $GLOBALS['glAgentsCallQueue'] = [];
                    foreach ($aBatch as $r) {
                        $sType = $r['type'] ?? $this->getType();
                        $mixedReply = BxDolAiTrigger::getInstance($sType)->call($r['agent'], $r['params']);
                        if (!is_string($mixedReply) || $mixedReply === '')
                            continue;

                        $this->replyToMessage($r['agent'], $r['params'], $mixedReply);
                    }
                }
            } finally {
                $GLOBALS['glAgentsCallQueueLock'] = false;
            }
        }

        if ($bExit)
            exit(0);
    }

    /**
     * Post the agent's reply (markdown) into the talk the message came from.
     *
     * @param array $aParams the call params (`sender_profile_id`, `message_lot_id`, `message_id`)
     */
    public function replyToMessage($aAgent, $aParams, $sReply)
    {
        if (is_string($aParams))
            $aParams = json_decode($aParams, true) ?: [];
        if (!is_array($aParams))
            $aParams = [];

        $oParsedown = new Parsedown();
        $oParsedown->setSafeMode(true);
        $sHtml = $oParsedown->text((string)$sReply);

        return $this->sendMessengerMessage(
            (int)($aAgent['profile_id'] ?? 0),
            (int)($aParams['sender_profile_id'] ?? 0),
            str_replace('\n', '', $sHtml),
            (int)($aParams['message_lot_id'] ?? 0),
            (int)($aParams['message_id'] ?? 0)
        );
    }

    /**
     * @param int $iLotId talk to post into; 0 = a private talk with $iRecipient (resolved from $iJotId when given)
     * @param int $iJotId the message being answered — used to find the talk and to stop agent-on-agent loops
     */
    public function sendMessengerMessage($iSender, $iRecipient, $sMsg, $iLotId = 0, $iJotId = 0)
    {
        $oMessengerModule = BxDolModule::getInstance('bx_messenger');
        if (!$oMessengerModule)
            return false;

        $iSender = (int)$iSender;
        $iRecipient = (int)$iRecipient;
        $iLotId = (int)$iLotId;
        $iJotId = (int)$iJotId;

        $sPlain = trim(html_entity_decode(strip_tags((string)$sMsg), ENT_QUOTES, 'UTF-8'));
        if ($sPlain === '' || strcasecmp($sPlain, self::NO_REPLY) === 0)
            return false;

        if (!$iLotId && $iJotId) {
            $aJot = $oMessengerModule->_oDb->getJotById($iJotId);
            $iLotId = (int)($aJot['lot_id'] ?? 0);
        }

        // No talk and no recipient: sendMessage would open a stray talk with participant 0.
        if (!$iLotId && !$iRecipient)
            return false;

        $aAutoReplyData = [
            'message' => $sMsg,
        ];
        if ($iLotId)
            $aAutoReplyData['lot'] = $iLotId;
        else
            $aAutoReplyData['participants'] = [$iSender, $iRecipient];

        // Never pile agent jots on agent jots.
        if ($this->isAgentFlood($oMessengerModule, $iLotId, $iJotId))
            return false;

        $iSaveProfileId = $oMessengerModule->setProfileId($iSender);
        $a = $oMessengerModule->sendMessage($aAutoReplyData, $iLotId ? 0 : $iRecipient, $iSender);
        $oMessengerModule->setProfileId($iSaveProfileId);

        return $a;
    }

    protected function processMessage($iSender, $iRecipient, $iLotId, $iJotId, $aJotInfo)
    {
        $iSender = (int)$iSender;
        $iRecipient = (int)$iRecipient;
        $iLotId = (int)$iLotId;
        $iJotId = (int)$iJotId;

        if (!$iSender || !$iRecipient || $iSender == $iRecipient)
            return false;

        $oAi = $this->getAi();
        if (!$oAi)
            return false;

        // The alert may carry no jot info (or an empty one): read the jot.
        $oMessenger = BxDolModule::getInstance('bx_messenger');
        if ((empty($aJotInfo) || empty($aJotInfo['message'])) && $iJotId && $oMessenger)
            $aJotInfo = $oMessenger->_oDb->getJotById($iJotId) ?: $aJotInfo;
        if (!$iLotId && !empty($aJotInfo['lot_id']))
            $iLotId = (int)$aJotInfo['lot_id'];

        // Never answer an agent's own jot (the alert sender can be the human it replied to).
        $iJotAuthor = (int)($aJotInfo['user_id'] ?? 0);
        if ($oAi->isAgentProfile($iSender) || ($iJotAuthor && $oAi->isAgentProfile($iJotAuthor)))
            return false;

        $aAgents = $this->getAgentsByProfileId($iRecipient);
        if (!$aAgents)
            return false;

        $sText = trim((string)($aJotInfo['message'] ?? ''));
        if ($sText === '')
            return false;

        // got_jot fires once per participant and can nest: handle each jot+recipient once.
        $sQueueKey = $iLotId . ':' . $iJotId . ':' . $iRecipient;
        if (!isset($GLOBALS['glAgentsCallQueueKeys']))
            $GLOBALS['glAgentsCallQueueKeys'] = [];
        if (isset($GLOBALS['glAgentsCallQueueKeys'][$sQueueKey]))
            return false;
        $GLOBALS['glAgentsCallQueueKeys'][$sQueueKey] = true;

        if (!isset($GLOBALS['glAgentsCallQueue']) || !is_array($GLOBALS['glAgentsCallQueue']))
            $GLOBALS['glAgentsCallQueue'] = [];
        foreach ($aAgents as $a) {
            if (!$oAi->canInteract($a, $iSender))
                continue;
            if (!$a['message_profile_id'] || $iSender == $a['message_profile_id']) {
                $aParams = [
                    'trigger' => $this->getType(),
                    'sender_profile_id' => $iSender,
                    'recipient_profile_id' => $iRecipient,
                    'message_lot_id' => $iLotId,
                    'message_id' => $iJotId,
                    'message_text' => $sText,
                    'message_info' => $aJotInfo,
                ];
                if ($a['async']) {
                    $this->enqueue($a, $aParams);
                } else {
                    $GLOBALS['glAgentsCallQueue'][] = [
                        'type' => $this->getType(),
                        'agent' => $a,
                        'params' => $aParams,
                    ];
                }
            }
        }

        if (!empty($GLOBALS['glAgentsCallQueue'])) {
            ignore_user_abort(true);
            set_time_limit(0);

            // TODO: need a way to force messenger to show new message from the server side
            // register_shutdown_function(function () {
            //     bx_ai_process_agents_call_queue();
            // });
            $this->processCallQueue(false, false); // TODO: for a while do synchronically
        }

        return true;
    }

    /**
     * The jot being answered, or the last jot in the talk, was written by an agent.
     */
    protected function isAgentFlood($oMessengerModule, $iLotId, $iSourceJotId)
    {
        $oAi = $this->getAi();
        if (!$oAi)
            return false;

        $iLotId = (int)$iLotId;
        $iSourceJotId = (int)$iSourceJotId;
        if ($iSourceJotId) {
            $aSrc = $oMessengerModule->_oDb->getJotById($iSourceJotId);
            $iSrcAuthor = (int)($aSrc['user_id'] ?? 0);
            if ($iSrcAuthor && $oAi->isAgentProfile($iSrcAuthor))
                return true;
        }

        if (!$iLotId)
            return false;

        $CNF = &$oMessengerModule->_oConfig->CNF;
        $aLast = $oMessengerModule->_oDb->getRow("SELECT `{$CNF['FIELD_MESSAGE_AUTHOR']}` AS `user_id` FROM `{$CNF['TABLE_MESSAGES']}` WHERE `{$CNF['FIELD_MESSAGE_FK']}` = :lot AND `{$CNF['FIELD_MESSAGE_TRASH']}` = 0 ORDER BY `{$CNF['FIELD_MESSAGE_ID']}` DESC LIMIT 1", ['lot' => $iLotId]);
        $iLastAuthor = (int)($aLast['user_id'] ?? 0);
        return $iLastAuthor > 0 && $oAi->isAgentProfile($iLastAuthor);
    }
}

/** @} */

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

    protected function usesSenderChatHistory()
    {
        return true;
    }

    protected function appliesChatLimits()
    {
        return true;
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

        return $this->processMessage(
            $oAlert->iSender,
            $oAlert->aExtras['recipient_id'],
            $oAlert->iObject,
            $oAlert->aExtras['subobject_id'],
            $oAlert->aExtras['subobject_info']
        );
    }

    public function getAgentsByProfileId($iProfileId)
    {
        $oDb = new BxDolAiQuery();
        return $oDb->getAgentsByProfileId($iProfileId);
    }

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

        if (!empty($GLOBALS['glAgentsCallQueue'])) {
            foreach ($GLOBALS['glAgentsCallQueue'] as $r) {
                $sType = $r['type'] ?? $this->getType();
                $sMessage = BxDolAiTrigger::getInstance($sType)->call($r['agent'], $r['params']);
                if (null == $sMessage) {
                    // TODO: maybe reply with some empty message
                    continue;
                }
                $oParsedown = new Parsedown();
                $oParsedown->setSafeMode(true);
                $sMessageHtml = $oParsedown->text($sMessage);
                $this->sendMessengerMessage($r['agent']['profile_id'], $r['params']['sender_profile_id'], str_replace('\n', '', $sMessageHtml));
            }
        }

        if ($bExit)
            exit(0);
    }

    public function sendMessengerMessage($iSender, $iRecipient, $sMsg)
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

    protected function processMessage($iSender, $iRecipient, $iLotId, $iJotId, $aJotInfo)
    {
        if ($iSender == $iRecipient)
            return false;

        $oAi = $this->getAi();
        if (!$oAi)
            return false;

        $aAgents = $this->getAgentsByProfileId($iRecipient);
        if (!$aAgents)
            return false;

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
                    'message_text' => $aJotInfo['message'],
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
}

/** @} */

<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 *
 * @{
 */

class BxDolAiAlertResponse extends BxDolAlertsResponse
{
    public function response($oAlert)
    {        
        if ('bx_messenger' == $oAlert->sUnit && 'got_jot' == $oAlert->sAction) {
            $iProfileIdSender = $oAlert->iSender;
            $this->processMesssage ($oAlert->iSender, $oAlert->aExtras['recipient_id'], $oAlert->iObject, $oAlert->aExtras['subobject_id'], $oAlert->aExtras['subobject_info']);
        }
    }

    protected function processMesssage ($iSender, $iRecipient, $iLotId, $iJotId, $aJotInfo) 
    {
        if ($iSender == $iRecipient)
            return;

        // call agents
        $oAi = BxDolAI::getInstance();
        if($aAgents = $oAi->getAgentsByProfileId($iRecipient)) {
            $GLOBALS['glAgentsCallQueue'] = [];
            foreach($aAgents as $a) {
                if (!$oAi->canInteract($a, $iSender))
                    continue;
                if (!$a['message_profile_id'] || $iSender == $a['message_profile_id']) {

                    $aParams = [
                        'trigger' => 'message',
                        'sender_profile_id' => $iSender,
                        'recipient_profile_id' => $iRecipient,
                        'message_lot_id' => $iLotId, 
                        'message_id' => $iJotId,
                        'message_text' => $aJotInfo['message'],
                        'message_info' => $aJotInfo,
                    ];
                    if ($a['async']) {
                        BxDolBackgroundJobs::getInstance()->add(bin2hex(random_bytes(16)), [
                            'system', 'call_agent', 
                            ['message', $a, $aParams], 
                            'TemplServices'
                        ]);
                    }
                    else {
                        $GLOBALS['glAgentsCallQueue'][] = [
                            'type' => 'message',
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
                bx_ai_process_agents_call_queue(false, false); // TODO: for a while do synchronically
            }

        }
    }
}

/** @} */

<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiTriggerFormInput extends BxDolAiTrigger
{
    protected $_sType = 'form-input';

    protected function usesSenderChatHistory()
    {
        return true;
    }

    public function handle($mixed = null)
    {
        $iAgentId = (int)$mixed;
        $sJson = file_get_contents('php://input');
        $aData = json_decode($sJson, true);

        if (json_last_error() !== JSON_ERROR_NONE)
            return echoJson(['code' => 500, 'msg' => _t('_sys_agents_json_field_err')]);

        $sPrompt = $aData['prompt'] ?? null;
        $sInputName = $aData['input_name'] ?? null;
        $aValues = $aData['values'] ?? [];

        $aAgent = BxDolAiQuery::getAgentObject($iAgentId);
        if (!$aAgent || !$aAgent['active'] || $aAgent['trigger'] !== $this->getType())
            return echoJson(['code' => 404, 'msg' => _t('_sys_agents_agent_not_found')]);

        $oAi = $this->getAi();
        if (!$oAi || !$oAi->canInteract($aAgent))
            return echoJson(['code' => 403, 'msg' => _t('_sys_agents_unauthorized')]);

        $aParams = [
            'sender_profile_id' => bx_get_logged_profile_id(),
            'user_prompt' => $sPrompt,
            'form_field_name' => $sInputName,
            'form_values' => $aValues,
        ];

        return echoJson(['code' => 200, 'msg' => $this->call($aAgent, $aParams)]);
    }

    public function getAgentsForForm($sFormObject)
    {
        $oAi = $this->getAi();
        if (!$oAi)
            return [];

        $oDb = new BxDolAiQuery();
        $aAgents = $oDb->getAgentsByFormObject($sFormObject);
        if (!$aAgents || !is_array($aAgents))
            return [];

        return array_filter($aAgents, function ($a) use ($oAi) {
            return $oAi->canInteract($a);
        });
    }
}

/** @} */

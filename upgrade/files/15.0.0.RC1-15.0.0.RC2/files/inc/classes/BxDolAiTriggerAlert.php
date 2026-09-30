<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiTriggerAlert extends BxDolAiTrigger
{
    protected $_sType = 'alert';

    protected function usesSenderChatHistory()
    {
        return true;
    }

    /**
     * Sync: mutate alert extras from the model JSON. Async: background job.
     */
    public function handle($mixed = null)
    {
        $oAlert = $mixed;
        if (!$oAlert || !BxDolAi::getInstance())
            return false;

        $aAgents = $this->getAgentsByUnitAndAction($oAlert->sUnit, $oAlert->sAction);
        if (!$aAgents)
            return false;

        foreach ($aAgents as $a) {
            $aParams = [
                'trigger' => $this->getType(),
                'object_id' => $oAlert->iObject,
                'sender_profile_id' => $oAlert->iSender,
                'unit' => $oAlert->sUnit,
                'action' => $oAlert->sAction,
                'extra' => $oAlert->aExtras,
            ];

            if (!empty($a['async'])) {
                $this->enqueue($a, $aParams);
                continue;
            }

            $this->applyExtraMutation($oAlert, $this->call($a, $aParams));
        }

        return true;
    }

    public function getAgentsByUnitAndAction($sUnit, $sAction)
    {
        $aAgents = [];
        $oDb = new BxDolAiQuery();
        foreach ($oDb->getAgentsWithAlert() as $r) {
            $aAlert = explode(':', $r['alert']); // TODO: remake to concantenate $sUnit and $sAction and then compare
            if (count($aAlert) == 2 && $aAlert[0] == $sUnit && $aAlert[1] == $sAction)
                $aAgents[] = $r;
        }

        return $aAgents;
    }

    protected function applyExtraMutation($oAlert, $sExtraJSON)
    {
        $aExtra = [];
        if ($sExtraJSON && 0 === bx_mb_strpos($sExtraJSON, '{'))
            $aExtra = json_decode($sExtraJSON, true);

        if (!$aExtra || !is_array($aExtra))
            return;

        foreach ($aExtra as $k => $v) {
            if (isset($oAlert->aExtras[$k]))
                $oAlert->aExtras[$k] = $v;
        }
    }
}

/** @} */

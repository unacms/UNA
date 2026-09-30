<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiTriggerScheduler extends BxDolAiTrigger
{
    protected $_sType = 'scheduler';

    public function handle($mixed = null)
    {
        if (!BxDolAi::getInstance())
            return false;

        $aDate = is_array($mixed) ? $mixed : getdate(time());
        $aAgents = $this->getAgents();
        if (!$aAgents)
            return false;

        foreach ($aAgents as $aAgent) {
            if (function_exists('checkCronJob') && checkCronJob($aAgent['scheduler_cron'], $aDate))
                $this->call($aAgent);
        }

        return true;
    }

    public function getAgents()
    {
        $oDb = new BxDolAiQuery();
        return $oDb->getAgentsByTriggerType($this->getType());
    }
}

/** @} */

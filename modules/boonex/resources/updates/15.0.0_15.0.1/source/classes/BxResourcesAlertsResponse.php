<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

class BxResourcesAlertsResponse extends BxBaseModTextAlertsResponse
{
    public function __construct()
    {
        $this->MODULE = 'bx_resources';

        parent::__construct();
    }

    public function response($oAlert)
    {
        parent::response($oAlert);

        if(($sMethod = '_process' . bx_gen_method_name($oAlert->sUnit . '_' . $oAlert->sAction)) && method_exists($this, $sMethod))
            $this->$sMethod($oAlert);
    }

    protected function _processProfileSearchByTerm($oAlert)
    {
        $sName = $oAlert->aExtras['params']['name'] ?? '';

        if($sName == $this->MODULE . '_initial_members' && ($oContext = BxDolProfile::getInstance((int)$oAlert->aExtras['params']['context_pid'])) !== false) {
            $aIds = bx_srv($oContext->getModule(), 'fans', [$oContext->getContentId(), true]);

            $oAlert->aExtras['where'] .= " AND `p`.`id` IN (" . $this->_oModule->_oDb->implode_escape($aIds) . ")";
        }
    }
}

/** @} */

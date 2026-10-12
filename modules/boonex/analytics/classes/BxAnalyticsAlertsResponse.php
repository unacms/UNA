<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Analytics Analytics
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAnalyticsAlertsResponse extends BxDolAlertsResponse
{
    protected $_sModule;

    public function __construct()
    {
        parent::__construct();

        $this->_sModule = 'bx_analytics';
    }

    public function response($oAlert)
    {
        if($oAlert->sUnit == 'profile' && $oAlert->sAction == 'delete')
            BxDolModule::getInstance($this->_sModule)->onProfileDelete($oAlert->iObject);
    }
}

/** @} */

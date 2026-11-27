<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    CidaasConnect Cidaas Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxCidaasConAlerts extends BxBaseModConnectAlerts
{
    function __construct()
    {
        parent::__construct();
        $this -> oModule = BxDolModule::getInstance('bx_cidaascon');
    }

    public function response($o)
    {
        if ($o->sUnit == 'account' && $o->sAction == 'logout') {
            bx_srv('bx_cidaascon', 'logout');
        }
    }
}

/** @} */

<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    CASConnect CAS Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxCASAlerts extends BxBaseModConnectAlerts
{
    function __construct()
    {
        parent::__construct();
        $this -> oModule = BxDolModule::getInstance('bx_cas');
    }

    public function response($o)
    {
        if ($o->sUnit == 'account' && $o->sAction == 'logout') {
            bx_srv('bx_cas', 'logout');
        }
    }
}

/** @} */

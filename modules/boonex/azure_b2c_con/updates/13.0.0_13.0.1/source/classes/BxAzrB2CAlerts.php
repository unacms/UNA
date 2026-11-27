<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AzureB2CConnect Azure B2C Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAzrB2CAlerts extends BxBaseModConnectAlerts
{
    function __construct()
    {
        parent::__construct();
        $this -> oModule = BxDolModule::getInstance('bx_azrb2c');
    }
}

/** @} */

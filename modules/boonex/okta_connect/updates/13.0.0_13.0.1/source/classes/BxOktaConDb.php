<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OktaConnect Okta Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOktaConDb extends BxBaseModConnectDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }
}

/** @} */

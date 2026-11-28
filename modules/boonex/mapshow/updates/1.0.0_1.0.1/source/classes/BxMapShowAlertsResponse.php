<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MapShow Display last sign up users on map
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMapShowAlertsResponse extends BxDolAlertsResponse
{
    public function __construct()
    {
        parent::__construct();
    }
    
    public function response($oAlert)
    {
        if ($oAlert->sUnit == 'account' && $oAlert->sAction == 'added'){
            $oModule = BxDolModule::getInstance('bx_mapshow');
            $oModule->addIpInfoToDb($oAlert->iObject, getVisitorIP());
        }
    }
}
/** @} */
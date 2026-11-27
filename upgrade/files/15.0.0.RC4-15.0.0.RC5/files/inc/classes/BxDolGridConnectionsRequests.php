<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolGridConnectionsRequests extends BxDolGridConnections
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        
    }

    public function init($bForceInit = false)
    {
        $bResult = parent::init($bForceInit);
        if(!$bResult)
            return $bResult;

        $aSQLParts = $this->_oConnection->getConnectedInitiatorsAsSQLParts('p', 'id', $this->_oProfile->id(), $this->_bOwner ? 0 : true);

        $this->addMarkers(array(
            'join_connections' => $aSQLParts['join']
        ));

        return true;
    }

    public function getCode ($isDisplayHeader = true)
    {
        if(!isLogged())
            bx_require_authentication();

        if(!$this->_bOwner)
            return MsgBox(_t('_Access denied'));

        return parent::getCode($isDisplayHeader);
    }
}

/** @} */

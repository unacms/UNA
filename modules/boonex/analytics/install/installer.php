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

class BxAnalyticsInstaller extends BxBaseModTextInstaller
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    /**
     * Subscribe to the actions of the modules installed now; later ones are added when they
     * are enabled (the system/enable alert).
     */
    protected function _onEnableAfter()
    {
        $iResult = parent::_onEnableAfter();
        if($iResult == BX_DOL_STUDIO_INSTALLER_SUCCESS)
            BxDolService::call($this->_aConfig['name'], 'sync_actions');

        return $iResult;
    }
}

/** @} */

<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Classes Classes
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Entry forms helper functions
 */
class BxClssFormsEntryHelper extends BxBaseModTextFormsEntryHelper
{
    public function __construct($oModule)
    {
        parent::__construct($oModule);
    }

    protected function redirectAfterDelete($aContentInfo, $sUrl = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if ($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']] < 0 && ($oProfileContext = BxDolProfile::getInstance(abs($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]))) !== false)
            $sUrl = $oProfileContext->getUrl();

        return parent::redirectAfterDelete($aContentInfo, $sUrl);
    }
}

/** @} */

<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Entry forms helper functions
 */
class BxResourcesFormsEntryHelper extends BxBaseModTextFormsEntryHelper
{
    public function __construct($oModule)
    {
        parent::__construct($oModule);
    }

    protected function redirectAfterDelete($aContentInfo, $sUrl = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if((int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']] < 0)
            $sUrl = 'page.php?i=' . $CNF['URI_ENTRIES_BY_CONTEXT'] . '&profile_id=' . abs($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]);

        return parent::redirectAfterDelete($aContentInfo, $sUrl);
    }
}

/** @} */

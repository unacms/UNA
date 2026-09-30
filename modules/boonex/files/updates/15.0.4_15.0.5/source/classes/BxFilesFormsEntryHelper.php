<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Files Files
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Entry forms helper functions
 */
class BxFilesFormsEntryHelper extends BxBaseModFilesFormsEntryHelper
{
    public function __construct($oModule)
    {
        $this->_sDisplayForFormAdd ='bx_files_entry_upload';
        $this->_sObjectNameForFormAdd ='bx_files_upload';

        parent::__construct($oModule);
    }

    protected function redirectAfterDelete($aContentInfo, $sUrl = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (($oProfile = BxDolProfile::getInstance($aContentInfo[$CNF['FIELD_AUTHOR']])) !== false)
            $sUrl = 'page.php?i=' . $CNF['URI_AUTHOR_ENTRIES'] . '&profile_id=' . $oProfile->id();

        return parent::redirectAfterDelete($aContentInfo, $sUrl);
    }
}

/** @} */

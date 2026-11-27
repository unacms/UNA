<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

class BxStoriesAlertsResponse extends BxBaseModTextAlertsResponse
{
    public function __construct()
    {
        $this->MODULE = 'bx_stories';

        parent::__construct();
    }

    public function response($oAlert)
    {
        if ('bx_stories_files' == $oAlert->sUnit && 'file_deleted' == $oAlert->sAction)
            BxDolService::call($this->MODULE, 'delete_file_associations', array($oAlert->iObject));

        parent::response($oAlert);
    }

    protected function _onVideoTranscoded($iGhostId, $bResult, $aParams = array())
    {
        return parent::_onVideoTranscoded($iGhostId, $bResult, array('storage' => $this->_oModule->_oConfig->CNF['OBJECT_STORAGE']));
    }
}

/** @} */

<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Jobs Jobs
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Profile create/edit/delete pages.
 */
class BxJobsPageEntry extends BxBaseModGroupsPageEntry
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_jobs';

        parent::__construct($aObject, $oTemplate);
    }
    
    public function getCode ()
    {
        $sResult = parent::getCode();
        if(!empty($sResult))
            $sResult .= $this->_oModule->_oTemplate->getJsCode('entry');

        $this->_oModule->_oTemplate->addJs(['modules/base/groups/js/|entry.js', 'entry.js']);
        return $sResult;
    }
}

/** @} */

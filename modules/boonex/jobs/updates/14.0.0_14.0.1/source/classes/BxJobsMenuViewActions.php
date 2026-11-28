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
 * 'View group' actions menu.
 */
class BxJobsMenuViewActions extends BxBaseModGroupsMenuViewActions
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_jobs';

        parent::__construct($aObject, $oTemplate);

        $this->addMarkers([
            'js_object_entry' => $this->_oModule->_oConfig->getJsObject('entry')
        ]);
    }
}

/** @} */

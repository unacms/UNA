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
 * Browse entries pages.
 */
class BxJobsPageBrowse extends BxBaseModGroupsPageBrowse
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_jobs';
        parent::__construct($aObject, $oTemplate);
    }
}

/** @} */

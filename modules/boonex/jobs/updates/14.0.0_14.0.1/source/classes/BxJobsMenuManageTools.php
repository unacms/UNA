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
 * 'Jobs manage tools' menu.
 */
class BxJobsMenuManageTools extends BxBaseModGroupsMenuManageTools
{

    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_jobs';
        parent::__construct($aObject, $oTemplate);
    }
}

/** @} */

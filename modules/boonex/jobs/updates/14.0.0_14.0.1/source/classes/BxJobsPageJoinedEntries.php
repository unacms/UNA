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
 * Entries user joined to.
 */
class BxJobsPageJoinedEntries extends BxBaseModGroupsPageJoinedEntries
{
    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);
    }

}

/** @} */

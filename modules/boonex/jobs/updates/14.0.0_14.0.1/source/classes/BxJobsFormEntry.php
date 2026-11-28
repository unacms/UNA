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

class BxJobsFormEntryCheckerHelper extends BxDolFormCheckerHelper
{
    static public function checkDateTimeEmptyOrValid ($s)
    {
        return empty($s) || (self::checkDateTime($s) && strtotime($s) > time());
    }
}

/**
 * Create/Edit Group Form.
 */
class BxJobsFormEntry extends BxBaseModGroupsFormEntry
{
    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_jobs';
        parent::__construct($aInfo, $oTemplate);
    }
}

/** @} */

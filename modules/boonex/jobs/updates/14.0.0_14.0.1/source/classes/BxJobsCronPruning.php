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

class BxJobsCronPruning extends BxBaseModGroupsCronPruning
{
    public function __construct()
    {
        $this->_sModule = 'bx_jobs';

        parent::__construct();
    }
}

/** @} */

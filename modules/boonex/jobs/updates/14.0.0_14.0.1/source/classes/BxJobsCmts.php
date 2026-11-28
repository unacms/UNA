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

class BxJobsCmts extends BxBaseModGroupsCmts
{
    function __construct($sSystem, $iId, $iInit = 1)
    {
    	$this->_sModule = 'bx_jobs';

        parent::__construct($sSystem, $iId, $iInit);
    }
}

/** @} */

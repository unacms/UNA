<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Workspaces Workspaces
 * @ingroup     UnaModules
 *
 * @{
 */

class BxWorkspacesCmts extends BxBaseModProfileCmts
{
    function __construct($sSystem, $iId, $iInit = 1)
    {
    	$this->_sModule = 'bx_workspaces';

        parent::__construct($sSystem, $iId, $iInit);
    }
}

/** @} */

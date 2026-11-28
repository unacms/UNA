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

class BxWorkspacesPrivacyPost extends BxBaseModProfilePrivacyPost
{
    function __construct($aOptions, $oTemplate = false)
    {
    	$this->_sModule = 'bx_workspaces';

        parent::__construct($aOptions, $oTemplate);
    }
}

/** @} */

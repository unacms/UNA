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

/**
 * 'View workspace' menu.
 */
class BxWorkspacesMenuViewActions extends BxBaseModProfileMenuViewActions
{

    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_workspaces';
        parent::__construct($aObject, $oTemplate);
    }
}

/** @} */

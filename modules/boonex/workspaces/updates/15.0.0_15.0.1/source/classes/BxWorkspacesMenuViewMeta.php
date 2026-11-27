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
 * View entry meta menu
 */
class BxWorkspacesMenuViewMeta extends BxBaseModProfileMenuViewMeta
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_workspaces';

        parent::__construct($aObject, $oTemplate);
    }
}

/** @} */

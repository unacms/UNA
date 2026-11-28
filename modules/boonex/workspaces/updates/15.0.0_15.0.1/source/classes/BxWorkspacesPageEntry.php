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
 * Profile create/edit/delete pages.
 */
class BxWorkspacesPageEntry extends BxBaseModProfilePageEntry
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_workspaces';
        parent::__construct($aObject, $oTemplate);
    }
}

/** @} */

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
 * Create/Edit Workspace Form.
 */
class BxWorkspacesFormEntry extends BxBaseModProfileFormEntry
{
    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_workspaces';
        parent::__construct($aInfo, $oTemplate);
    }
}

/** @} */

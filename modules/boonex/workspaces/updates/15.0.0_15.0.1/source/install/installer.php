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

class BxWorkspacesInstaller extends BxBaseModProfileInstaller
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    function enable($aParams)
    {
        $aResult = parent::enable($aParams);

        if($aResult['result'] && getParam($this->_sParamRelations) == '')
            setParam($this->_sParamRelations, $this->_aConfig['name'] . '_' . $this->_aConfig['name']);

        return $aResult;
    }
}

/** @} */

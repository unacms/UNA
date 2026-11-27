<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Payment Payment
 * @ingroup     UnaModules
 *
 * @{
 */

class BxGitHubFormApps extends BxTemplFormView
{
    protected $_sModule;
    protected $_oModule;

    function __construct($aInfo, $oTemplate = false)
    {
        parent::__construct($aInfo, $oTemplate);

        $this->_sModule = 'bx_github';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
    }
}

/** @} */

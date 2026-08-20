<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Snipcart Snipcart
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Edit settings form
 */
class BxSnipcartFormSettings extends BxTemplFormView
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->_sModule = 'bx_snipcart';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aInfo, $oTemplate);

        if(($sF = 'api_key_test') && isset($this->aInputs[$sF]))
            $this->aInputs[$sF]['secret'] = 1;

        if(($sF = 'api_key_live') && isset($this->aInputs[$sF]))
            $this->aInputs[$sF]['secret'] = 1;
    }
}

/** @} */

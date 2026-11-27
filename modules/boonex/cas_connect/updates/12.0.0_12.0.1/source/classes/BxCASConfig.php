<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    CASConnect CAS Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxCASConfig extends BxBaseModConnectConfig
{
    public $sPageStart;
    public $sPageHandle;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this -> sEmailTemplatePasswordGenerated = 'bx_cas_password_generated';
        $this -> sDefaultTitleLangKey = '_bx_cas';

        $this -> sRedirectPage = getParam('bx_cas_redirect_page');
        $this -> sProfilesModule = getParam('bx_cas_module');
        $this -> isAlwaysConfirmEmail = (bool)getParam('bx_cas_confirm_email'); 
        $this -> isAlwaysAutoApprove = (bool)getParam('bx_cas_approve');

        $this -> sPageStart = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'start';
        $this -> sPageHandle = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'handle';
    }
}

/** @} */

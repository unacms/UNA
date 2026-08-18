<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    CidaasConnect Cidaas Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxCidaasConConfig extends BxBaseModConnectConfig
{
    public $sTenantID = 'common';
    public $sClientID;
    public $sSecret;

    public $sAuthMethod = 'secret'; // certificate isn't supported yet
    public $sScope = 'User.Read';// 'openid%20offline_access%20profile%20user.read';
    public $sLogoutUrl = 'https://login.microsoftonline.com/common/wsfederation?wa=wsignout1.0';

    public $sPageStart;
    public $sPageHandle;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this -> sTenantID = getParam('bx_cidaascon_tenant_id');
        $this -> sClientID = getParam('bx_cidaascon_client_id');
        $this -> sSecret = getParam('bx_cidaascon_secret');

        $this -> sEmailTemplatePasswordGenerated = 'bx_cidaascon_password_generated';
        $this -> sDefaultTitleLangKey = '_bx_cidaascon';

        $this -> sRedirectPage = getParam('bx_cidaascon_redirect_page');
        $this -> sProfilesModule = getParam('bx_cidaascon_module');
        $this -> isAlwaysConfirmEmail = (bool)getParam('bx_cidaascon_confirm_email'); 
        $this -> isAlwaysAutoApprove = (bool)getParam('bx_cidaascon_approve');

        $this -> sPageStart = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'start';
        $this -> sPageHandle = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'handle';
    }
}

/** @} */

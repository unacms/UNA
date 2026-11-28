<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AzureConnect Azure Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAzrConConfig extends BxBaseModConnectConfig
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

        $this -> sTenantID = getParam('bx_azrcon_tenant_id');
        $this -> sClientID = getParam('bx_azrcon_client_id');
        $this -> sSecret = getParam('bx_azrcon_secret');

        $this -> sEmailTemplatePasswordGenerated = 'bx_azrcon_password_generated';
        $this -> sDefaultTitleLangKey = '_bx_azrcon';

        $this -> sRedirectPage = getParam('bx_azrcon_redirect_page');
        $this -> sProfilesModule = getParam('bx_azrcon_module');
        $this -> isAlwaysConfirmEmail = (bool)getParam('bx_azrcon_confirm_email'); 
        $this -> isAlwaysAutoApprove = (bool)getParam('bx_azrcon_approve');

        $this -> sPageStart = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'start';
        $this -> sPageHandle = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'handle';
    }
}

/** @} */

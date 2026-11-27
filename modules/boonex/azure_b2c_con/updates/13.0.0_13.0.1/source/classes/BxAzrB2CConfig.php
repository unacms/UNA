<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AzureB2CConnect Azure B2C Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAzrB2CConfig extends BxBaseModConnectConfig
{
    public $sDomain;
    public $sTenant;
    public $sPolicy;

    public $sTenantID = 'common';
    public $sClientID;
    public $sSecret;

    public $sScope = 'openid';// 'openid offline_acces https://graph.microsoft.com/User.Read';
    public $sLogoutUrl = 'https://login.microsoftonline.com/common/wsfederation?wa=wsignout1.0';

    public $sPageStart;
    public $sPageHandle;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this -> sDomain = getParam('bx_azrb2c_domain');
        $this -> sTenant = getParam('bx_azrb2c_tenant');
        $this -> sPolicy = getParam('bx_azrb2c_policy');

        $this -> sTenantID = getParam('bx_azrb2c_tenant_id');
        $this -> sClientID = getParam('bx_azrb2c_client_id');
        $this -> sScope = getParam('bx_azrb2c_client_id');
        $this -> sSecret = getParam('bx_azrb2c_secret');

        $this -> sEmailTemplatePasswordGenerated = 'bx_azrb2c_password_generated';
        $this -> sDefaultTitleLangKey = '_bx_azrb2c';

        $this -> sRedirectPage = getParam('bx_azrb2c_redirect_page');
        $this -> sProfilesModule = getParam('bx_azrb2c_module');
        $this -> isAlwaysConfirmEmail = (bool)getParam('bx_azrb2c_confirm_email'); 
        $this -> isAlwaysAutoApprove = (bool)getParam('bx_azrb2c_approve');
        $this -> bSendPasswordGenerated = false;

        $this -> sPageStart = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'start';
        $this -> sPageHandle = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'handle';
    }
}

/** @} */

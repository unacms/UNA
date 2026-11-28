<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OktaConnect Okta Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOktaConConfig extends BxBaseModConnectConfig
{
    public $sDomain;
    public $sClientID;
    public $sSecret;
    public $sScope = 'openid profile email'; // 'okta.users.read'; 

    public $sPageStart;
    public $sPageHandle;

    public $bAddExtensionsForDuplicateEmails = true;
    public $bGetUserInfoFromIdToken = true;
    public $sUserIdField = 'identityId';

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this -> bSendPasswordGenerated = false;

        $this -> sDomain = getParam('bx_oktacon_domain');
        $this -> sClientID = getParam('bx_oktacon_client_id');
        $this -> sSecret = getParam('bx_oktacon_secret');
        $this -> sScope = getParam('bx_oktacon_scope');

        $this -> sEmailTemplatePasswordGenerated = 'bx_oktacon_password_generated';
        $this -> sDefaultTitleLangKey = '_bx_oktacon';

        $this -> sRedirectPage = getParam('bx_oktacon_redirect_page');
        $this -> sProfilesModule = getParam('bx_oktacon_module');
        $this -> isAlwaysConfirmEmail = (bool)getParam('bx_oktacon_confirm_email'); 
        $this -> isAlwaysAutoApprove = (bool)getParam('bx_oktacon_approve');

        $this -> sPageStart = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'start';
        $this -> sPageHandle = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'handle';

        bx_import('Custom', $aModule);
        $oCustom = new BxOktaConCustom($aModule);
        $oCustom->onConfig($this);
    }
}

/** @} */

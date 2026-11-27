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
    public $sBaseUrl;
    public $sClientID;
    public $sSecret;
    public $sScope = 'openid profile email offline_access';
    public $bPkce = false;
    public $bDebug = false;

    public $sPageStart;
    public $sPageHandle;

    public $sSessionCodeVerifier;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->sBaseUrl = rtrim(getParam('bx_cidaascon_base_url'), '/');
        $this->sClientID = getParam('bx_cidaascon_client_id');
        $this->sSecret = getParam('bx_cidaascon_secret');
        $this->sScope = getParam('bx_cidaascon_scope') ? getParam('bx_cidaascon_scope') : $this->sScope;
        $this->bPkce = (bool)getParam('bx_cidaascon_pkce');
        $this->bDebug = (bool)getParam('bx_cidaascon_debug');

        $this->sSessionUid = 'cidaascon_session';
        $this->sSessionProfile = 'cidaascon_session_profile';
        $this->sSessionCodeVerifier = 'cidaascon_code_verifier';

        $this->sEmailTemplatePasswordGenerated = 'bx_cidaascon_password_generated';
        $this->sDefaultTitleLangKey = '_bx_cidaascon';

        $this->sRedirectPage = getParam('bx_cidaascon_redirect_page');
        $this->sProfilesModule = getParam('bx_cidaascon_module');
        $this->isAlwaysConfirmEmail = (bool)getParam('bx_cidaascon_confirm_email');
        $this->isAlwaysAutoApprove = (bool)getParam('bx_cidaascon_approve');

        $this->sPageStart = BX_DOL_URL_ROOT . $this->getBaseUri() . 'start';
        $this->sPageHandle = BX_DOL_URL_ROOT . $this->getBaseUri() . 'handle';
    }
}

/** @} */

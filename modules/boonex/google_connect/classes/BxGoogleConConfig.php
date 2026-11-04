<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    GoogleConnect Google Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxGoogleConConfig extends BxBaseModConnectConfig
{
    public $sApiID;
    public $sApiSecret;
    public $sApiUrl = 'https://www.googleapis.com';
    public $sOauthUrl = 'https://accounts.google.com/o/oauth2/v2';

    /**
     * Endpoints which are used to verify an access token received by a client (NEO app) and to get the profile.
     */
    public $sTokenInfoUrl = 'https://oauth2.googleapis.com/tokeninfo';
    public $sUserInfoUrl = 'https://openidconnect.googleapis.com/v1/userinfo';

    /**
     * Client IDs an access token may be issued to (web client of this module + clients of other apps).
     */
    public $aClientIds = [];

    public $sFields = 'id,firstName,lastName,picture-url,email-address';

    public $sPageStart;
    public $sPageHandle;

    public $sScope = 'email profile';

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this -> sApiID = getParam('bx_googlecon_api_key');
        $this -> sApiSecret = getParam('bx_googlecon_secret');

        $aClientIds = [$this -> sApiID];
        if(($sClientIds = getParam('bx_googlecon_client_ids')) && is_string($sClientIds))
            $aClientIds = array_merge($aClientIds, preg_split('/[\s,;]+/', $sClientIds, -1, PREG_SPLIT_NO_EMPTY));
        $this -> aClientIds = array_values(array_unique(array_filter(array_map('trim', $aClientIds))));

        $this -> sSessionUid = 'googlecon_session';
        $this -> sSessionProfile = 'googlecon_session_profile';

        $this -> sEmailTemplatePasswordGenerated = 'bx_googlecon_password_generated';
        $this -> sDefaultTitleLangKey = '_bx_googlecon';

        $this -> sRedirectPage = getParam('bx_googlecon_redirect_page');
        $this -> sProfilesModule = getParam('bx_googlecon_module');
        $this -> isAlwaysConfirmEmail = (bool)getParam('bx_googlecon_confirm_email'); 
        $this -> isAlwaysAutoApprove = (bool)getParam('bx_googlecon_approve');

        $this -> sPageStart = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'start';
        $this -> sPageHandle = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'handle';
    }
}

/** @} */

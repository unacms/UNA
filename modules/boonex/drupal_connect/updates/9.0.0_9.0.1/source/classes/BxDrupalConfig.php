<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    DrupalConnect Drupal Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxDrupalConfig extends BxBaseModConnectConfig
{
    public $sApiID;
    public $sApiSecret;
    public $sApiUrl = 'https://api.linkedin.com/v1';
    public $sOauthUrl = 'https://www.linkedin.com/oauth/v2';

    public $sFields = 'id,firstName,lastName,picture-url,email-address';

    public $sPageStart;
    public $sPageHandle;

    public $sScope = 'r_basicprofile r_emailaddress';

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this -> sApiID = getParam('bx_drupal_api_key');
        $this -> sApiSecret = getParam('bx_drupal_secret');

        $this -> sSessionUid = 'linkedin_session';
        $this -> sSessionProfile = 'linkedin_session_profile';

        $this -> sEmailTemplatePasswordGenerated = 'bx_drupal_password_generated';
        $this -> sDefaultTitleLangKey = '_bx_drupal';

        $this -> sRedirectPage = getParam('bx_drupal_redirect_page');
        $this -> sProfilesModule = getParam('bx_drupal_module');
        $this -> isAlwaysConfirmEmail = (bool)getParam('bx_drupal_confirm_email'); 
        $this -> isAlwaysAutoApprove = (bool)getParam('bx_drupal_approve');

        $this -> sPageStart = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'start';
        $this -> sPageHandle = BX_DOL_URL_ROOT . $this -> getBaseUri() . 'handle';
    }
}

/** @} */

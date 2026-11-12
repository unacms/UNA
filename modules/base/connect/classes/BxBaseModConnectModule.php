<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseConnect Base classes for OAuth connect modules
 * @ingroup     UnaModules
 *
 * @{
 */

class BxBaseModConnectModule extends BxBaseModGeneralModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function serviceGetSafeServices()
    {
        return array();
    }

    public function serviceGetProfilesModules ()
    {
        $aModules = array();
        $a = BxDolService::call('system', 'get_profiles_modules', array(), 'TemplServiceProfiles');
        foreach ($a as &$aModule)
            $aModules[$aModule['name']] = $aModule['title'];
        return $aModules;
    }

    public function serviceGetPrivacyGroups ()
    {
        $oPrivacyQuery = new BxDolPrivacyQuery();
        $a = $oPrivacyQuery->getGroupsBy(array('type' => 'active'));
        $aGroups = array();
        foreach ($a as $r) {
            if (!(int)$r['active'])
               continue;
            $aGroups[$r['id']] = _t($r['title']);
        }
        return $aGroups;
    }
    
    /**
     * Logged profile
     *
     * @param $iProfileId integer
     * @param $sPassword string
     * @param $sCallbackUrl
     * @param $bRedirect boolean
     * @return void
     */
    function setLogged($iProfileId, $sCallbackUrl = '', $bRedirect = true, $bRememberMe = false)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
 
        bx_login($oProfile->getAccountId(), $bRememberMe);

        if ($bRedirect) {
            //set redirect from the session if it was added
            $oSession = BxDolSession::getInstance();
            $sSessionKey = $this->_oConfig->getName() . '_relocate';
            if ($oSession->isValue($sSessionKey))
                $sCallbackUrl = $sCallbackUrl ? $sCallbackUrl : $oSession->getValue($sSessionKey);

            $sCallbackUrl = $sCallbackUrl ? $sCallbackUrl : $this -> _oConfig -> sDefaultRedirectUrl;
            
            if($this->_bIsApi)
                return [bx_api_get_block('redirect', ['uri' => bx_api_get_relative_url($sCallbackUrl)])];

            header('Location: ' . $sCallbackUrl);

            /*
            // another way to redirect with "Please wait" message
            BxDolTemplate::getInstance()->setPageNameIndex (BX_PAGE_TRANSITION);
            BxDolTemplate::getInstance()->setPageHeader (_t('_Please Wait'));
            BxDolTemplate::getInstance()->setPageContent ('page_main_code', BxDolTemplate::getInstance()->parseHtmlByName('transition_wait.html', ['text' => _t('_Please Wait')]));
            BxDolTemplate::getInstance()->setPageContent ('url_relocate', bx_html_attribute($sCallbackUrl, BX_ESCAPE_STR_QUOTE));

            BxDolTemplate::getInstance()->getPageCode();
            */
            exit;
        }
    }

    /**
     * Create new profile;
     *
     * @param  : $aProfileInfo (array) - remote profile's information;
     *
     * @param  : $sAlternativeName (string) - profiles alternative nickname;
     */
    function _createProfile($aProfileInfo, $sAlternativeName = '')
    {
        $mixed = $this->_createProfileRaw($aProfileInfo, $sAlternativeName);

        /**
         * @hooks
         * @hookdef hook-bx_base_connect-profile_created '{module_name}', 'profile_created' - hook after a profile was created 
         * - $unit_name - module name
         * - $action - equals `profile_created`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [string] or [array] by ref, result of profile creation, can be overridden in hook processing. If `string` then show error, if `array` with `join_page_redirect` key then show Create Account page, if `array` with `profile_id` key then redirect to profile page
         *      - `remote_profile_info` - [array] array with remote profile info
         * @hook @ref hook-bx_base_connect-profile_created
         */
        bx_alert($this->getName(), 'profile_created', 0, 0, [
            'override_result' => &$mixed, 
            'remote_profile_info' => $aProfileInfo
        ]);
        
        // display error
        if (is_string($mixed)) {
            if($this->_bIsApi)
                return [bx_api_get_msg($mixed)];

            $this->_oTemplate->getPage(_t($this->_oConfig->sDefaultTitleLangKey), DesignBoxContent(_t($this->_oConfig->sDefaultTitleLangKey), MsgBox($mixed)));
            exit;
        } 

        // display join page
        if (is_array($mixed) && isset($mixed['join_page_redirect'])) {
            if($this->_bIsApi)
                return []; //--- Isn't currently supported for API.
            
            $this->_getJoinPage($mixed['profile_fields'], $mixed['remote_profile_info']['id']);
            exit;
        } 

        // continue profile creation
        if (is_array($mixed) && isset($mixed['profile_id'])) {
            $iProfileId = (int)$mixed['profile_id'];

            $sRedirectUrl = $this->_getRedirectUrl($iProfileId, $mixed['existing_profile']);
            if($this->_bIsApi)
                return [bx_api_get_block('redirect', ['uri' => bx_api_get_relative_url($sRedirectUrl)])];

            //redirect to other page
            header('location:' . $sRedirectUrl);
            exit;
        }

        if($this->_bIsApi)
            return [bx_api_get_msg(_t('_Error Occured'))];

        $this->_oTemplate->getPage( _t($this->_oConfig->sDefaultTitleLangKey), MsgBox(_t('_Error Occured')) );
        exit;
    }

    /**
     * @param $aProfileInfo - remote profile info
     * @param $sAlternativeName - suffix to add to NickName to make it unique
     * @return profile array info, ready for the local database
     */
    protected function _convertRemoteFields($aProfileInfo, $sAlternativeName = '')
    {
    }

    /**
     * Create new profile;
     *
     * @param  : $aProfileInfo (array) - remote profile's information;
     *
     * @param  : $sAlternativeName (string) - profiles alternative nickname;
     * @return : error string or error or request invite form or profile info array on success
     */
    function _createProfileRaw($aProfileInfo, $sAlternativeName = '', $isAutoFriends = true, $isSetLoggedIn = true)
    {
        // join by invite only
        if (BxDolRequest::serviceExists('bx_invites', 'account_add_form_check') && $sCode = BxDolService::call('bx_invites', 'account_add_form_check'))
            return $sCode;

        // convert fields to unique format
        $aFieldsProfile = $aFieldsAccount = $this->_convertRemoteFields($aProfileInfo, $sAlternativeName);

        /**
         * @hooks
         * @hookdef hook-bx_base_connect-fields_converted '{module_name}', 'fields_converted' - hook before a profile is created, which allows to modify account and/or profile fields before creation
         * - $unit_name - module name
         * - $action - equals `fields_converted`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_profile_fields` - [array] by ref, profile fields, can be overridden in hook processing
         *      - `override_account_fields` - [array] by ref, account fields, can be overridden in hook processing
         *      - `remote_profile_info` - [array] array with remote profile info
         * @hook @ref hook-bx_base_connect-fields_converted
         */
        bx_alert($this->getName(), 'fields_converted', 0, 0, [
            'override_profile_fields' => &$aFieldsProfile, 
            'override_account_fields' => &$aFieldsAccount, 
            'remote_profile_info' => $aProfileInfo
        ]);

        if (empty($aFieldsProfile['email']))
            return _t('_Incorrect Email');

        // prepare fields for particular module
        $aFieldsAccount = BxDolService::call('system', 'prepare_fields', array($aFieldsAccount));
        $aFieldsProfile = BxDolService::call($this->_oConfig->sProfilesModule, 'prepare_fields', array($aFieldsProfile));

        // check fields existence in Account
        $oFormHelperAccount = BxDolService::call('system', 'forms_helper');
        $oFormAccount = $oFormHelperAccount->getObjectFormAdd();
        foreach ($aFieldsAccount as $sKey => $mValue) {
            if (!$oFormAccount->isFieldExist($sKey))
                unset($aFieldsAccount[$sKey]);
        }

        // check fields existence in Profile
        if ('system' != $this->_oConfig->sProfilesModule && $oFormHelperProfile = BxDolService::call($this->_oConfig->sProfilesModule, 'forms_helper')) {
            $oFormProfile = $oFormHelperProfile->getObjectFormEdit();
            foreach ($aFieldsProfile as $sKey => $mValue) {
                if (!$oFormProfile->isFieldExist($sKey))
                    unset($aFieldsProfile[$sKey]);
            }
        }

        // antispam check
        $sErrorMsg = '';
        $bSetPendingApproval = false;
        
        /**
         * @hooks
         * @hookdef hook-account-check_join 'account', 'check_join' - hook to check email address for spam
         * - $unit_name - equals `account`
         * - $action - equals `check_join`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `error_msg` - [string] by ref, error message, can be overridden in hook processing
         *      - `email` - [string] email address to check
         *      - `approve` - [boolean] by ref, pending approval status for created profile, can be overridden in hook processing
         * @hook @ref hook-account-check_join
         */
        bx_alert('account', 'check_join', 0, false, [
            'error_msg' => &$sErrorMsg, 
            'error_msg_ref' => &$sErrorMsg, 
            'email' => $aFieldsAccount['email'], 
            'approve' => &$bSetPendingApproval,
            'approve_ref' => &$bSetPendingApproval
        ]);
        if ($sErrorMsg)
            return $sErrorMsg;

        // check if user with the same email already exists
        $oExistingAccount = $this->_getExistingAccount($aProfileInfo, $aFieldsAccount, $aFieldsProfile);

        // never log in to an existing account by an email which wasn't verified by the remote site
        if ($oExistingAccount && !$this->_isRemoteEmailVerified($aProfileInfo))
            return _t('_sys_txt_error_account_creation');

        // check redirect page
        if ('join' == $this->_oConfig->sRedirectPage && !$oExistingAccount)
            return array('remote_profile_info' => $aProfileInfo, 'profile_fields' => $aFieldsAccount, 'join_page_redirect' => true);

        // create new profile
        if ($oExistingAccount) {

            if (!($oExistingProfile = BxDolProfile::getInstanceByAccount($oExistingAccount->id(), true)))
                return _t('_sys_txt_error_account_creation');

            $iProfileId = $oExistingProfile->id();

            $this->setLogged($iProfileId);
        }
        else {

            // create account
            $aFieldsAccount['password'] = $this->_genPwd($aProfileInfo, $aFieldsAccount, $aFieldsProfile);
            if (!($iAccountId = $oFormAccount->insert($aFieldsAccount)))
                return _t('_sys_txt_error_account_creation');

            $isSetPendingApproval = $this->_isSetPendingApprovalAccount($aProfileInfo, $aFieldsAccount, $aFieldsProfile);
            $iAccountProfileId = $oFormHelperAccount->onAccountCreated ($iAccountId, $isSetPendingApproval, BX_PROFILE_ACTION_EXTERNAL);

            // create profile
            if (isset($oFormProfile) && $oFormProfile) {
                
                $aFieldsProfile['author'] = $iAccountProfileId;

                $aFieldsProfile['picture'] = $this->_processImage($aFieldsProfile, $iAccountProfileId, $oFormHelperProfile);
                $_POST['picture'] = $aFieldsProfile['picture']; // set POST variable to correctly process images in processFiles method in form object

                if (!($iContentId = $oFormProfile->insert($aFieldsProfile)))
                    return _t('_sys_txt_error_account_creation');

                $isSetPendingApprovalProfile = $this->_isSetPendingApprovalProfile($aProfileInfo, $oFormHelperProfile, $aFieldsAccount, $aFieldsProfile);
                $oFormHelperProfile->setAutoApproval($isSetPendingApprovalProfile);
                if ($sErrorMsg = $oFormHelperProfile->onDataAddAfter ($iAccountId, $iContentId))
                    return $sErrorMsg;
                
                $oProfile = BxDolProfile::getInstanceByAccount($iAccountId, true);
                $iProfileId = $oProfile->id();
            } 
            else {
                $iProfileId = $iAccountProfileId;
            }

            $oAccount = BxDolAccount::getInstance($iAccountId);
            if ($oAccount)
                $oAccount->updateEmailConfirmed($this->_oConfig->isAlwaysConfirmEmail);

            // send email with password
            if ($this->_oConfig->bSendPasswordGenerated)
                sendMailTemplate($this->_oConfig->sEmailTemplatePasswordGenerated, $iAccountId, $iProfileId, array('password' => $aFieldsAccount['password']), BX_EMAIL_SYSTEM);
        }

        // remember remote profile id for created member
        $this ->_oDb->saveRemoteId($iProfileId, $aProfileInfo['id']);

        // auto-friend members if they are already friends on remote site
        if ($isAutoFriends && method_exists($this, '_makeFriends'))
            $this->_makeFriends($iProfileId);

        return array('remote_profile_info' => $aProfileInfo, 'profile_id' => $iProfileId, 'existing_profile' => $oExistingAccount ? true : false);
    }

    protected function _processImage($aFieldsProfile, $iAccountProfileId, $oFormHelperProfile)
    {
        if (!isset($aFieldsProfile['picture']) || !$aFieldsProfile['picture'])
            return 0;

        if (!($oStorage = $oFormHelperProfile->getObjectStorage()))
            return 0;
        
        if (!($iFileId = $oStorage->storeFileFromUrl($aFieldsProfile['picture'], false, $iAccountProfileId)))
            return 0;

        return $iFileId;
    }

     /**
      * Get join page
      *
      * @param $aProfileFields array
      * @param $iRemoteProfileId remote profile id
      * @return void
      */
    function _getJoinPage($aProfileFields, $iRemoteProfileId)
    {
        bx_import('BxDolSession');
        $oSession = BxDolSession::getInstance();
        $oSession->setValue($this->_oConfig->sSessionUid, $iRemoteProfileId);

        $oPage = BxDolPage::getObjectInstanceByURI('create-account');

        BxBaseAccountForms::$PROFILE_FIELDS = $aProfileFields;

        $this->_oTemplate->getPage(false, $oPage->getCode());
    }

    /**
     * get redirect URL
     * 
     * @param $iProfileId integer - profile ID
     * @return string redirect URL
     */
    function _getRedirectUrl($iProfileId, $isExistingProfile = false)
    {
        $sRedirectUrl = $this->_oConfig->sDefaultRedirectUrl;

        switch($this->_oConfig->sRedirectPage) {
            case 'index':
                $sRedirectUrl = BX_DOL_URL_ROOT;
                break;

            case 'settings':
                if (!$isExistingProfile) { 
                    $sRedirectUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=account-settings-email'));
                    break;
                }

            case 'dashboard':
            default:
                $sRedirectUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=dashboard'));
                break;
            }

        return $sRedirectUrl;
    }

    protected function _redirect($sUrl, $iStatus = 302)
    {
        header("Location:{$sUrl}", true, $iStatus);
        exit;
    }

    protected function _genToken($bReturn = false)
    {
        $oSession = BxDolSession::getInstance();

        $sPrefix = $this->getName();

        $iCsrfTokenLifetime = 3600;
        if ($oSession->getValue($sPrefix . '_token') === false || (time() - (int)$oSession->getValue($sPrefix . '_token_time') > $iCsrfTokenLifetime)) {
            $sToken = genRndPwd(20, false);
            $oSession->setValue($sPrefix . '_token', $sToken);
            $oSession->setValue($sPrefix . '_token_time', time());
        }
        else {
            $sToken = $oSession->getValue($sPrefix . '_token');
        }

        return $sToken;
    }

    protected function _getToken()
    {
        $oSession = BxDolSession::getInstance();
        return $oSession->getValue($this->getName() . '_token');
    }

    protected function _getExistingAccount($aProfileInfo, &$aFieldsAccount, &$aFieldsProfile)
    {
        return BxDolAccount::getInstance($aFieldsAccount['email']);
    }

    /**
     * Check if the email address of the remote profile was verified by the remote site.
     * It is checked before the remote profile is linked to an existing local account by email.
     * The default is permissive, modules whose remote site reports email verification should override it.
     *
     * @param $aProfileInfo - remote profile info
     * @return boolean
     */
    protected function _isRemoteEmailVerified($aProfileInfo)
    {
        return true;
    }

    /**
     * Get access token from the params of a service which is called by a client app.
     * Nothing else is taken from them: who the user is, has to be defined by the remote site.
     *
     * @param $mParams - array ['access_token' => '...'] or JSON string of such array
     * @return string with token or false if there is no valid token
     */
    protected function _getAccessToken($mParams)
    {
        if(is_string($mParams))
            $mParams = bx_api_get_browse_params($mParams);

        if(!is_array($mParams) || empty($mParams['access_token']) || !is_string($mParams['access_token']))
            return false;

        if(!preg_match('/^[A-Za-z0-9._~+\/=-]{10,4096}$/D', $mParams['access_token']))
            return false;

        return $mParams['access_token'];
    }

    /**
     * Decode JSON response of a remote site.
     *
     * @return array or false if the response is not successful
     */
    protected function _decodeJsonResponse($s, $sHttpCode)
    {
        if(!$s || (int)$sHttpCode != 200)
            return false;

        $a = json_decode($s, true);
        if(!is_array($a) || !$a || isset($a['error']))
            return false;

        return $a;
    }

    /**
     * Interpret a flag from remote profile info: boolean true, 1, '1' or 'true' mean true.
     */
    protected function _isRemoteFlagTrue($mixedValue)
    {
        return $mixedValue === true || $mixedValue === 1 || $mixedValue === '1' || $mixedValue === 'true';
    }

    protected function _genPwd($aProfileInfo, &$aFieldsAccount, &$aFieldsProfile)
    {
        return genRndPwd();
    }

    protected function _isSetPendingApprovalAccount($aProfileInfo, &$aFieldsAccount, &$aFieldsProfile)
    {
        return $this->_oConfig->isAlwaysAutoApprove ? false : !(bool)getParam('sys_account_autoapproval');
    }

    protected function _isSetPendingApprovalProfile($aProfileInfo, $oFormHelperProfile, &$aFieldsAccount, &$aFieldsProfile)
    {
        return $oFormHelperProfile->isAutoApproval() ? true : $this->_oConfig->isAlwaysAutoApprove;
    }

    // fo using in some selected modules only
    protected function _actionHandle()
    {
        require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

        // check token
        if ($this->_getToken() != bx_get('state')) {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox(_t('_sys_connect_state_invalid')));
            return;
        }

        // check code
        $sCode = bx_get('code');
        if (!$sCode) {
            $sErrorDescription = bx_get('error_description') ? bx_get('error_description') : _t('_error occured');
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
            return;
        }

        // make request for token
        $s = bx_file_get_contents($this->_oConfig->sApiUrl . 'token', array(
            'client_id'     => $this->_oConfig->sApiID,
            'client_secret' => $this->_oConfig->sApiSecret,
            'grant_type'    => 'authorization_code',
            'code'          => $sCode,
            'redirect_uri'  => $this->_oConfig->sPageHandle,
        ), 'post');

        // handle error
        if (!$s || NULL === ($aResponse = json_decode($s, true)) || !isset($aResponse['access_token']) || isset($aResponse['error'])) {
            $sErrorDescription = isset($aResponse['error_description']) ? $aResponse['error_description'] : _t('_error occured');
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
            return;
        }

        // get the data, especially access_token
        $sAccessToken = $aResponse['access_token'];
        $sExpiresIn = $aResponse['expires_in'];
        $sExpiresAt = new \DateTime('+' . $sExpiresIn . ' seconds');
        $sRefreshToken = $aResponse['refresh_token'];

        $oSession = BxDolSession::getInstance();
        $oSession->setValue($this->getName() . '_access_token', $sAccessToken);
        
        // request info about profile
        $s = bx_file_get_contents($this->_oConfig->sApiUrl . 'api/me', array(), 'get', array(
            'Authorization: Bearer ' . $sAccessToken,
        ));

        // handle error
        if (!$s || NULL === ($aResponse = json_decode($s, true)) || !$aResponse || isset($aResponse['error'])) {
            $sErrorDescription = isset($aResponse['error_description']) ? $aResponse['error_description'] : _t('_error occured'); 
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
            return;
        }

        $aRemoteProfileInfo = $aResponse;

        if ($aRemoteProfileInfo) {

            // check if user logged in before
            $iLocalProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);
            
            if ($iLocalProfileId && $oProfile = BxDolProfile::getInstance($iLocalProfileId)) {
                // user already exists
                $this->setLogged($oProfile ->id());
            }             
            else {  
                // register new user
                $this->_createProfile($aRemoteProfileInfo);
            }
        } 
        else {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox(_t('_sys_connect_profile_error_info')));
        }
    }

    /**
     * Make friends (for using in some selected modules only)
     *
     * @param $iProfileId integer
     * @return void
     */
    protected function __makeFriends($iProfileId)
    {
        if (!$this->_oConfig->bAutoFriends)
            return;

        $oConnFrinds = BxDolConnection::getObjectInstance('sys_profiles_friends');
        if (!$oConnFrinds)
            return;

        // request info about profile
        if (!($iRemoteProfileId = $this->_oDb->getRemoteProfileId($iProfileId)))
            return;
        $oSession = BxDolSession::getInstance();
        if (!($sAccessToken = $oSession->getValue($this->getName() . '_access_token')))
            return;
        $s = bx_file_get_contents($this->_oConfig->sApiUrl . 'api/friends?id=' . $iRemoteProfileId, array(), 'get', array(
            'Authorization: Bearer ' . $sAccessToken,
        ));

        // handle error
        if (!$s || NULL === ($aResponse = json_decode($s, true)) || !$aResponse || isset($aResponse['error']) || !isset($aResponse['friends'])) {
            $sErrorDescription = isset($aResponse['error_description']) ? $aResponse['error_description'] : _t('_error occured');
            return;
        }

        // add friends & followers
        foreach ($aResponse['friends'] as $key => $value) {
            $iRemoteProfileId = is_array($value) ? $key : $value;
            
            if (!($iLocalProfileId = $this->_oDb->getProfileId($iRemoteProfileId)))
                continue;
            $oConnFrinds->actionAdd($iProfileId, $iLocalProfileId);
            $oConnFrinds->actionAdd($iLocalProfileId, $iProfileId);
        }
    }
}

/** @} */

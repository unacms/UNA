<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCoreFunctions UNA Core Functions
 * @{
 */

/**
 * @return corrently logged in profile id
 */
function bx_get_logged_profile_id ()
{
    $o = BxDolProfile::getInstance();
    return $o ? $o->id() : false;
}

/**
 * @return true if user is logged in
 */
function isLogged()
{
    return getLoggedId() != 0;
}

/**
 * @return logged in account id
 */
function getLoggedId()
{
    if ($GLOBALS['glForceCurrentProfileId'] ?? false) {
        return BxDolProfile::getInstance()->getAccountId();
    }
    elseif (getParam('sys_session_auth')) {
        return (!empty($GLOBALS['logged']['member']) || !empty($GLOBALS['logged']['admin'])) ? BxDolSession::getInstance()->getUserId() : 0;
    }
    else {
        return isset($_COOKIE['memberID']) && (!empty($GLOBALS['logged']['member']) || !empty($GLOBALS['logged']['admin'])) ? (int)$_COOKIE['memberID'] : 0;
    }
}

/**
 * @return logged in account password
 */
function getLoggedPassword()
{
    $oAccount = BxDolAccount::getInstance();
    return ($GLOBALS['logged']['member'] || $GLOBALS['logged']['admin']) && $oAccount ? BxDolAccountQuery::getInstance()->getPassword($oAccount->id()) : "";
}

/**
 * It checks if account role is member.
 */
function isMember($iId = 0)
{
    return isRole(BX_DOL_ROLE_MEMBER, $iId);
}

if (!function_exists("isAdmin")) {
    /**
     * @return true if account is admin
     */
    function isAdmin($iId = 0)
    {
        if (!$iId && isset($GLOBALS['logged']['admin']) && $GLOBALS['logged']['admin']) // easier check for currently logged in user
            return true;
        return isRole(BX_DOL_ROLE_ADMIN, $iId);
    }
}

/**
 * Check user role
 * @param $iRole role to check user for
 * @param $iId optional account id, if it isn't specified then curently logged in account is used
 * @return true if user is in the provided role
 */
function isRole($iRole, $iId = 0)
{
    if (!(int)$iId)
        $iId = getLoggedId();

    $oAccount = BxDolAccount::getInstance($iId);
    if (!$oAccount)
        return false;

    $aAccountInfo = $oAccount->getInfo();

    if (!$aAccountInfo)
        return false;

    if (!((int)$aAccountInfo['role'] & $iRole))
        return false;

    return true;
}

/**
 * Login user by setting necessary cookies
 * @param $iId account id
 * @param $bRememberMe remember session
 * @return false if id isn't correct or array of user info if user was logged in
 */
function bx_login($iId, $bRememberMe = false)
{
    $oAccountQuery = BxDolAccountQuery::getInstance();

    $sPassword = $oAccountQuery->getPassword($iId);
    if (!$sPassword)
        return false;

    if (!getParam('sys_session_auth')) {
        $iCookieTime = $bRememberMe ? time() + 60 * getParam('sys_session_lifetime_in_min') : 0;
        bx_setcookie("memberID", $iId, $iCookieTime, 'auto');
        $_COOKIE['memberID'] = $iId;
        bx_setcookie("memberPassword", $sPassword, $iCookieTime, 'auto', '', 'auto', true /* http only */);
        $_COOKIE['memberPassword'] = $sPassword;
    }

    BxDolSession::getInstance()->setUserId($iId);
    if (getParam('sys_session_auth'))
        BxDolSession::getInstance()->setRememberMe($bRememberMe);

    $oAccountQuery->updateLoggedIn($iId);

    $oProfileQuery = BxDolProfileQuery::getInstance();
    if(($iProfileId = $oProfileQuery->getCurrentProfileByAccount($iId, true)) !== false) {
        $aProfileInfo = $oProfileQuery->getInfoById($iProfileId);
        if(!empty($aProfileInfo) && is_array($aProfileInfo) && $aProfileInfo['type'] != 'system')
            BxDolRecommendation::updateData($iProfileId);
    }

    /**
     * @hooks
     * @hookdef hook-account-login 'account', 'login' - hook after user performed login
     * - $unit_name - equals `account`
     * - $action - equals `login` 
     * - $object_id - account id 
     * - $sender_id - not used 
     * - $extra_params - not used
     * @hook @ref hook-account-login
     */
    bx_alert('account', 'login',  $iId);

    bx_audit($iId, 'bx_accounts', '_sys_audit_action_account_login',  array(
        'content_title' => '', 
        'data' => ['display_info' => ['User agent' => (isset($_SERVER["HTTP_USER_AGENT"]) ? $_SERVER["HTTP_USER_AGENT"] : '')]]
    ));
    
    return $oAccountQuery->getInfoById($iId);
}

/**
 * Logout user by removing cookies
 */
function bx_logout($bNotify = true)
{
    if (!($iMemberId = BxDolSession::getInstance()->getUserId()))
        return;

    if ($bNotify && isMember()){
        /**
         * @hooks
         * @hookdef hook-account-logout 'account', 'logout' - hook after user performed logout
         * - $unit_name - equals `account`
         * - $action - equals `logout` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - not used
         * @hook @ref hook-account-logout
         */
        bx_alert('account', 'logout', $iMemberId);
    }

    bx_audit(
        $iMemberId, 
        'bx_accounts', 
        '_sys_audit_action_account_logout',  
        array('content_title' => '', 'data' => ['display_info' => ['User agent' => (isset($_SERVER["HTTP_USER_AGENT"]) ? $_SERVER["HTTP_USER_AGENT"] : '')]])
    );

    if (!getParam('sys_session_auth')) {
        bx_setcookie('memberID', '', time() - 96 * 3600);
        bx_setcookie('memberPassword', '', time() - 96 * 3600, 'auto', '', 'auto', true);

        unset($_COOKIE['memberID']);
        unset($_COOKIE['memberPassword']);
    }

    BxDolSession::getInstance()->destroy();
    // BxDolSession::getInstance()->setUserId(0);
}

function bx_is_remember_me()
{
    return getParam('sys_account_remember_me') == 'on';
}

/**
 * Check if user is logged in (necessary cookies are present) and set some global variables
 */
function check_logged()
{
    bx_alert('account', 'logged_start', 0);

    $aAccTypes = array(
       BX_DOL_ROLE_ADMIN => 'admin',
       BX_DOL_ROLE_MEMBER => 'member'
    );

    $bLogged = false;
    $bID = false;
    $sID = 0;

    if (getParam('sys_session_auth')) {
        $o = BxDolSession::getInstance();
        $sID = $o->getUserId();
        if ($sID && $oAccount = BxDolAccount::getInstance((int)$sID)) {
            $aAccountInfo = $oAccount->getInfo();
            foreach ($aAccTypes as $iRole => $sValue) {
                if ($GLOBALS['logged'][$sValue] = ((int)$aAccountInfo['role'] & $iRole)) {
                    $bLogged = true;
                    $bID = true;
                    break;
                }
            }
        }
    }
    else {
        $bID = isset($_COOKIE['memberID']);
        $sID = $bID ? bx_process_input($_COOKIE['memberID']) : false;

        $bPassword = isset($_COOKIE['memberPassword']);
        $sPassword = $bPassword ? bx_process_input($_COOKIE['memberPassword']) : false;
        
        foreach ($aAccTypes as $iRole => $sValue) {
            if ($GLOBALS['logged'][$sValue] = ($sID && !bx_check_login($sID, $sPassword, $iRole))) {
                BxDolSession::getInstance();
                $bLogged = true;
                break;
            }
        }
    }

    if($bID && $bLogged) {
        header("Cache-Control: no-cache, no-store, must-revalidate");
        /**
         * @hooks
         * @hookdef hook-account-logged 'account', 'logged' - hook after user performed logged
         * - $unit_name - equals `account`
         * - $action - equals `logged` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - not used
         * @hook @ref hook-account-logged
         */
        bx_alert('account', 'logged', getLoggedId());
    }

    if($bID && !$bLogged)
        bx_logout(false);
}

/**
 * Check unencrypted password
 * @return empty string on success or error string on error
 */
function bx_check_password($sLogin, $sPassword, $iRole = BX_DOL_ROLE_MEMBER)
{
    $oAccount = BxDolAccount::getInstance($sLogin);
    if (!$oAccount) {
        bx_import('BxDolLanguages');
        return _t("_sys_txt_login_error");
    }
    
    if ($oAccount->isLocked()){
        bx_import('BxDolLanguages');
		if (bx_is_api()){
            return strip_tags(_t("_sys_txt_login_locked", bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password'))),'');
        }
        return _t("_sys_txt_login_locked", bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password')));
	}

    $aAccountInfo = $oAccount->getInfo();

    $sPassCheck = encryptUserPwd($sPassword, $aAccountInfo['salt']);

	// regenerate password using another encrypt function if necessary
    /**
     * @hooks
     * @hookdef hook-account-encrypt_password_after 'account', 'encrypt_password_after' - hook after user performed login
     * - $unit_name - equals `system`
     * - $action - equals `encrypt_password_after` 
     * - $object_id - not used 
     * - $sender_id - not used 
     * - $extra_params - array of additional params with the following array keys:
     *      - `info` - [array] contains account info from $oAccount->getInfo()
     *      - `pwd` - [string] the password entered by the user
     *      - `password` - [string] the password after encription, to save in db
     * @hook @ref hook-account-encrypt_password_after
     */
	bx_alert('system', 'encrypt_password_after', 0, false, array(
            'info' => $aAccountInfo,
			'pwd' => $sPassword,
            'password' => &$sPassCheck,
            'password_ref' => &$sPassCheck,
        ));
    
    if ($sErrorMsg = bx_check_login($aAccountInfo['id'], $sPassCheck, $iRole)){
        bx_audit(
            $aAccountInfo['id'], 
            'bx_accounts', 
            '_sys_audit_action_account_failed_login_attempt',  
            array('content_title' => '', 'data' => ['display_info' => ['User agent' => (isset($_SERVER["HTTP_USER_AGENT"]) ? $_SERVER["HTTP_USER_AGENT"] : '')]]),
            $aAccountInfo['profile_id']
        );

        $iMaxLoginAttempts = getParam('sys_account_limit_incorrect_login_attempts');
        if ($iMaxLoginAttempts >0){
            $oAccountQuery = BxDolAccountQuery::getInstance();
            if ($aAccountInfo['login_attempts'] >= $iMaxLoginAttempts){
                $oAccountQuery->lockAccount($aAccountInfo['id'], 1);
                bx_import('BxDolLanguages');
                if (bx_is_api()){
                    return strip_tags(_t("_sys_txt_login_locked", bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password'))),'');
                }
            }
            else{
                $oAccountQuery->updateAttemptsCounter($aAccountInfo['id']);
            }
        }
        return $sErrorMsg;
    }

    // Admin can always login even if he is blocked/banned/suspended/etc
    if (isAdmin($aAccountInfo['id']))
        return '';

    $sErrorMsg = '';
    /**
     * @hooks
     * @hookdef hook-account-check_login 'account', 'check_login' - hook after user's login/password check
     * - $unit_name - equals `account`
     * - $action - equals `check_login` 
     * - $object_id - account id  
     * - $sender_id - not used 
     * - $extra_params - array of additional params with the following array keys:
     *      - `error_msg` - [string] by ref, contains string with error description, can be overridden in hook processing
     * @hook @ref hook-account-check_login
     */
    bx_alert('account', 'check_login',  $aAccountInfo['id'], false, array('error_msg' => &$sErrorMsg));
    
    return $sErrorMsg;
}

/**
 * Check encrypted password (ex., from Cookie)
 * @return empty string on success or error string on error
 */
function bx_check_login($iID, $sPassword, $iRole = BX_DOL_ROLE_MEMBER)
{
    $oAccount = BxDolAccount::getInstance((int)$iID);

    // If no such account available
    if (!$oAccount) {
        bx_import('BxDolLanguages');
        return _t("_sys_txt_login_error");
    }

    $aAccountInfo = $oAccount->getInfo();

    // If password is incorrect
    if (strcmp($aAccountInfo['password'], $sPassword) !== 0) {
        bx_import('BxDolLanguages');
        return _t("_sys_txt_login_error");
    }

    // If wrong account role
    if (!((int)$aAccountInfo['role'] & $iRole)) {
        bx_import('BxDolLanguages');
        return _t("_sys_txt_login_invalid_role");
    }

    return '';
}

/**
 * Declare that content is require user authoriztion and display login form if user isn't logged in
 * @param $bStudio require webmaster authorization
 */
function bx_require_authentication ($bStudio = false, $bAjaxMode = false, $sForceRelocate = '')
{
    $iRole = BX_DOL_ROLE_MEMBER;
    if ($bStudio)
        $iRole = BX_DOL_ROLE_ADMIN;

    $sID = 0;
    $sPassword = '';

    if (getParam('sys_session_auth')) {
        $o = BxDolSession::getInstance();
        $sID = $o->getUserId();
        $sPassword = $sID ? BxDolAccountQuery::getInstance()->getPassword($sID) : '';
    } 
    else {
        $sID = isset($_COOKIE['memberID']) ? bx_process_input($_COOKIE['memberID']) : false;
        $sPassword = isset($_COOKIE['memberPassword']) ? bx_process_input($_COOKIE['memberPassword']) : false;
    }

    if (bx_check_login($sID, $sPassword, $iRole)) {
        bx_login_form($bStudio, $bAjaxMode, $sForceRelocate);
    }

    check_logged();
}



/**
 * Display login form and exit
 * @param $bStudio display login form for studio
 * @param $bAjaxMode login form displayed via AJAX
 * @param sForceRelocate forece relocate
 */
function bx_login_form($bStudio = false, $bAjaxMode = false, $sForceRelocate = '')
{
    if ($bStudio == 1) {
        BxTemplStudioFunctions::getInstance()->getLoginForm();
        exit;
    }

    $sFormCode = BxDolService::call('system', 'login_form', array('', $sForceRelocate), 'TemplServiceLogin');

    if ($bAjaxMode) {
        echo $GLOBALS['oFunctions']->transBox('', $sFormCode, false, true);
        exit;
    }

    $oPage = BxDolPage::getObjectInstance('sys_login');
    if($oPage)
        $oPage->displayPage();
    else 
        BxDolTemplate::getInstance()->displayPageNotFound();

    exit;
}

/** @} */

<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

class BxFormLoginCheckerHelper extends BxDolFormCheckerHelper
{
    /**
     * Check if key exists or wrong format
     */
    function checkPhoneExist($s)
    {
        $s = trim($s);
        if(!preg_match("/^\+[0-9\s]*$/", $s)) {
            return _t('_sys_form_login_input_phone_error_format');
        }
        $oSession = BxDolSession::getInstance();
        $oAccount = BxDolAccount::getInstance($oSession->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID));
        if ($oAccount) { // user is logged in
            $aAccountInfo = $oAccount->getInfo();
            if ($s == $aAccountInfo['phone']) // don't check phone for uniq, if it wasn't changed
                return true;
        }
        
        return BxDolAccountQuery::getInstance()->getIdByPhone($s) ? _t('_sys_form_login_input_phone_error_not_unique') : true;       
    }

    /**
     * Check the code of two-factor login (login-step3) against the one sent by SMS (login-step2).
     * A wrong code counts like a wrong password, and BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS of them end the sign-in.
     */
    function checkCodeExist($s)
    {
        $s = trim($s);
        if($s == '') {
            return _t('_sys_form_login_input_code_error_empty');
        }

        $oPermalinks = BxDolPermalinks::getInstance();
        $sUrlLogin = bx_absolute_url($oPermalinks->permalink('page.php?i=login'));
        $sUrlStep2 = bx_absolute_url($oPermalinks->permalink('page.php?i=login-step2'));

        $oSession = BxDolSession::getInstance();
        $oAccount = BxDolAccount::getInstance($oSession->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID));
        $aAccountInfo = $oAccount ? $oAccount->getInfo() : false;
        if (empty($aAccountInfo))
            return _t('_sys_form_login_input_code_error_restart', $sUrlLogin);

        if ((int)$aAccountInfo['locked']) {
            BxTemplServiceLogin::reset2faLogin();
            return _t('_sys_txt_login_locked', bx_absolute_url($oPermalinks->permalink('page.php?i=forgot-password')));
        }

        $aCode = $oSession->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_CODE);
        if (!is_array($aCode) || empty($aCode['code']) || (int)$aCode['expires'] < time())
            return _t('_sys_form_login_input_code_error_expired', $sUrlStep2);

        // The try is counted before the code is compared, and in the database: parallel requests read
        // the same session, so a count kept there would give each of them a guess of its own.
        $iTry = !empty($aCode['attempts_key']) ? BxDolKey::getInstance()->useCounterKey($aCode['attempts_key'], BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS) : false;
        if ($iTry === false) {
            BxTemplServiceLogin::reset2faLogin();
            return _t('_sys_form_login_input_code_error_attempts', $sUrlLogin);
        }

        // Only wrong codes count: a right one rejected later (say, by an expired form token) or sent twice keeps its try.
        if (hash_equals((string)$aCode['code'], $s)) {
            BxDolKey::getInstance()->giveBackCounterKey($aCode['attempts_key']);
            return true;
        }

        bx_login_attempt_failed($aAccountInfo);

        if ($iTry >= BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS) {
            BxTemplServiceLogin::reset2faLogin();
            return _t('_sys_form_login_input_code_error_attempts', $sUrlLogin);
        }

        return _t('_sys_form_login_input_code_error_wrong', $sUrlStep2);
    }   
}

/**
 * Login Form.
 */
class BxBaseFormLogin extends BxTemplFormView
{
    protected $_iRole = BX_DOL_ROLE_MEMBER;

    public function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate);
        
        $this->aParams['checker_errors']['summary']['disabled'] = true;

        $this->_aFieldsExcludeFromCheckForSpam = ['ID'];

        if (isset($this->aInputs['ID']))
            $this->aInputs['ID']['skip_domain_check'] = true;

        if (isset($this->aInputs['relocate'])) {
            $sRelocate = bx_process_input(bx_get('relocate'));
            if (!$sRelocate && isset($_SERVER['HTTP_REFERER']) && 0 === mb_stripos($_SERVER['HTTP_REFERER'], BX_DOL_URL_ROOT)) {

                $sRelocate = $_SERVER['HTTP_REFERER'];
                $aNoRelocatePages = ['forgot-password', 'login', 'create-account', 'logout'];

                foreach ($aNoRelocatePages as $s) {
                    if (false !== mb_stripos($_SERVER['HTTP_REFERER'], $s)) {
                        $sRelocate = BX_DOL_URL_ROOT . 'member.php';
                        break;
                    }
                }   
            }
            
            $this->aInputs['relocate']['value'] = $sRelocate ? $sRelocate : BX_DOL_URL_ROOT . 'member.php';
        }
    }

    function isValid ()
    {
        if (!parent::isValid())
            return false;
        
        if (!isset($this->aInputs['ID']))
            return true;
        
        $sId = trim($this->getCleanValue('ID'));
        $sPassword = trim($this->getCleanValue('Password'));
        
        if ($sId != ''){
            $sErrorString = bx_check_password($sId, $sPassword, $this->getRole());
            $this->_setCustomError ($sErrorString);
            return $sErrorString ? false : true;
        }
        else {
            $this->_setCustomError (_t('_sys_txt_error_occured'));
            return false;
        }
    }

    protected function genCustomInputSubmitText ($aInput)
    {
        return '<div><a href="' . bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password')) . '">' . _t("_sys_txt_forgot_pasword") . '</a></div>';
    }

    public function getRole()
    {
        return $this->_iRole;
    }

    public function setRole ($iRole)
    {
        $this->_iRole = $iRole == BX_DOL_ROLE_ADMIN ? BX_DOL_ROLE_ADMIN : BX_DOL_ROLE_MEMBER;
    }

    public function getRememberMe()
    {
        return isset($this->aInputs['rememberMe']) ? (bool)$this->getCleanValue('rememberMe') : bx_is_remember_me();
    }

    public function getLoginError ()
    {
        return isset($this->aInputs['ID']['error']) ? $this->aInputs['ID']['error'] : '';
    }

    protected function _setCustomError ($s)
    {
        $this->aInputs['ID']['error'] = $s;
    }
}
/** @} */

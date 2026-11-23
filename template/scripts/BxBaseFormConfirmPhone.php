<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

bx_import('BxTemplFormView');

class BxFormConfirmPhoneCheckerHelper extends BxDolFormCheckerHelper
{
    /**
     * Check if key exists or wrong format
     */
    function checkPhoneUniq($s)
    {
        $s = trim($s);
        if(!preg_match("/^\+[0-9\s]*$/", $s)) {
            return _t('_sys_form_confirm_phone_input_phone_error_format');
        }
        
        $oAccount = BxDolAccount::getInstance();
        if ($oAccount) { // user is logged in
            $aAccountInfo = $oAccount->getInfo();
            if ($s == $aAccountInfo['phone']) // don't check phone for uniq, if it wasn't changed
                return true;
        }
        
        return BxDolAccountQuery::getInstance()->getIdByPhone($s) ? _t('_sys_form_confirm_phone_input_phone_error_not_unique') : true;
    }
    
    function checkCodeExist($s)
    {
        $s = trim($s);
        if($s == '') {
            return _t('_sys_form_confirm_phone_input_code_error_empty');
        }
        
        $sUrlStep1 = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=confirm-phone')) . '?step=1';

        $oSession = BxDolSession::getInstance();
        $aCode = $oSession->getValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE);
        if (!is_array($aCode) || empty($aCode['code']) || (int)$aCode['expires'] < time())
            return _t('_sys_form_login_input_code_error_expired', $sUrlStep1);

        // the try is counted before the code is compared, and in the database, so parallel requests share the count
        $oKey = BxDolKey::getInstance();
        $iTry = !empty($aCode['attempts_key']) ? $oKey->useCounterKey($aCode['attempts_key'], BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS) : false;
        if ($iTry === false) {
            $oSession->unsetValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE);
            return _t('_sys_form_confirm_phone_input_code_error_attempts', $sUrlStep1);
        }

        if (hash_equals((string)$aCode['code'], $s)) {
            $oKey->giveBackCounterKey($aCode['attempts_key']);
            return true;
        }

        if ($iTry >= BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS) {
            $oSession->unsetValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE);
            return _t('_sys_form_confirm_phone_input_code_error_attempts', $sUrlStep1);
        }

        return _t('_sys_form_confirm_phone_input_code_error_invalid', $sUrlStep1);
    }
}

/**
 * Phone Confirmation Form.
 */
class BxBaseFormConfirmPhone extends BxTemplFormView
{
    public function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate);

        $this->aParams['checker_errors']['summary']['disabled'] = true;
    }

}

/** @} */

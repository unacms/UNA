<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

bx_import('BxTemplFormView');

class BxFormForgotPasswordCheckerHelper extends BxDolFormCheckerHelper
{
    /**
     * Check if email is exists.
     */
    function checkEmailExist ($s)
    {        
        if (!$this->checkEmail($s))
            return false;

        return BxDolAccountQuery::getInstance()->getIdByEmail($s) ? true : _t('_sys_form_forgot_password_email_not_recognized');
    }
    
    function checkEmailExistOrEmpty ($s)
    {
        if (trim($s) == '')
            return true;
        
        if (!$this->checkEmail($s))
            return false;

        return BxDolAccountQuery::getInstance()->getIdByEmail($s) ? true : _t('_sys_form_forgot_password_email_not_recognized');
    }
	
	/**
     * Check if phone is exists.
     */
    function checkPhoneExist ($s)
    {
        $s = trim($s);
        if(!preg_match("/^\+[0-9\s]*$/", $s)) {
            return _t('_sys_form_forgot_password_phone_error_format');
        }

        return BxDolAccountQuery::getInstance()->getIdByPhone($s) ? true : _t('_sys_form_forgot_password_phone_not_recognized');
    }
    
    function checkPhoneExistOrEmpty ($s)
    {
        if (trim($s) == '')
            return true;
        
        $s = trim($s);
        if(!preg_match("/^\+[0-9\s]*$/", $s)) {
            return _t('_sys_form_forgot_password_phone_error_format');
        }

        return BxDolAccountQuery::getInstance()->getIdByPhone($s) ? true : _t('_sys_form_forgot_password_phone_not_recognized');
    }

}

/**
 * Forgot Password Form.
 */
class BxBaseFormForgotPassword extends BxTemplFormView
{
    public function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate);

        $this->aParams['checker_errors']['summary']['disabled'] = true;

        $this->_setAutocomplete(['email' => 'email', 'password' => 'new-password', 'phone' => 'tel']);
        $this->_setEmailInputs(['email']);
    }

}

/** @} */

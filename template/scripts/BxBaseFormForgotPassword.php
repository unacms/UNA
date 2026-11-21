<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

bx_import('BxTemplFormView');

/**
 * The checks look at the format only: whether an account uses the email or phone isn't said to anybody
 * who asks, the reply is the same either way, @see BxBaseServiceAccount::serviceForgotPassword
 */
class BxFormForgotPasswordCheckerHelper extends BxDolFormCheckerHelper
{
    /**
     * Check the email format.
     */
    function checkEmailExist ($s)
    {        
        if (!$this->checkEmail($s))
            return false;

        return true;
    }
    
    function checkEmailExistOrEmpty ($s)
    {
        if (trim($s) == '')
            return true;
        
        if (!$this->checkEmail($s))
            return false;

        return true;
    }
	
	/**
     * Check the phone format.
     */
    function checkPhoneExist ($s)
    {
        $s = trim($s);
        if(!preg_match("/^\+[0-9\s]*$/", $s)) {
            return _t('_sys_form_forgot_password_phone_error_format');
        }

        return true;
    }
    
    function checkPhoneExistOrEmpty ($s)
    {
        if (trim($s) == '')
            return true;
        
        $s = trim($s);
        if(!preg_match("/^\+[0-9\s]*$/", $s)) {
            return _t('_sys_form_forgot_password_phone_error_format');
        }

        return true;
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

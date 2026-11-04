<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System service for creating system profile functionality.
 */

class BxBaseServiceAccount extends BxDol
{
    protected $_oAccountForms;
    protected $_oAccountQuery;

    public function __construct()
    {
        parent::__construct();

        $this->_oAccountForms = new BxTemplAccountForms();
        $this->_oAccountQuery = BxDolAccountQuery::getInstance();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-account Account
     * @subsubsection bx_system_general-create_account_form create_account_form
     * 
     * @code bx_srv('system', 'create_account_form', [], 'TemplServiceAccount'); @endcode
     * @code {{~system:create_account_form:TemplServiceAccount[{"no_login_text":true, "no_auth_buttons":true}]~}} @endcode
     * 
     * Join form.
     * @param $aParams array of additional params, such as: 
     *          - no_login_text
     *          - no_auth_buttons
     * 
     * @see BxBaseServiceAccount::serviceGetCreatePostForm
     */
    /** 
     * @ref bx_system_general-create_account_form "create_account_form"
     */
    public function serviceCreateAccountForm ($aParams = array())
    {
        $bApi = bx_is_api();

        if (isLogged() && 'create-account' == bx_get('i')) {
            if (!$bApi) {
                header('Location: ' . BX_DOL_URL_ROOT);
                exit;
            }
            else
                return [
                    ['id' => 2, 'type' => 'redirect', 'data' => ['uri' => '/']],
                ];
        }

        if($bApi) {
            $mixedResult = $this->_oAccountForms->createAccountForm($aParams);
            // A list of blocks comes from a module which replaced the form, e.g. Invites when registration is by invitation only.
            if(is_array($mixedResult) && array_is_list($mixedResult))
                return $mixedResult;
            else if(is_array($mixedResult))
                return [bx_api_get_block('form', $mixedResult, [
                    'ext' => [
                        'request' => ['url' => '/api.php?r=system/create_account_form/TemplServiceAccount', 'immutable' => true]
                    ]
                ])];
            else if($mixedResult === true){
                $sRedirectUrl = BxDolForm::getSubmittedValue('relocate','post');
                if(empty($sRedirectUrl)){
                    if (!getParam('sys_account_auto_profile_creation')){
                        
                        $aModulesProfile = bx_srv('system', 'get_modules_by_type', ['profile']);

                        $sDefaultProfileType = getParam('sys_account_default_profile_type');
                        if(count($aModulesProfile) == 1)
                            $sProfileModule = $aModulesProfile[0]['name'];
                        else if(!empty($sDefaultProfileType)) 
                            $sProfileModule = $sDefaultProfileType;
                        
                        $sRedirectUrl = !empty($sProfileModule) ? bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink(BxDolService::call($sProfileModule, 'profile_create_url', array(false)))) : '/';

                    }
                    else{
                        $sRedirectUrl = '/';
                    }    
                }
                else{
                    $parts = parse_url($sRedirectUrl);
                    parse_str($parts['query'], $query);
                    unset($query['_q']);
                    $parts['query'] = http_build_query($query);
                    $sRedirectUrl = $parts['path'] . (!empty($parts['query']) ? '?' . $parts['query'] : '');
                }

                return [
                    bx_api_get_block('form', $this->_oAccountForms->getObjectFormAdd()->getCodeAPI(), [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/create_account_form/TemplServiceAccount', 'immutable' => true]
                        ]
                    ]),
                    bx_api_get_block('redirect', ['uri' => $sRedirectUrl]),
                ];
            }
            else
                return [bx_api_get_msg($mixedResult)];
        }

        $oPemalink = BxDolPermalinks::getInstance();

        if (isset($_SERVER['HTTP_REFERER']) && 0 === mb_stripos($_SERVER['HTTP_REFERER'], BX_DOL_URL_ROOT)) { // remember referrer
            $sJoinReferrer = $_SERVER['HTTP_REFERER'];
            $aNoRelocatePages = array('forgot-password', 'login', 'create-account', 'logout');
            foreach ($aNoRelocatePages as $s) {
                if (false !== mb_stripos($sJoinReferrer, $s)) {
                    $sJoinReferrer = '';
                    break;
                }
            }   
            if ($sJoinReferrer)
                BxDolSession::getInstance()->setValue('join-referrer', $sJoinReferrer);
        }

        $aTmplVarsAuth = [];
        if(!isset($aParams['no_auth_buttons']) || false === (bool)$aParams['no_auth_buttons'])
            $aTmplVarsAuth['content'] = BxDolService::call('system', 'member_auth_code', array(), 'TemplServiceLogin');

        $aTmplVarsForm = [];
        if(!(bool)getParam('sys_account_disable_join_form'))
            $aTmplVarsForm['content'] = $this->_oAccountForms->createAccountForm($aParams);

        $aTmplVarsLogin = [];
        if(!isset($aParams['no_login_text']) || false === (bool)$aParams['no_login_text'])
            $aTmplVarsLogin['url'] = bx_absolute_url($oPemalink->permalink('page.php?i=login'));
        
        return BxDolTemplate::getInstance()->parseHtmlByName('block_join.html', [
            'bx_if:show_auth' => [
                'condition' => !empty($aTmplVarsAuth),
                'content' => $aTmplVarsAuth
            ],
            'bx_if:show_form' => [
                'condition' => !empty($aTmplVarsForm),
                'content' => $aTmplVarsForm,
            ],
            'bx_if:show_login' => [
                'condition' => !empty($aTmplVarsLogin),
                'content' => $aTmplVarsLogin
            ],
            'agreement' => _t('_sys_form_account_input_agreement_value', bx_absolute_url($oPemalink->permalink('page.php?i=terms')), bx_absolute_url($oPemalink->permalink('page.php?i=privacy'))),
        ]);
    }

    public function serviceAccountSettingsEmail ($iAccountId = false)
    {
        if (false === $iAccountId)
            $iAccountId = getLoggedId();
        
        $bApi = bx_is_api();
        
        $mixedResult =$this->_oAccountForms->editAccountEmailSettingsForm($iAccountId);
        
        if($bApi) {
            if(is_array($mixedResult)){
                if (isset($mixedResult['form'] )){
                    return [
                        bx_api_get_msg($mixedResult['msg']),
                        bx_api_get_block('form', $mixedResult['form'], [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/account_settings_email/TemplServiceAccount', 'immutable' => true]
                        ]
                    ])];
                }
                else{
                return [bx_api_get_block('form', $mixedResult, [
                    'ext' => [
                        'request' => ['url' => '/api.php?r=system/account_settings_email/TemplServiceAccount', 'immutable' => true]
                    ]
                ])];
                }
            }
            else
                return [bx_api_get_msg($mixedResult)];
        }    
        
        return $mixedResult;
    }

    public function serviceAccountSettingsPassword ($iAccountId = false)
    {
        if (false === $iAccountId)
            $iAccountId = getLoggedId();
        
        $bApi = bx_is_api();
        
        $mixedResult =$this->_oAccountForms->editAccountPasswordSettingsForm($iAccountId);
        if($bApi) {
            if(is_array($mixedResult)){
                if (isset($mixedResult['form'] )){
                    return [
                        bx_api_get_msg($mixedResult['msg']),
                        bx_api_get_block('form', $mixedResult['form'], [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/account_settings_password/TemplServiceAccount', 'immutable' => true]
                        ]
                    ])];
                }
                else{
                    return [bx_api_get_block('form', $mixedResult, [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/account_settings_password/TemplServiceAccount', 'immutable' => true]
                        ]
                    ])];
                }
            }
            else
                return [bx_api_get_msg($mixedResult)];
        }
        
        return $mixedResult;
    }

    public function serviceAccountSettingsInfo ($iAccountId = false)
    {
        if (false === $iAccountId)
            $iAccountId = getLoggedId();
        
        $bApi = bx_is_api();
        
        $mixedResult =$this->_oAccountForms->editAccountInfoForm($iAccountId);
        
        if($bApi) {
            if(is_array($mixedResult)){
                if (isset($mixedResult['form'] )){
                    return [
                        bx_api_get_msg($mixedResult['msg']),
                        bx_api_get_block('form', $mixedResult['form'], [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/account_settings_info/TemplServiceAccount', 'immutable' => true]
                        ]
                    ])];
                }
                else{
                return [bx_api_get_block('form', $mixedResult, [
                    'ext' => [
                            'request' => ['url' => '/api.php?r=system/account_settings_info/TemplServiceAccount', 'immutable' => true]
                    ]
                ])];
                }
            }
            else
                return [bx_api_get_msg($mixedResult)];
        }    
        return $mixedResult;
    }

    public function serviceAccountSettingsDelAccount ($iAccountId = false)
    {
        if (!$iAccountId)
        	$iAccountId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if (!$iAccountId)
            $iAccountId = getLoggedId();

        $bApi = bx_is_api();
        
        $mixedResult = $this->_oAccountForms->deleteAccountForm($iAccountId);
        
        if($bApi) {
            if(is_array($mixedResult)){
                if (isset($mixedResult['form'] )){
                    return [
                        bx_api_get_msg($mixedResult['msg']),
                        bx_api_get_block('form', $mixedResult['form'], [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/account_settings_del_account/TemplServiceAccount', 'immutable' => true]
                        ]
                    ])];
                }
                else{
                    return [bx_api_get_block('form', $mixedResult, [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/account_settings_del_account/TemplServiceAccount', 'immutable' => true]
                        ]
                    ])];
                }
            }
            else if(is_string($mixedResult))
                return [
                    bx_api_get_msg($mixedResult)
                ];
            else
                return [
                    ['id' => 2, 'type' => 'redirect', 'data' => ['uri' => '/']],
                ];
        }

        return $mixedResult;
    }

    public function serviceAccountDelete($iId, $bWithContent = false)
    {
        if(($oAccount = BxDolAccount::getInstance($iId)) !== false)
            return $oAccount->delete($bWithContent);

        return false;
    }

    /**
     * Display unsubscribe from newsletters form
     */
    public function serviceUnsubscribeNews()
    {
        return $this->_unsubscribeForm('sys_unsubscribe_news');
    }

    /**
     * Display unsubscribe from notifications form
     */
    public function serviceUnsubscribeNotifications()
    {
        return $this->_unsubscribeForm('sys_unsubscribe_updates');
    }
    
    /**
     * Display confirmation statuses list
     */
    public function serviceGetConfirmationTypes()
    {
        $aResult = array();
        $aChoices = array(BX_ACCOUNT_CONFIRMATION_NONE, BX_ACCOUNT_CONFIRMATION_EMAIL, BX_ACCOUNT_CONFIRMATION_PHONE, BX_ACCOUNT_CONFIRMATION_EMAIL_PHONE, BX_ACCOUNT_CONFIRMATION_EMAIL_OR_PHONE);
        foreach($aChoices as $sChoice)
            $aResult[$sChoice] = _t('_sys_acc_confirmation_type_' . $sChoice);
        
        return $aResult;
    }

    protected function _unsubscribeForm($sDisplay)
    {
        $iAccountId = bx_process_input(bx_get('id'));
        $sCode = bx_process_input(bx_get('code'));

        // validate input params

        $oAccount = BxDolAccount::getInstance($iAccountId);
        if (!$oAccount)
            return MsgBox(_t('_sys_txt_unsubscribe_wrong_link'));

        if ($sCode != $oAccount->getEmailHash())
            return MsgBox(_t('_sys_txt_unsubscribe_wrong_link'));

        $oForm = BxDolForm::getObjectInstance('sys_unsubscribe', $sDisplay);
        if (!$oForm)
            return MsgBox(_t('_sys_txt_unsubscribe_error_occured'));

        // show form

        $aAccountInfo = $oAccount->getInfo();
        $aAccountInfo['code'] = $sCode;
        $oForm->initChecker($aAccountInfo);

        if ($oForm->isSubmittedAndValid()) {

            if (!$oForm->update($oAccount->id()))
                return MsgBox(_t('_sys_txt_unsubscribe_error_occured'));

            return MsgBox(_t('_sys_txt_unsubscribe_email_settings_update_success'));
        }

        return '<div class="bx-def-padding-bottom">' . _t("_sys_txt_unsubscribe_info", $aAccountInfo['email']) . '</div>' . $oForm->getCode();
    }

    /**
     * Display email confirmation form, if confirmation code is provided then try to confirm profile
     */
    public function serviceEmailConfirmation($sMsg = false)
    {
        $bApi = bx_is_api();
        // if user is logged in and email is confirmed then just display a message
        if (isLogged() && !bx_get('code')) {
            $oAccount = BxDolAccount::getInstance();
            if ($oAccount->isConfirmedEmail())
                return $bApi ? [bx_api_get_msg(_t("_sys_txt_confirm_email_already_confirmed"))] : MsgBox(_t("_sys_txt_confirm_email_already_confirmed"));
        }

        // if confirmation code is provided in the URL - perform email confirmation right away
        if (bx_get('code') !== false)
            return $this->confirmEmail(bx_process_input(bx_get('code')));

        // if user requested to resend verification letter then send letter and display message
        if (bx_process_input(bx_get('resend')) && isLogged()) {
            $oAccount = BxDolAccount::getInstance();
            if ($oAccount->sendConfirmationEmail())
                $sMsg = _t('_sys_txt_confirm_email_sent');
            else
                $sMsg = _t('_sys_txt_confirm_email_sent_failed');
            return $bApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);
        }

        // show and process code verification form

        $oForm = BxDolForm::getObjectInstance('sys_confirm_email', 'sys_confirm_email');
        if (!$oForm)
            return $bApi ? [bx_api_get_msg(_t("_sys_txt_confirm_email_error_occured"))] : MsgBox(_t("_sys_txt_confirm_email_error_occured"));

        $oForm->initChecker();

        if ($oForm->isSubmittedAndValid()) {

            $oKey = BxDolKey::getInstance();
            if (!$oKey){
                return $bApi ? [bx_api_get_msg(_t("_sys_txt_confirm_email_error_occured"))] : MsgBox(_t("_sys_txt_confirm_email_error_occured"));
            }
            else{
                $oRv = $this->confirmEmail(trim($oForm->getCleanValue('code')));
                if (!$bApi)
                    return $oRv;
                
                return $oRv;
            }

        }
        
        if ($bApi){
            return [bx_api_get_block('form', $oForm->getCodeAPI(), [
                'ext' => [
                    'request' => ['url' => '/api.php?r=system/email_confirmation/TemplServiceAccount', 'immutable' => true]
                ]
            ])];
        }

        return '<div class="bx-def-padding-sec-bottom">' . _t("_sys_txt_confirm_email_desc") . '</div>' . $oForm->getCode();
    }
    
    /**
     * Display phone confirmation forms, if confirmation code is provided then try to confirm profile
     */
    public function servicePhoneConfirmation($sMsg = false)
    {
        // if user is logged in and phone is confirmed then just display a message
        if (isLogged()) {
            $oAccount = BxDolAccount::getInstance();
            if ($oAccount->isConfirmedPhone())
                return MsgBox(_t("_sys_txt_confirm_phone_already_confirmed"));
            
            $iStep = 1;
            $a = $oAccount->getInfo();
            $sPhoneNumber = $a['phone'];
            
            $oSession = BxDolSession::getInstance();           
            if ($sPhoneNumber != "" && $oSession->isValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE))
                $iStep = 2;
        
            if (bx_get('step'))
                $iStep = (int)bx_get('step');
        
            // show and process phone set form
            if ($iStep == 1){
                $oForm = BxDolForm::getObjectInstance('sys_confirm_phone', 'sys_confirm_phone_set_phone');
                if (!$oForm)
                    return MsgBox(_t("_sys_txt_confirm_phone_set_phone_error_occured"));
            
                $oForm->initChecker(['phone' => $sPhoneNumber]);
                if ($oForm->isSubmittedAndValid()) {
                    $sPhoneNumber = trim($oForm->getCleanValue('phone'));
                    $oAccount->updatePhone($sPhoneNumber);

                    $sActivationCode = rand(1000, 9999);
                    $sActivationText =_t('_sys_txt_confirm_phone_sms_text', $sActivationCode);
                    $mixedResult = null;
                    /**
                     * @hooks
                     * @hookdef hook-account-before_confirm_phone_send_sms 'account', 'before_confirm_phone_send_sms' - hook in confirm phone 
                     * - $unit_name - equals `account`
                     * - $action - equals `before_confirm_phone_send_sms` 
                     * - $object_id - account id 
                     * - $sender_id - logged profile_id
                     * - $extra_params - array of additional params with the following array keys:
                     *      - `phone_number` - [string]  by ref, phone number to send sms, can be overridden in hook processing
                     *      - `sms_text` - [string] by ref, text for sms, can be overridden in hook processing
                     *      - `override_result` - [mixed] by ref, can be object, can be overridden in hook processing
                     * @hook @ref hook-account-before_confirm_phone_send_sms
                     */
                    bx_alert('account', 'before_confirm_phone_send_sms', $oAccount->id(), bx_get_logged_profile_id(), [
                        'phone_number' => &$sPhoneNumber, 
                        'sms_text' => &$sActivationText, 

                        'phone_number_ref' => &$sPhoneNumber, 
                        'sms_text_ref' => &$sActivationText, 

                        'override_result' => &$mixedResult
                    ]);

                    if ($mixedResult === null && ($oSms = BxDolSms::getObjectInstance()) !== false && !$oSms->send($sPhoneNumber,  $sActivationText))
                        return MsgBox(_t("_sys_txt_confirm_phone_send_sms_error_occured"));

                    $oSession->setValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE, $sActivationCode);
                    header('Location: ' . bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=confirm-phone')));
                } 
                return '<div class="bx-def-padding-sec-bottom">' . _t("_sys_txt_confirm_phone_set_phone_desc_set_phone") . '</div>' .$oForm->getCode();
            }
        
            if ($iStep == 2){
                $oForm = BxDolForm::getObjectInstance('sys_confirm_phone', 'sys_confirm_phone_confirmation');
                if (!$oForm)
                    return MsgBox(_t("_sys_txt_confirm_phone_set_phone_confirmation_occured"));
            
                $oForm->initChecker();
            
                if ($oForm->isSubmittedAndValid()) {
                    $oAccount->updatePhoneConfirmed(true);
                    $oSession->unsetValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE);
                    return MsgBox(_t("_sys_txt_confirm_phone_confirm_success"));
                } 
                return '<div class="bx-def-padding-sec-bottom">' . _t("_sys_txt_confirm_phone_set_phone_desc_phone_confirmation") . '</div>' .$oForm->getCode();
            }
        }
    }

    /**
     * Perform email confirmation
     */
    public function confirmEmail($sKey)
    {
        $bApi = bx_is_api();
        
        $mixedAccountId = $this->_confirmEmail($sKey);
        if(is_string($mixedAccountId) && !is_numeric($mixedAccountId))
            return $bApi ? [bx_api_get_msg($mixedAccountId)] : MsgBox($mixedAccountId);

        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
            $oSockets->sendEvent('sys_account', $mixedAccountId, 'confirmed', '');

        // redirect with success message
        $sUrl = getParam('sys_redirect_after_email_confirmation');
        /**
         * @hooks
         * @hookdef hook-account-after_email_confirmation 'account', 'after_email_confirmation' - hook after email confirmed
         * - $unit_name - equals `account`
         * - $action - equals `after_email_confirmation` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [string] by ref, url for redirect after email confirmed, can be overridden in hook processing
         * @hook @ref hook-account-after_email_confirmation
         */
        bx_alert('account', 'after_email_confirmation', $mixedAccountId, false, ['override_result' => &$sUrl]);
        if ($bApi){
            return  [bx_api_get_block('redirect', ['uri' => bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink($sUrl))])];
        }

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageNameIndex (BX_PAGE_TRANSITION);
        $oTemplate->setPageHeader (_t('_sys_txt_confirm_email_success'));
        $oTemplate->setPageContent ('page_main_code', MsgBox(_t('_sys_txt_confirm_email_success')));
        $oTemplate->setPageContent ('url_relocate', bx_absolute_url(BxDolPermalinks::getInstance()->permalink($sUrl)));

        BxDolTemplate::getInstance()->getPageCode();
        exit;
    }

    public function serviceConfirmEmail($sKey)
    {
        $mixedAccountId = $this->_confirmEmail($sKey);
        
        if(is_string($mixedAccountId) && !is_numeric($mixedAccountId))
            return $bApi ? [bx_api_get_msg($mixedAccountId)] : MsgBox($mixedAccountId);
            
        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled()){
			$oSockets->sendEvent('sys_account', $mixedAccountId, 'confirmed', '');
		}
        
        bx_alert('account', 'after_email_confirmation', $mixedAccountId, false, ['override_result' => &$sUrl]);
		
        return true;
    }

    public function serviceGetOptionsResetPasswordRedirect()
    {
        $aResult = array();

        $aChoices = array('home', 'profile', 'profile_edit', 'custom');
        foreach($aChoices as $sChoice) 
            $aResult[] = array('key' => $sChoice, 'value' => _t('_adm_stg_cpt_option_value_sys_account_reset_password_redirect_' . $sChoice));

        return $aResult;
    }

    public function serviceGetOptionsSwitchToProfileRedirect()
    {
        $aResult = array();

        $aChoices = array('back', 'home', 'profile', 'custom');
        foreach($aChoices as $sChoice) 
            $aResult[] = array('key' => $sChoice, 'value' => _t('_adm_stg_cpt_option_value_sys_account_switch_to_profile_redirect_' . $sChoice));

        return $aResult;
    }

    public function serviceGetOptionsPruningInterval()
    {
        $aResult = array();

        $aChoices = array('no_login_delete', 'no_login_suspend', 'no_confirm_delete', 'no_profile_delete');
        foreach($aChoices as $sChoice) 
            $aResult[] = array('key' => $sChoice, 'value' => _t('_adm_stg_cpt_option_value_sys_account_pruning_' . $sChoice));

        return $aResult;
    }
            
    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-account Account
     * @subsubsection bx_system_general-forgot_password forgot_password
     * 
     * @code bx_srv('system', 'forgot_password', [], 'TemplServiceAccount'); @endcode
     * @code {{~system:forgot_password:TemplServiceAccount~}} @endcode
     * 
     * Display forgot password form, 
     * if reset password key is provided then reset password
     * 
     * @see BxBaseServiceAccount::serviceForgotPassword
     */
    /** 
     * @ref bx_system_general-forgot_password "forgot_password"
     */
    public function serviceForgotPassword()
    {
        $bApi = bx_is_api();

        if (isLogged() && 'forgot-password' == bx_get('i')) {
            if (!$bApi) {
                header('Location: ' . BX_DOL_URL_ROOT);
                exit;
            }
            else
                return [
                    ['id' => 2, 'type' => 'redirect', 'data' => ['uri' => '/']],
                ];
        }

        if (bx_get('key') !== false)
            return $this->resetPassword();

        $oForm = BxDolForm::getObjectInstance('sys_forgot_password', 'sys_forgot_password');
        if (!$oForm)
            return '';

        $bNeedCheckEmailAndPhone = true;
        $sCaptionKey = "_sys_txt_forgot_pasword_by_both_desc";
        if (BxDolAccount::isNeedConfirmPhone()){
            if (!BxDolAccount::isNeedConfirmEmail()){
                unset($oForm->aInputs['email']);
                $sCaptionKey = "_sys_txt_forgot_pasword_by_phone_desc";
                $oForm->aInputs['phone']['checker']['func'] = 'PhoneExist';
                $bNeedCheckEmailAndPhone = false;
            }
        }
        else{
            unset($oForm->aInputs['phone']);
            $sCaptionKey = "_sys_txt_forgot_pasword_desc";
            $oForm->aInputs['email']['checker']['func'] = 'EmailExist';
            $bNeedCheckEmailAndPhone = false;
        }

        if ((BxDolAccount::isNeedConfirmPhone() && BxDolAccount::isNeedConfirmEmail())){
            if (isset($oForm->aInputs['phone']))
                $oForm->aInputs['phone']['required'] = false;
            if (isset($oForm->aInputs['email']))
                $oForm->aInputs['email']['required'] = false;
        }

        $oForm->initChecker();

        $bShowErrorEmptyBoth = false;
        if ($oForm->isSubmitted() && $bNeedCheckEmailAndPhone && $oForm->getCleanValue('phone') == '' && $oForm->getCleanValue('email') == ''){
            $bShowErrorEmptyBoth = true;
            $oForm->setValid(false);
        }

        $sResultMsg = '';
        if ($oForm->isSubmittedAndValid()) {
            $sEmail = $oForm->getCleanValue('email');
            $sPhone = $oForm->getCleanValue('phone');

            if (isset($oForm->aInputs['email']) &&  $sEmail != '') {
                $oAccount = BxDolAccount::getInstance($this->_oAccountQuery->getIdByEmail($sEmail));

                if($oAccount && $oAccount->sendResetPasswordEmail())
                    $sResultMsg = MsgBox(_t("_sys_txt_forgot_pasword_check_email"));
                else
                    $sResultMsg = MsgBox(_t("_sys_txt_forgot_pasword_email_send_failed"));

                $sForm = '';
            }

            if (isset($oForm->aInputs['phone']) &&  $sPhone != '') {   
                $iAccountId = $this->_oAccountQuery->getIdByPhone($sPhone);
                $aAccountInfo = $this->_oAccountQuery->getInfoById($iAccountId);

                $sKey = bx_get_reset_password_key($aAccountInfo['email']);
                $sForgotPasswordUrl = bx_get_reset_password_link_by_key($sKey); 

                $sSmsText = _t('_sys_txt_forgot_pasword_sms_text', $sForgotPasswordUrl);

                $mixedOverrideResult = null;
                /**
                 * @hooks
                 * @hookdef hook-account-before_forgot_password_send_sms 'account', 'before_forgot_password_send_sms' - hook in  $oAccount->isConfirmed check
                 * - $unit_name - equals `account`
                 * - $action - equals `before_forgot_password_send_sms` 
                 * - $object_id - account id 
                 * - $sender_id - not used 
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `phone_number` - [string]  by ref, phone number to send sms, can be overridden in hook processing
                 *      - `sms_text` - [string] by ref, text for sms, can be overridden in hook processing
                 *      - `override_result` - [mixed] by ref, can be object, can be overridden in hook processing
                 * @hook @ref hook-account-before_forgot_password_send_sms
                 */
                bx_alert('account', 'before_forgot_password_send_sms', $aAccountInfo['id'], false, [
                    'phone_number' => &$sPhone, 
                    'sms_text' => &$sSmsText, 

                    'phone_number_ref' => &$sPhone, 
                    'sms_text_ref' => &$sSmsText, 

                    'override_result' => &$mixedOverrideResult
                ]);

                if ($mixedOverrideResult === null) {
                    if(($oSms = BxDolSms::getObjectInstance()) !== false && $oSms->send($sPhone,  $sSmsText))
                        $sResultMsg = MsgBox(_t("_sys_txt_forgot_pasword_check_phone"));
                    else
                        $sResultMsg = MsgBox(_t("_sys_txt_forgot_pasword_error_occured"));
                }

                $sForm = '';
            }
            
            if($bApi) {
                return [
                    bx_api_get_msg(strip_tags($sResultMsg)),
                    bx_api_get_block('form', $oForm->getCodeAPI(), [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/forgot_password/TemplServiceAccount', 'immutable' => true]
                        ]
                    ])
                ];
            }
        } 
        else {
            $sResultMsg = _t($sCaptionKey);

            if($bApi) {
                $aBlocks = [
                    bx_api_get_block('form', $oForm->getCodeAPI(), [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/forgot_password/TemplServiceAccount', 'immutable' => true]
                        ]
                ])];

                // On the page the hint goes under the block title, as the site shows it above the form;
                // a form submitted to the request url above still gets the blocks alone.
                return BxDolPage::getBlockProcessing() ? ['description' => $sResultMsg, 'content' => $aBlocks] : $aBlocks;
            }

            $sForm = $oForm->getCode();
        }

        return '<div class="bx-def-padding-sec-bottom">' . $sResultMsg . '</div>' . $sForm . ($bShowErrorEmptyBoth ? '<div class="bx-form-warn">' . _t("_sys_form_forgot_password_phone_and_email_empty_error") . '</div>' : '');
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-account Account
     * @subsubsection bx_system_general-switch_profile switch_profile
     * 
     * @code bx_srv('system', 'switch_profile', [123], 'TemplServiceAccount'); @endcode
     * @code {{~system:switch_profile:TemplServiceAccount:[123]~}} @endcode
     * 
     * Switch current user profile. 
     * User can switch between profiles if multiple profiles are created.
     * Also it's possible to switch to Organization profile if user is admin of Organization, 
     * or other module which can `actAsProfile`.
     * Admin can switch to any prifile by default
     *
     * @param $iSwitchToProfileId profile ID to switch to
     * @return true on success or error message otherwise, so make sue to make strict (===) comparision
     * 
     * @see BxBaseServiceAccount::serviceSwitchProfile
     */
    /** 
     * @ref bx_system_general-switch_profile "switch_profile"
     */
    public function serviceSwitchProfile($iSwitchToProfileId)
    {
        $oProfile = BxDolProfile::getInstance($iSwitchToProfileId);
        if (!$oProfile) {
            return _t('_sys_txt_error_occured');
        }

        $iViewerAccountId = getLoggedId();
        $iSwitchToAccountId = $oProfile->getAccountId();
        
        $iViewerProfileId = bx_get_logged_profile_id();
        $aCheck = checkActionModule($iViewerProfileId, 'switch to any profile', 'system', false);
        $bAllowSwitchToAnyProfile = $aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED;

        $bCanSwitch = ($iSwitchToAccountId == $iViewerAccountId || $bAllowSwitchToAnyProfile);
        /**
         * @hooks
         * @hookdef hook-account-check_switch_context 'account', 'check_switch_context' - hook on switch profile_id
         * - $unit_name - equals `account`
         * - $action - equals `check_switch_context` 
         * - $object_id - account id 
         * - $sender_id - viewer profile_id
         * - $extra_params - array of additional params with the following array keys:
         *      - `switch_to_profile` - [int] profile_id to switch
         *      - `viewer_account` - [int] viewer's profile_id, can be overridden in hook processing
         *      - `override_result` - [bool] by ref, true if allow switch profile, otherwise false, can be overridden in hook processing
         * @hook @ref hook-account-check_switch_context
         */
        bx_alert('account', 'check_switch_context', $iSwitchToAccountId, $iViewerProfileId, array('switch_to_profile' => $iSwitchToProfileId, 'viewer_account' => $iViewerAccountId, 'override_result' => &$bCanSwitch));

        if (!$bCanSwitch) {
            return isset($aCheck[CHECK_ACTION_MESSAGE]) ? $aCheck[CHECK_ACTION_MESSAGE] : _t('_sys_txt_error_occured'); 
        } 

        $oAccount = BxDolAccount::getInstance();
        if (!$oAccount->updateProfileContext($iSwitchToProfileId)) {
            return _t('_sys_txt_error_occured');
        }

        checkActionModule($iViewerProfileId, 'switch to any profile', 'system', true);
        if (bx_is_api()){
            return BxDolProfile::getDataForPage($iSwitchToProfileId);
        }
        return true;
    }

    /**
     * Reset password procedure
     */
    public function resetPassword()
    {
        $bApi = bx_is_api();
        $sKey = bx_process_input(bx_get('key'));

        $oForm = BxDolForm::getObjectInstance('sys_forgot_password', 'sys_forgot_password_reset');
        if(!empty($sKey) && isset($oForm->aInputs['key']))
            $oForm->aInputs['key']['value'] = $sKey;

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $sErrorUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password'));
            if($bApi)
                $sErrorUrl = bx_api_get_relative_url($sErrorUrl);

            // check if key exists
            $oKey = BxDolKey::getInstance();
            $sKey = $oForm->getCleanValue('key');
            if(!$oKey || !$oKey->isKeyExists($sKey))
                return ($sMsg = _t('_sys_txt_reset_pasword_error_invalid_key', $sErrorUrl)) && $bApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);

            // check if key data exists
            $aKeyData = $oKey->getKeyData($sKey);
            if(empty($aKeyData['email']))
                return ($sMsg = _t('_sys_txt_reset_pasword_error_invalid_key', $sErrorUrl)) && $bApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);

            // check if account with such email exists
            $iAccountId = $this->_oAccountQuery->getIdByEmail($aKeyData['email']);
            if(empty($iAccountId))
                return ($sMsg = _t('_sys_txt_reset_pasword_error_not_found', $sErrorUrl)) && $bApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);

            $sPassword = $oForm->getCleanValue('password');
            $oAccount = BxDolAccount::getInstance($iAccountId);
            if (!$oAccount || !$oAccount->updatePassword($sPassword))
                return ($sMsg = _t('_sys_txt_reset_pasword_error_occured', $sErrorUrl)) && $bApi ?[ bx_api_get_msg($sMsg)] : MsgBox($sMsg);

            $this->_oAccountQuery->unlockAccount($iAccountId);
            $oKey->removeKey($sKey);

            return ($sMsg = _t('_sys_txt_reset_pasword_success')) && $bApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg, 3) . bx_srv('system', 'login_form_only', array('', bx_get_reset_password_redirect($iAccountId)), 'TemplServiceLogin');
        }

        $sTitleReset = _t('_sys_page_title_forgot_password_reset');
        BxDolTemplate::getInstance()->setPageHeader($sTitleReset);
        if(($oPage = BxDolPage::getObjectInstanceByURI()) !== false)
            $oPage->setTitle($sTitleReset);

         if($bApi) {
                return [
                    bx_api_get_block('form', $oForm->getCodeAPI(), [
                        'ext' => [
                            'request' => ['url' => '/api.php?r=system/forgot_password/TemplServiceAccount', 'immutable' => true]
                        ]
                ])];
            }

        return $oForm->getCode();
    }

    /**
     * Generate new password.
     */
    public function generateUserNewPwd($iAccountId)
    {
        $sPassword = genRndPwd(8, false);
        $sSalt = genRndSalt();
        $sPasswordHash = encryptUserPwd($sPassword, $sSalt);

        $this->_oAccountQuery->logPassword($iAccountId);
        $this->_oAccountQuery->updatePassword($sPasswordHash, $sSalt, $iAccountId);

        /**
         * @hooks
         * @hookdef hook-account-edited 'account', 'edited' - hook on account edited
         * - $unit_name - equals `account`
         * - $action - equals `edited` 
         * - $object_id - account id 
         * - $sender_id - account id 
         * - $extra_params - array of additional params with the following array keys:
         *      - `action` - [string] can be forgot_password/change_password or $sDisplayName  (display name for current form)
         * @hook @ref hook-account-edited
         */
        bx_alert('account', 'edited', $iAccountId, $iAccountId, [
            'action' => 'forgot_password'
        ]);

        return $sPassword;
    }

    protected function _confirmEmail($sKey)
    {
        // check if key exists
        $oKey = BxDolKey::getInstanceWithScope(BX_KEY_SCOPE_ACCOUNT_EMAIL_CONFIRM);
        if (!$oKey || !$oKey->isKeyExists($sKey))
            return _t("_sys_txt_confirm_email_error_occured");

        // check if key data exists
        $aData = $oKey->getKeyData($sKey);
        if (!isset($aData['account_id']))
            return _t("_sys_txt_confirm_email_error_occured");

        // check if account exists
        $oAccount = BxDolAccount::getInstance($aData['account_id']);
        if (!$oAccount)
            return _t("_sys_txt_confirm_email_error_occured");

        // remove key
        $oKey->removeKey($sKey);

        // confirm email
        if (!$oAccount->updateEmailConfirmed(true))
            return _t("_sys_txt_confirm_email_error_occured");

        // login to user's account automatically
        bx_login($aData['account_id'], bx_is_remember_me());

        $oAccount->sendWelcomeEmail();

        return (int)$aData['account_id'];
    }
}

/** @} */

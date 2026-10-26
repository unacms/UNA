<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System service for login form functionality.
 */
class BxBaseServiceLogin extends BxDol
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-login Login
     * @subsubsection bx_system_general-test test
     * 
     * @code bx_srv('system', 'test', [3], 'TemplServiceLogin'); @endcode
     * @code {{~system:test:TemplServiceLogin[3]~}} @endcode
     * 
     * Test method which returns provided number multiplied by 2
     * @param $n number 
     * 
     * @see BxBaseServiceLogin::serviceTest
     */
    /** 
     * @ref bx_system_general-test "test"
     * @api @ref bx_system_general-test "test"
     */
    public function serviceTest ($n = 1)
    {
        return $n*2;
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-login Login
     * @subsubsection bx_system_general-member_auth_code member_auth_code
     * 
     * @code bx_srv('system', 'member_auth_code', [], 'TemplServiceLogin'); @endcode
     * @code {{~system:member_auth_code:TemplServiceLogin~}} @endcode
     * 
     * Display external login buttons such as Facebook, Twitter, etc
     * @param $aAuthTypes optional list of external login buttons
     * 
     * @see BxBaseServiceLogin::serviceMemberAuthCode
     */
    /** 
     * @ref bx_system_general-member_auth_code "member_auth_code"
     */
    public function serviceMemberAuthCode($aAuthTypes = array())
    {
        if(empty($aAuthTypes) || !is_array($aAuthTypes))
            $aAuthTypes = BxDolDb::getInstance()->fromCache('sys_objects_auths', 'getAll', 'SELECT * FROM `sys_objects_auths`');

        $bCompact = getParam('site_login_social_compact') == 'on';

        $aTmplButtons = array();
        foreach($aAuthTypes as $iKey => $aItems) {
            $sTitle = _t($aItems['Title']);

            $aTmplButtons[] = array( 
            	'class' => ($bCompact ? 'sys-auth-compact ' : '') . $aItems['Name'],
                'href' => !empty($aItems['Link']) ? BX_DOL_URL_ROOT . $aItems['Link'] : 'javascript:void(0)',
                'title_alt' => bx_html_attribute($sTitle),
                'bx_if:show_onclick' => array(
                    'condition' => !empty($aItems['OnClick']),
                    'content' => array(
                        'onclick' => 'javascript:' . $aItems['OnClick']
                    )
                ),
                'bx_if:show_icon' => array(
                    'condition' => !empty($aItems['Icon']),
                    'content' => array(
                        'icon' => $aItems['Icon']
                    )
                ),
                'bx_if:show_title' => array(
                    'condition' => !$bCompact || empty($aItems['Icon']),
                    'content' => array(
                		'title' => $sTitle
                    )
                )
            );
            if ($aItems['Style'] != ""){
                $aStyles = unserialize($aItems['Style']);
                foreach($aStyles as $sKey => $aValues) {
                    BxDolTemplate::getInstance()->addCssStyle('.'. $aItems['Name'] .' ' . $sKey, $aValues);
                }
            }
        }

        if(empty($aTmplButtons) || !is_array($aTmplButtons))
            return '';

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->addCss(array('auth.css'));
        return $oTemplate->parseHtmlByName('auth.html', array(
            'bx_repeat:buttons' => $aTmplButtons,
            'class_container' => ($bCompact ? 'sys-auth-compact-container' : '')
        ));
    }

    /**
     * Display login form without join text
     * @see ::serviceLoginForm
     */
    public function serviceLoginFormOnly ($sParams = '', $sForceRelocate = '')
    {
    	if(strpos($sParams, 'no_join_text') === false)
    		$sParams = ($sParams != '' ? ' ' : '') . 'no_join_text';

    	return $this->serviceLoginForm($sParams, $sForceRelocate);
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-login Login
     * @subsubsection bx_system_general-login_form login_form
     * 
     * @code bx_srv('system', 'login_form', ["no_auth_buttons"], 'TemplServiceLogin'); @endcode
     * @code {{~system:login_form:TemplServiceLogin["no_auth_buttons"]~}} @endcode
     * 
     * Display login form
     * @param $sParams optional string with additional params:
     *          - no_join_text
     *          - no_auth_buttons
     *          - ajax_form
     * @param $sForceRelocate optional URL to redirect to after login
     * 
     * @see BxBaseServiceLogin::serviceLoginForm
     */
    /** 
     * @ref bx_system_general-login_form "login_form"
     * @api @ref bx_system_general-login_form "login_form"
     */
    public function serviceLoginForm ($sParams = '', $sForceRelocate = '')
    {
        $bApi = bx_is_api();

        if(isLogged() && 'login' == bx_get('i')) {
            if(!$bApi) {
                header('Location: ' . BX_DOL_URL_ROOT);
                exit;
            } 
            else
                return [
                    ['id' => 2, 'type' => 'redirect', 'data' => ['uri' => '/']],
                ];
        }

        $oPemalink = BxDolPermalinks::getInstance();
        $oForm = BxDolForm::getObjectInstance('sys_login', 'sys_login');

        $sCustomHtmlBefore = '';
        $sCustomHtmlAfter = '';
        /**
         * @hooks
         * @hookdef hook-profile-show_login_form 'profile', 'show_login_form' - hook before dhow login form
         * - $unit_name - equals `profile`
         * - $action - equals `show_login_form` 
         * - $object_id - not used  
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `oForm` - [object] by ref, object of BxDolForm, can be overridden in hook processing
         *      - `sParams` - [string] by ref, paramenters, can be overridden in hook processing
         *      - `sCustomHtmlBefore` - [string] by ref, html before form, can be overridden in hook processing
         *      - `sCustomHtmlAfter` - [string] by ref,  html after form, can be overridden in hook processing
         *      - `aAuthTypes` - [array] by ref,  Auth Types, can be overridden in hook processing
         * @hook @ref hook-account-show_login_form
         */
        bx_alert('profile', 'show_login_form', 0, 0, array(
            'oForm' => &$oForm, 
            'sParams' => &$sParams, 
            'sCustomHtmlBefore' => &$sCustomHtmlBefore, 
            'sCustomHtmlAfter' => &$sCustomHtmlAfter, 
            'aAuthTypes' => &$aAuthTypes,

            'form_inputs_ref' => &$oForm->aInputs, 
            'sParams_ref' => &$sParams, 
            'sCustomHtmlBefore_ref' => &$sCustomHtmlBefore, 
            'sCustomHtmlAfter_ref' => &$sCustomHtmlAfter, 
            'aAuthTypes_ref' => &$aAuthTypes,
        ));

        if (isset($oForm->aInputs['relocate'])) {
            if ($sForceRelocate && 0 === mb_stripos($sForceRelocate, BX_DOL_URL_ROOT))
                $oForm->aInputs['relocate']['value'] = $sForceRelocate;
            elseif ('homepage' == $sForceRelocate)
                $oForm->aInputs['relocate']['value'] = BX_DOL_URL_ROOT;
        }

        if ($bApi) {
            $oForm->initChecker();
            if ($oForm->isSubmittedAndValid()) {
                $oAccount = BxDolAccount::getInstance(trim($oForm->getCleanValue('ID')));
                bx_login($oAccount->id(), $oForm->getRememberMe());
                return [
                    //bx_api_get_block('login', ['session' => BxDolSession::getInstance()->getId()], ['id' => 2]),
                    bx_api_get_block('redirect', ['uri' => '/']),
                    bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => ['request' => ['url' => '/api.php?r=system/login_form/TemplServiceLogin', 'immutable' => true]]]),
                ];
            } 
            else {
                return getParam('sys_account_disable_login_form') ? null : [
                     bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => ['request' => ['url' => '/api.php?r=system/login_form/TemplServiceLogin', 'immutable' => true]]]),
                ];
            }
        }

        $aTmplVarsForm = [];
        if(!(bool)getParam('sys_account_disable_login_form'))
            $aTmplVarsForm['content'] = $oForm->getCode();

        $aTmplVarsAuth = [];
        if(strpos($sParams, 'no_auth_buttons') === false)
            $aTmplVarsAuth['content'] = $this->serviceMemberAuthCode();

        $aTmplVarsJoin = [];
        if(strpos($sParams, 'no_join_text') === false)
            $aTmplVarsJoin['url'] = bx_absolute_url($oPemalink->permalink('page.php?i=create-account'));

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->addJs(array('jquery.form.min.js'));        
        return $oTemplate->parseHtmlByName('block_login.html', [
            'custom_html_before' => $sCustomHtmlBefore,
            'bx_if:show_auth' => [
                'condition' => !empty($aTmplVarsAuth),
                'content' => $aTmplVarsAuth
            ],
            'bx_if:show_form' => [
                'condition' => !empty($aTmplVarsForm),
                'content' => $aTmplVarsForm,
            ],
            'custom_html_after' => $sCustomHtmlAfter,
            'bx_if:show_join' => [
                'condition' => !empty($aTmplVarsJoin),
                'content' => $aTmplVarsJoin
            ],
            'agreement' => _t('_sys_form_login_input_agreement_value', bx_absolute_url($oPemalink->permalink('page.php?i=terms')), bx_absolute_url($oPemalink->permalink('page.php?i=privacy'))),
            'bx_if:show_js_code' => [
                'condition' => strpos($sParams, 'ajax_form') !== false,
                'content' => []
            ]
        ]);

    }
    
    public function serviceLoginFormStep2 ()
    {
        if(isLogged()){
            header('Location: ' . BX_DOL_URL_ROOT);
            exit;
        }

        $oSession = BxDolSession::getInstance();
        $iAccountId = $oSession->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID);
        if ($iAccountId == '')
            return false;

        $oForm = BxDolForm::getObjectInstance('sys_login', 'sys_login_step2');
        $oForm->aFormAttrs['action'] = '';
        
        $oAccount = BxDolAccount::getInstance($iAccountId);
        $a = $oAccount ? $oAccount->getInfo() : false;
        if (empty($a))
            return false;

        // A new code shares the count of tries of the earlier ones. If those are used up, or the count expires
        // before a new code would, the sign-in starts over: an SMS with a code that can't be tried isn't sent.
        $sAttemptsKey = $this->_get2faAttemptsKey();
        if ($sAttemptsKey === false) {
            self::reset2faLogin();
            return MsgBox(_t('_sys_form_login_input_code_error_restart', bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=login'))));
        }

        // An account with a phone gets the code there: whoever knows only the password can't send it to another phone.
        // An account without one names a phone here, and it becomes the account's once the code sent to it is entered.
        $sPhoneNumber = trim($a['phone']);
        if ($sPhoneNumber !== '')
            $oForm->aInputs['phone'] = array_merge($oForm->aInputs['phone'], [
                'type' => 'value',
                'value' => $this->_getPhoneMasked($sPhoneNumber),
                'info' => '',
                'required' => false,
            ]);

        $oForm->initChecker();
        if ($oForm->isSubmittedAndValid()) {
            $sNewPhoneNumber = $sPhoneNumber === '' ? trim($oForm->getCleanValue('phone')) : '';
            $sSendTo = $sPhoneNumber !== '' ? $sPhoneNumber : $sNewPhoneNumber;
            $sActivationCode = (string)random_int(100000, 999999);
            $sActivationText =_t('_sys_txt_login_2fa_sms_text', $sActivationCode);

            $mixedOverrideResult = null;
            /**
             * @hooks
             * @hookdef hook-account-before_2fa_send_sms 'account', 'before_2fa_send_sms' - hook before the SMS with the code of two-factor login is sent
             * - $unit_name - equals `system`
             * - $action - equals `before_2fa_send_sms` 
             * - $object_id - account id 
             * - $sender_id - not used 
             * - $extra_params - array of additional params with the following array keys:
             *      - `phone_number` - [string] by ref, the phone the SMS goes to, can be overridden in hook processing
             *      - `sms_text` - [string] by ref, the text of the SMS with the code, can be overridden in hook processing
             *      - `override_result` - [mixed] by ref, set it to send the SMS yourself: the system then doesn't send it
             * @hook @ref hook-account-before_2fa_send_sms
             */
            bx_alert('account', 'before_2fa_send_sms', $oAccount->id(), false, [
                'phone_number' => &$sSendTo,
                'sms_text' => &$sActivationText, 

                'phone_number_ref' => &$sSendTo,
                'sms_text_ref' => &$sActivationText, 

                'override_result' => &$mixedOverrideResult
            ]);

            if($mixedOverrideResult === null && ($oSms = BxDolSms::getObjectInstance()) !== false && !$oSms->send($sSendTo, $sActivationText))
                return MsgBox(_t('_sys_txt_login_2fa_sms_error_occured'));

            // A new code keeps the count of tried ones: asking for codes again gives no more guesses.
            // A new phone is saved as the one the code went to, which the hook above may have changed.
            $oSession->setValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_CODE, [
                'code' => $sActivationCode,
                'phone' => $sNewPhoneNumber !== '' ? trim((string)$sSendTo) : '',
                'expires' => time() + BX_ACCOUNT_2FA_LOGIN_CODE_LIFETIME,
                'attempts_key' => $sAttemptsKey !== '' ? $sAttemptsKey : (string)BxDolKey::getInstance()->getNewCounterKey(BX_ACCOUNT_2FA_LOGIN_ATTEMPTS_LIFETIME),
            ]);
            header('Location: ' . bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=login-step3')));
        }

        return '<div class="bx-def-padding-sec-bottom">' . _t($sPhoneNumber !== '' ? '_sys_txt_login_2fa_description_phone' : '_sys_txt_login_2fa_description') . '</div>' .$oForm->getCode();
    }
    
    public function serviceLoginFormStep3 ()
    {
        if(isLogged()){
            header('Location: ' . BX_DOL_URL_ROOT);
            exit;
        }
        
        $oForm = BxDolForm::getObjectInstance('sys_login', 'sys_login_step3');
        $oForm->aInputs['back']['caption'] = _t( $oForm->aInputs['back']['caption_src'], bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=login-step2')));
        $oForm->aFormAttrs['action'] = '';
        $oForm->initChecker();
        
        // The code checker (BxFormLoginCheckerHelper::checkCodeExist) has checked the account and the code from the session.
        if ($oForm->isSubmittedAndValid()) {
            $oSession = BxDolSession::getInstance();
            $aCode = $oSession->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_CODE);
            $oAccount = BxDolAccount::getInstance($oSession->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID));
            $bRememberMe = $oSession->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_IS_REMEMBER);
            self::reset2faLogin();

            // The phone the code was sent to is the account's from now on, unless another account
            // has taken it since the code was sent, even at the same moment: one phone belongs to one account.
            if (!empty($aCode['phone']))
                $oAccount->updatePhone($aCode['phone'], false, true);

            $aAccount = bx_login($oAccount->id(), $bRememberMe);
           
            $sUrlRelocate = $oForm->getCleanValue('relocate');
            if (!$sUrlRelocate || 0 !== strncmp($sUrlRelocate, BX_DOL_URL_ROOT, strlen(BX_DOL_URL_ROOT)))
                $sUrlRelocate = BX_DOL_ROLE_ADMIN == $oForm->getRole() ? BX_DOL_URL_STUDIO . 'launcher.php' : BX_DOL_URL_ROOT . 'member.php';

            /**
             * @hooks
             * @hookdef hook-account-login_after 'account', 'login_after' - hook on after login to rewrite url for redirect after login
             * - $unit_name - equals `account`
             * - $action - equals `login_after` 
             * - $object_id - account id 
             * - $sender_id - not used 
             * - $extra_params - array of additional params with the following array keys:
             *      - `account` - [array] contains account info from $oAccount->getInfo()
             *      - `url_relocate` - [string] by ref, rl for redirect after login, can be overridden in hook processing
             * @hook @ref hook-account-login_after
             */
            bx_alert('account', 'login_after', $oAccount->id(),  false, array(
                'account' => $aAccount,
                'url_relocate' => &$sUrlRelocate,
                'url_relocate_ref' => &$sUrlRelocate,
            ));

            BxDolTemplate::getInstance()->setPageNameIndex (BX_PAGE_TRANSITION);
            BxDolTemplate::getInstance()->setPageHeader (_t('_Please Wait'));
            BxDolTemplate::getInstance()->setPageContent ('page_main_code', MsgBox(_t('_Please Wait')));
            BxDolTemplate::getInstance()->setPageContent ('url_relocate', bx_html_attribute($sUrlRelocate, BX_ESCAPE_STR_QUOTE));
            
            header('Location: ' . $sUrlRelocate);
        } 
        return $oForm->getCode();
    }

    /**
     * Forget the two-factor login in progress: the next try starts over from the password.
     */
    public static function reset2faLogin()
    {
        // The count of tries stays in sys_keys until it expires: a request that read the session before
        // this one still can't try a code more times than the count allows, and a right code sent twice signs in.
        $oSession = BxDolSession::getInstance();
        foreach ([BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_CODE, BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID, BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_IS_REMEMBER] as $sKey)
            $oSession->unsetValue($sKey);
    }

    /**
     * The count of tries that a new code of the two-factor login in progress shares with the earlier ones:
     * '' when there is none yet, false when it's used up or expires before a new code would.
     */
    protected function _get2faAttemptsKey()
    {
        $aCode = BxDolSession::getInstance()->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_CODE);
        if (!is_array($aCode) || empty($aCode['attempts_key']))
            return '';

        return BxDolKey::getInstance()->canUseCounterKey($aCode['attempts_key'], BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS, BX_ACCOUNT_2FA_LOGIN_CODE_LIFETIME) ? $aCode['attempts_key'] : false;
    }

    /**
     * Phone number with all digits but the last two hidden, for showing where a code goes.
     */
    protected function _getPhoneMasked($sPhone)
    {
        return htmlspecialchars(preg_replace('/\d(?=(?:\D*\d){2})/u', '•', $sPhone));
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-login Login
     * @subsubsection bx_system_general-logout logout
     * 
     * @code bx_srv('system', 'logout', [], 'TemplServiceLogin'); @endcode
     * 
     * Logout
     * 
     * @see BxBaseServiceLogin::serviceLogout
     */
    /** 
     * @ref bx_system_general-logout "logout"
     * @api @ref bx_system_general-logout "logout"
     */
    public function serviceLogout ()
    {
        bx_logout();

        if (bx_is_api()) {
            return [
                bx_api_get_block('logout', ['uri' => '/'])
            ];
        }
        else {
            header("Location: " . BX_DOL_URL_ROOT);
        }
        
        return true;
    }
}

/** @} */

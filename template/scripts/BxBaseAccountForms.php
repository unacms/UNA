<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System profile(account) forms functions
 * @see BxDolProfileForms
 */
class BxBaseAccountForms extends BxDolProfileForms
{
    protected $_iProfileId;

    static public $PROFILE_FIELDS = array();

    public function __construct()
    {
        parent::__construct();
        $this->_iProfileId = bx_get_logged_profile_id();
    }

    public function getObjectFormAdd ()
    {
        $oForm = BxDolForm::getObjectInstance('sys_account', 'sys_account_create');

        /**
         * @hooks
         * @hookdef hook-account-add_form_get 'account', 'add_form_get' - hook in get some account form
         * - $unit_name - equals `account`
         * - $action - equals `add_form_get` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `form_object` - [object] by ref, form object, can be overridden in hook processing
         * @hook @ref hook-account-add_form_get
         */
        bx_alert('account', 'add_form_get', 0, 0, [
            'form_object' => &$oForm,
            'form_inputs_ref' => &$oForm->aInputs,
        ]);

        return $oForm;
    }

    public function getObjectFormEdit ()
    {
        return BxDolForm::getObjectInstance('sys_account', 'sys_account_settings_info');
    }

    public function getObjectFormDelete ()
    {
        return BxDolForm::getObjectInstance('sys_account', 'sys_account_settings_del_account');
    }

    public function createAccountForm ($aParams = array())
    {
        $bIsApi = bx_is_api();

        // nobody can join (Studio > Settings > Account > Who can join): no form, and a submitted one isn't taken
        if (BxDolAccount::getJoinMode() == BxDolAccount::JOIN_CLOSED)
            return MsgBox(_t('_sys_txt_join_closed'));

        // check access
        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = BxDolAccount::isAllowedCreate (0)))
            return MsgBox($sMsg);

        // check and display form
        $oForm = $this->getObjectFormAdd ();
        if (!$oForm)
            return MsgBox(_t('_sys_txt_error_occured'));

        $oForm->aFormAttrs['action'] = !empty($aParams['action']) ? $aParams['action'] : bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=create-account'));
        $oForm->initChecker(self::$PROFILE_FIELDS);

        /**
         * @hooks
         * @hookdef hook-account-add_form_check 'account', 'add_form_check' - hook in  some account form after check
         * - $unit_name - equals `account`
         * - $action - equals `add_form_check` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `form_object` - [object] by ref, form object, can be overridden in hook processing
         * @hook @ref hook-account-add_form_check
         */
        bx_alert('account', 'add_form_check', 0, 0, array(
            'form_object' => &$oForm,
            'form_inputs_ref' => &$oForm->aInputs,
        ));

        if (!$oForm->isSubmittedAndValid()) {
            
            $sCode = !$bIsApi ? $oForm->getCode() : ''; // the API returns getCodeAPI below
            $aCodeApi = [];

            /**
             * @hooks
             * @hookdef hook-account-add_form 'account', 'add_form' - hook in  some account form after check
             * - $unit_name - equals `account`
             * - $action - equals `add_form` 
             * - $object_id - not used 
             * - $sender_id - not used 
             * - $extra_params - array of additional params with the following array keys:
             *      - `form_object` - [object] by ref, form object, can be overridden in hook processing
             *      - `form_code` - [string] by ref, html for form, can be overridden in hook processing
             *      - `form_code_api` - [array] by ref, API blocks returned instead of the form when `form_object` is set to false, can be overridden in hook processing
             * @hook @ref hook-account-add_form
             */
            bx_alert('account', 'add_form', 0, 0, array(
                    'form_object' => &$oForm,
                    'form_inputs_ref' => &$oForm->aInputs,
                    'form_code' => &$sCode,
                    'form_code_ref' => &$sCode,
                    'form_code_api' => &$aCodeApi,
                    'form_code_api_ref' => &$aCodeApi,
            ));
            
            if($bIsApi){
                if (!$oForm)
                    return !empty($aCodeApi) ? $aCodeApi : false;
                return $oForm->getCodeAPI();
            }

            return $sCode;
        }

        // insert data into database
        $aValsToAdd = array (
            'email_confirmed' => 0,
        );
        $iAccountId = $oForm->insert ($aValsToAdd);
        if (!$iAccountId) {
            if (!$oForm->isValid())
                return $bIsApi ? $oForm->getCodeAPI() : $oForm->getCode();
            else
                return MsgBox(_t('_sys_txt_error_account_creation'));
        }

        $iProfileId = $this->onAccountCreated($iAccountId, $oForm->isSetPendingApproval());

        if(($sField = 'picture') && isset($oForm->aInputs[$sField]))
            $oForm->processFiles($sField, $iAccountId, true);

        // perform action
        BxDolAccount::isAllowedCreate ($iProfileId, true);

        $this->_iProfileId = bx_get_logged_profile_id();

        $sRelocateCustom = $oForm->getCleanValue('relocate');
        $bRelocateCustom = !empty($sRelocateCustom);

        // check and redirect
        $aModulesProfile = bx_srv('system', 'get_modules_by_type', ['profile']);

        if(count($aModulesProfile) == 1)
            $sProfileModule = reset($aModulesProfile)['name'];
        else if(($sDefaultProfileType = getParam('sys_account_default_profile_type')) !== '') 
            $sProfileModule = $sDefaultProfileType;

        if(!empty($sProfileModule) && getParam('sys_account_auto_profile_creation') == 'on') {
            $aProfileFields = BxDolService::call($sProfileModule, 'prepare_fields', [[
                'author' => $iProfileId,
                'name' => BxDolAccount::getInstance($iAccountId)->getDisplayName(),
            ]]);

            $a = BxDolService::call($sProfileModule, 'entity_add_forcedly', [$iProfileId, $aProfileFields]);

            // in case of successful profile add redirect to the page after profile creation
            if (0 == $a['code'] && !$bIsApi) {
                if($bRelocateCustom)
                    $this->_redirectAndExit($sRelocateCustom, false);

                BxDolService::call($sProfileModule, 'redirect_after_add', array($a['content']));
                return;
            }
            // if creation failed, redirect to create profile form
        }
        
        if($bIsApi) 
            return true;

        $sRelocate = !empty($sProfileModule) ? BxDolService::call($sProfileModule, 'profile_create_url', array(false)) : '';
        if(empty($sRelocate))
            $sRelocate = $bRelocateCustom ? $sRelocateCustom : getParam('sys_redirect_after_account_added');
    
        $this->_redirectAndExit($sRelocate, true, array(
            'account_id' => $iAccountId,
            'profile_id' => $iProfileId,
        ));

    }

    public function createAccount ($aValues, $iAction = BX_PROFILE_ACTION_MANUAL, $bNeedToLogin = true)
    {
        $oForm = $this->getObjectFormAdd ();
        if (!$oForm)
            return array('code' => 500, 'error' => _t('_sys_txt_error_occured'));

        if (empty($aValues['email']))
            return array('code' => 500, 'error' => _t('_Incorrect Email'));

        if (BxDolAccount::getInstance($aValues['email']))
            return array('code' => 500, 'error' => _t('_sys_form_account_input_email_uniq_error_loggedin'));

        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
 
        $oForm->initChecker(array(), $aValues);

        $iAccountId = $oForm->insert ([]);
        if (!$iAccountId)
            return array('code' => 500, 'error' => _t('_sys_txt_error_account_creation'));

        $iProfileId = $this->onAccountCreated($iAccountId, $oForm->isSetPendingApproval(), $iAction, $bNeedToLogin);

        return [
            'account_id' => $iAccountId,
            'profile_id' => $iProfileId,
        ];
    }

    public function onAccountCreated ($iAccountId, $isSetPendingApproval, $iAction = BX_PROFILE_ACTION_MANUAL, $bNeedToLogin = true)
    {
        bx_alert('account', 'add', $iAccountId);

        // if email_confirmation procedure is enabled - send email confirmation letter
        $oAccount = BxDolAccount::getInstance($iAccountId);
        if (BxDolAccount::isNeedConfirmEmail() && $oAccount && !$oAccount->isConfirmedEmail())
            $oAccount->sendConfirmationEmail($iAccountId);

        // add account and content association
        $iProfileId = BxDolProfile::add(BX_PROFILE_ACTION_MANUAL, $iAccountId, $iAccountId, BX_PROFILE_STATUS_PENDING, 'system');
        $oProfile = BxDolProfile::getInstance($iProfileId);

        // approve profile if auto-approval is enabled and profile status is 'pending'
        $sStatus = $oProfile->getStatus();
        $isAutoApprove = !$isSetPendingApproval;
        if ($sStatus == BX_PROFILE_STATUS_PENDING && $isAutoApprove)
            $oProfile->approve(BX_PROFILE_ACTION_AUTO, $iProfileId, false);

        /**
         * @hooks
         * @hookdef hook-account-added 'account', 'added' - hook on new account created
         * - $unit_name - equals `system`
         * - $action - equals `added` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - not used
         * @hook @ref hook-account-added
         */
        bx_alert('account', 'added', $iAccountId);

        // login to the created account automatically
        if ($bNeedToLogin)
            bx_login($iAccountId, bx_is_remember_me());

        return $iProfileId;
    }

    public function editAccountEmailSettingsForm ($iAccountId)
    {
        return $this->_editAccountForm ($iAccountId, 'sys_account_settings_email');
    }

    public function editAccountPasswordSettingsForm ($iAccountId)
    {
        return $this->_editAccountForm ($iAccountId, 'sys_account_settings_pwd');
    }

    public function editAccountInfoForm ($iAccountId)
    {
        return $this->_editAccountForm ($iAccountId, 'sys_account_settings_info');
    }

    public function deleteAccountForm ($iAccountId)
    {
        $bIsApi = bx_is_api();
        $oAccount = BxDolAccount::getInstance($iAccountId);
        $aAccountInfo = $oAccount ? $oAccount->getInfo() : false;
        if (!$aAccountInfo)
            return $bIsApi ? _t('_sys_txt_error_account_is_not_defined') : MsgBox(_t('_sys_txt_error_account_is_not_defined'));

        // check access
        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = BxDolAccount::isAllowedDelete ($this->_iProfileId, $aAccountInfo)))
            return $bIsApi ? $sMsg : MsgBox($sMsg);

        // check and display form
        $oForm = $this->getObjectFormDelete();
        if(bx_get('content') !== false) {
            $oForm->aInputs['delete_content']['value'] = (int)bx_get('content');
            if(!$oForm->aInputs['delete_content']['value'])
                $oForm->aInputs['delete_confirm']['caption'] = _t('_sys_form_account_input_delete_confirm_wo_content');
        }

        if (!$oForm)
            return $bIsApi ? _t('_sys_txt_error_occured') : MsgBox(_t('_sys_txt_error_occured'));

        if (!$oForm->isSubmitted())
            unset($aAccountInfo['password']);

        $oForm->initChecker($aAccountInfo);
        if (!$oForm->isSubmittedAndValid())
            return $bIsApi ? $oForm->getCodeAPI() : $oForm->getCode();

        // delete account
        if (($oAccount = BxDolAccount::getInstance($aAccountInfo['id'])) !== false && !$oAccount->delete(false === bx_get('delete_content') ? true : (int)$oForm->getCleanValue('delete_content') != 0, true))
            return $bIsApi ? _t('_sys_txt_error_account_delete') : MsgBox(_t('_sys_txt_error_account_delete'));

        // logout from deleted account
        if ($iAccountId == getLoggedId())
            bx_logout();

        // redirect to homepage (API: /logout clears client session, then goes home)
        if($bIsApi)
            return [
                ['id' => 1, 'type' => 'redirect', 'data' => ['uri' => '/logout']],
            ];

        $this->_redirectAndExit('', false);
    }

    protected function _editAccountForm ($iAccountId, $sDisplayName)
    {
        $bIsApi = bx_is_api();
        
        $oAccount = BxDolAccount::getInstance($iAccountId);
        $aAccountInfo = $oAccount ? $oAccount->getInfo() : false;
        if (!$aAccountInfo)
            return ($sLKey = '_sys_txt_error_account_is_not_defined') && $bIsApi ? _t($sLKey) : MsgBox(_t($sLKey));

        // check access
        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = BxDolAccount::isAllowedEdit ($this->_iProfileId, $aAccountInfo)))
            return $bIsApi ? $sMsg : MsgBox($sMsg);

        // check and display form
        $oForm = BxDolForm::getObjectInstance('sys_account', $sDisplayName);
        if (!$oForm)
            return $bIsApi ? _t('_sys_txt_error_occured') : MsgBox(_t('_sys_txt_error_occured'));

        if (!$oForm->isSubmitted())
            unset($aAccountInfo['password']);

        $oForm->initChecker($aAccountInfo);

        if (!$oForm->isSubmittedAndValid()) {
            $this->_setEmailPendingInfo($oForm, $oAccount);
            return $bIsApi ? $oForm->getCodeAPI() : $oForm->getCode();
        }

        $aTrackTextFieldsChanges = array (); // track text fields changes, not-null(for example empty array) - means track, null - means don't track

        /*
         * A confirmed email stays the account's email, for signing in and password recovery, until the new
         * address is confirmed: the new one waits in `email_pending`, and the profile stays visible meanwhile.
         * Saving the current email again cancels a pending change.
         */
        $aValsToAdd = array();
        $sEmailNew = isset($oForm->aInputs['email']) ? trim((string)$oForm->getCleanValue('email')) : '';
        $bEmailChanged = $sEmailNew !== '' && $sEmailNew != $aAccountInfo['email'];
        $bEmailPending = $bEmailChanged && $aAccountInfo['email_confirmed'] && BxDolAccount::isNeedConfirmEmail();
        if ($bEmailPending)
            $aValsToAdd['email'] = $aAccountInfo['email'];

        // update email and email setting in DB; saving the same values again changes no rows, and that is no error
        if (false === $oForm->update ($aAccountInfo['id'], $aValsToAdd, $aTrackTextFieldsChanges)) {
            if (!$oForm->isValid())
                return $bIsApi ? $oForm->getCodeAPI() : $oForm->getCode();
            else
                return $bIsApi ? _t('_sys_txt_error_account_update') : MsgBox(_t('_sys_txt_error_account_update'));
        }

        if(($sField = 'picture') && isset($oForm->aInputs[$sField]))
            $oForm->processFiles($sField, $iAccountId, false);

        // check if email was changed
        $sMsgEmail = '';
        $oAccount = BxDolAccount::getInstance($iAccountId, true); // refresh account to clear cache
        if ($bEmailPending) {
            $sMsgEmail = $oAccount->requestEmailChange($sEmailNew) ? _t('_sys_txt_account_email_change_sent', bx_process_output($sEmailNew), bx_process_output($aAccountInfo['email'])) : _t('_sys_txt_confirm_email_sent_failed');
        }
        else if ($bEmailChanged) {
            $oAccount->cancelEmailChange();
            $oAccount->sendEmailChangeNotice('t_EmailChanged', $aAccountInfo['email'], ['new_email' => $sEmailNew]);
            $oAccount->updateEmailConfirmed(false);  // mark the new email as unconfirmed, the confirmation goes to it
        }
        else if (isset($oForm->aInputs['email']) && $oAccount->getEmailPending()) {
            $oAccount->cancelEmailChange(); // the current email was saved again
        }

        // check if password was changed
        if ($oForm->getCleanValue('password')) {
            // relogin with new password
            bx_alert('account', 'edited', $aAccountInfo['id'], $aAccountInfo['id'], array('action' => 'change_password'));
            bx_logout();
            bx_login($aAccountInfo['id'], bx_is_remember_me());
            bx_end_other_sessions($aAccountInfo['id']);

            $oAccount->sendPasswordChangedNotice();
        }

        // check if other text info was changed - if auto-appproval is off
        $isAutoApprove = $oForm->isSetPendingApproval() ? false : true;
        if (!$isAutoApprove) {
            $oProfile = BxDolProfile::getInstanceAccountProfile($aAccountInfo['id']); // get profile associated with account, not current porfile
            $aProfileInfo = $oProfile->getInfo();
            if (!empty($aTrackTextFieldsChanges['changed_fields'])) // email confirmation is automatic and separate, don't need to deactivate whole profile if email is changed
                $aTrackTextFieldsChanges['changed_fields'] = array_values(array_diff($aTrackTextFieldsChanges['changed_fields'], ['email']));
            if (BX_PROFILE_STATUS_ACTIVE == $aProfileInfo['status'] && !empty($aTrackTextFieldsChanges['changed_fields']))
                $oProfile->disapprove(BX_PROFILE_ACTION_AUTO);  // change profile to 'pending' only if some text fields were changed and profile is active
        }

        
        bx_alert('account', 'edited', $aAccountInfo['id'], $aAccountInfo['id'], array('display' => $sDisplayName));

        // the form shows what is saved now: the current email with the pending one, and empty password fields
        foreach ($oForm->aInputs as $sKey => $aInput)
            if (isset($aInput['type']) && 'password' == $aInput['type'])
                $oForm->aInputs[$sKey]['value'] = '';
        if (isset($oForm->aInputs['email'])) {
            $oForm->aInputs['email']['value'] = $oAccount->getEmail();
            $this->_setEmailPendingInfo($oForm, $oAccount);
        }

        // display result message
        $sMsgText = $sMsgEmail ? $sMsgEmail : _t('_' . $sDisplayName . '_successfully_submitted');

        if ($bIsApi)
            return ['form' => $oForm->getCodeAPI(), 'msg' => $sMsgText];

        return MsgBox($sMsgText) . $oForm->getCode();
    }

    /**
     * Say under the email field which new address waits for its confirmation.
     */
    protected function _setEmailPendingInfo(&$oForm, $oAccount)
    {
        if (!isset($oForm->aInputs['email']) || !$oAccount || !($sEmailPending = $oAccount->getEmailPending()))
            return;

        $oForm->aInputs['email']['info'] = _t('_sys_form_account_input_email_info_pending', bx_process_output($sEmailPending));
    }     
}

/** @} */

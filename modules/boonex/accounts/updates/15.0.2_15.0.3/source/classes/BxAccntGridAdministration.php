<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Accounts Accounts
 * @ingroup     UnaModules
 * 
 * @{
 */

class BxAccntGridAdministration extends BxBaseModProfileGridAdministration
{
    protected $_sFilter2Name;
    protected $_sFilter2Value;
    protected $_aFilter2Values;

    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_accounts';

        parent::__construct ($aOptions, $oTemplate);

        $this->_sPaginateType = 'load_more';
        $this->_bDeleteWithBgJobs = true;

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_aFilter1Values = array_merge($this->_aFilter1Values, array(
            'unconfirmed' => $CNF['T']['filter_item_unconfirmed'],
            'locked' => $CNF['T']['filter_item_locked'],
            'without_profile' => $CNF['T']['filter_item_without_profile'],
        ));

        $this->_sFilter2Name = 'filter2';
        $this->_aFilter2Values = array(
            'operators' => $CNF['T']['filter_item_operators']
        );

        $sFilter2 = bx_get($this->_sFilter2Name);
        if(!empty($sFilter2)) {
            $this->_sFilter2Value = bx_process_input($sFilter2);
            $this->_aQueryAppend[$this->_sFilter2Name] = $this->_sFilter2Value;
        }
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if(strpos($sFilter, $this->_sParamsDivider) !== false)
            list($this->_sFilter1Value, $this->_sFilter2Value, $sFilter) = explode($this->_sParamsDivider, $sFilter);

        $sSelectClause = $sJoinClause = '';
        if($this->_oModule->_oConfig->isLastActiveSorting()) {
            $sSelectClause = ', `ts`.`date` AS `last_active`';
            $sJoinClause = ' LEFT JOIN `sys_sessions` AS `ts` ON `ts`.`id` = (SELECT `id` FROM `sys_sessions` WHERE `user_id`=`ta`.`id` ORDER BY `date` DESC LIMIT 1)';
        }

        $this->_aOptions['source'] = bx_replace_markers($this->_aOptions['source'], [
            'select' => $sSelectClause,
            'join' => $sJoinClause
        ]);

    	if(!empty($this->_sFilter1Value))
            switch($this->_sFilter1Value) {
                case 'unconfirmed':
                    $sCnfnType = getParam('sys_account_confirmation_type');
                    switch($sCnfnType) {
                        case 'email':
                            $this->_aOptions['source'] .= " AND `ta`.`email_confirmed`='0'";
                            break;
                        case 'phone':
                            $this->_aOptions['source'] .= " AND `ta`.`phone_confirmed`='0'";
                            break;
                        case 'email_and_phone':
                            $this->_aOptions['source'] .= " AND (`ta`.`email_confirmed`='0' OR `ta`.`phone_confirmed`='0')";
                            break;
                        case 'email_or_phone':
                            $this->_aOptions['source'] .= " AND (`ta`.`email_confirmed`='0' AND `ta`.`phone_confirmed`='0')";
                            break;
                    }
                    break;

                case 'locked':
                    $this->_aOptions['source'] .= " AND `ta`.`locked` = 1";
                    break;
                
                case 'without_profile':
                    $this->_aOptions['source'] .= " AND `ta`.`id` NOT IN (SELECT `account_id` FROM `sys_profiles` WHERE `type` <> 'system')";
                    break;

                default:
        	        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tp`.`status`=?", $this->_sFilter1Value);
            }

        if(!empty($this->_sFilter2Value))
        	$this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `ta`.`role` & " . BX_DOL_ROLE_ADMIN ." = " . BX_DOL_ROLE_ADMIN);

        $this->_aOptions['source'] .= " AND `ta`.`email` <> '' ";
        
        return parent::_getDataSqlInner($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
    
    protected function _getFilterControls()
    {
        parent::_getFilterControls();

        return  $this->_getFilterSelectOne($this->_sFilter1Name, $this->_sFilter1Value, $this->_aFilter1Values) . $this->_getFilterSelectOne($this->_sFilter2Name, $this->_sFilter2Value, $this->_aFilter2Values) . $this->_getSearchInput();
    }
    
    public function getCode($isDisplayHeader = true)
    {
        return $this->_oModule->_oTemplate->getJsCode('main', array(
        	'aHtmlIds' => $this->_oModule->_oConfig->getHtmlIds()
        )) . parent::getCode($isDisplayHeader);
    }

    public function performActionActivate()
    {
    	$this->_performActionEnable(true);
    }

	public function performActionSuspend()
    {
    	$this->_performActionEnable(false);
    }

    public function performActionEditEmail()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId)
                return echoJson(array());

            $aIds = array($iId);
        }

        $iId = $aIds[0];
        $oAccount = BxDolAccount::getInstance($iId);
        if(!$oAccount)
            return echoJson(array());

        $aAccount = $oAccount->getInfo();
        $sAction = 'edit_email';

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ACCOUNT'], $CNF['OBJECT_FORM_ACCOUNT_DISPLAY_SETTINGS_EMAIL']);
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction . '&id=' . $iId;
        $oForm->initChecker($aAccount);

        if($oForm->isSubmittedAndValid()) {
            $sEmail = $oForm->getCleanValue('email');
            if(strcmp($aAccount['email'], $sEmail) !== 0 && BxDolAccountQuery::getInstance()->getIdByEmail($sEmail))
                return echoJson(array('msg' => _t('_sys_form_account_input_email_uniq_error_loggedin')));

            if($oForm->update($aAccount['id'])) {
                bx_alert('account', 'edited', $aAccount['id'], BxDolAccount::getInstance()->id(), array('display' => $CNF['OBJECT_FORM_ACCOUNT_DISPLAY_SETTINGS_EMAIL']));

                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
                
                $oAccount->doAudit($iId, '_sys_audit_action_account_email_changed', array('old_email' => $oAccount->getEmail(), 'new_email' => $sEmail));
            }
            else
                $aRes = array('msg' => _t('_sys_txt_error_account_update'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('bx-account-edit-email-popup', _t('_bx_accounts_form_display_account_settings_email_popup'), $this->_oModule->_oTemplate->parseHtmlByName('edit_email.html', array(
                'form_id' => $oForm->id,
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));

            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }
	
    public function performActionSendMessage()
    {
        $sAction = 'send_message';
		
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return echoJson(array());
		
        $oForm = BxDolForm::getObjectInstance('bx_accounts_account', 'bx_accounts_send_test');
        if (!$oForm)
            return '';
		
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . 'grid.php?' . bx_encode_url_params($_GET, array('_r'));
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $aIdsAffected = array();
                foreach($aIds as $iId) {
                    if(sendMail(BxDolAccount::getInstance()->getEmail($iId), $oForm->getCleanValue('message_subject'), $oForm->getCleanValue('message_text'), 0, [], BX_EMAIL_MASS, 'text', false, ['From' => "=?UTF-8?B?" . base64_encode(getParam('site_title')) . "?= <" . getParam('site_email_notify') . ">"], false)){
                        $aIdsAffected[] = $iId;
                    }	
                }

            echoJson(count($aIdsAffected) > 0 ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t($CNF['T']['grid_action_err_perform'])));
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('bx-account-send-message', _t('_bx_accounts_form_display_account_send_message'), $this->_oModule->_oTemplate->parseHtmlByName('manage_item.html', array(
                'form_id' => $oForm->id,
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));
            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }
    
    public function performActionAdd()
    {
      
        $CNF = &$this->_oModule->_oConfig->CNF;
        $sAction = 'add';
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ACCOUNT'], $CNF['OBJECT_FORM_ACCOUNT_DISPLAY_CREATE']);
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction;
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
           
            $iAccountId = $oForm->insert();
            
            if (!$iAccountId) {
                $aRes = array('msg' => _t('_sys_txt_error_account_insert'));
            }
            else{
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iAccountId);
                
                $oBxTemplAccountForms = new BxTemplAccountForms();
                
                $iProfileId = $oBxTemplAccountForms->onAccountCreated($iAccountId, $oForm->isSetPendingApproval(), BX_PROFILE_ACTION_MANUAL, false);

                // perform action
                BxDolAccount::isAllowedCreate ($iProfileId, true);

                // check
                $aModulesProfile = bx_srv('system', 'get_modules_by_type', ['profile']);

                if(count($aModulesProfile) == 1)
                    $sProfileModule = reset($aModulesProfile)['name'];
                else if(($sDefaultProfileType = getParam('sys_account_default_profile_type')) !== '') 
                    $sProfileModule = $sDefaultProfileType;

                if(!empty($sProfileModule) && getParam('sys_account_auto_profile_creation') == 'on') {
                    $aProfileFields = bx_srv($sProfileModule, 'prepare_fields', [[
                        'author' => $iProfileId,
                        'name' => BxDolAccount::getInstance($iAccountId)->getDisplayName(),
                    ]]);

                    $a = bx_srv($sProfileModule, 'entity_add_forcedly', [$iProfileId, $aProfileFields]);
                    if(isset($a['content']['profile_id']) && (int)$a['content']['profile_id'] > 0)
                        BxDolAcl::getInstance()->setMembership((int)$a['content']['profile_id'], MEMBERSHIP_ID_STANDARD);

                    echoJson($aRes);
                }
            }
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('bx-account-edit-email-popup', _t('_bx_accounts_form_display_account_create_popup'), $this->_oModule->_oTemplate->parseHtmlByName('create.html', array(
                'form_id' => $oForm->id,
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));

            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }

    public function performActionExport()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aFields = explode(',', getParam($CNF['PARAM_EXPORT_FIELDS']));
        if(empty($aFields) || !is_array($aFields))
            return echoJson(array());

        
        $aTitles = $aConverters = array();
        foreach($aFields as $sField) {
            $aTitles[$sField] = _t('_bx_accnt_txt_field_' . $sField);
            
            $sConverter = '_exportFieldConverter' . bx_gen_method_name($sField);
            if(method_exists($this, $sConverter))
                $aConverters[$sField] = $sConverter;
        }

        $sMethod = '_exportTo' . bx_gen_method_name(getParam($CNF['PARAM_EXPORT_TO']));
        if(!method_exists($this, $sMethod))
            return echoJson(array());

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            $aIds = $this->_oModule->_oDb->getAccountIds();

        if(($aFile = $this->$sMethod($aIds, $aFields, $aTitles, $aConverters)) === false)
            return echoJson(array());

        list($sFilePath, $sFileUrl) = $aFile;

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE_FILES']);
        if($oStorage && ($iFileId = $oStorage->storeFileFromPath($sFilePath, true, bx_get_logged_profile_id())) !== false) {
            $sFileUrl = $oStorage->getFileUrlById($iFileId);

            @unlink($sFilePath);
        }

        return echoJson(array('redirect' => $sFileUrl));
    }
    
    public function performActionConfirm()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

    	$aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return echoJson(array());

        $oAccount = BxDolAccount::getInstance();

        $iAffected = 0;
        $aIdsAffected = array();
        foreach($aIds as $iId){
            if (BxDolAccount::isNeedConfirmEmail()) {
                if($oAccount->updateEmailConfirmed(true, true, $iId)) {
                    $aIdsAffected[] = $iId;
                    $iAffected++;  
                }
            }

            if (BxDolAccount::isNeedConfirmPhone()){
                if($oAccount->updatePhoneConfirmed(true, $iId)) {
                    $aIdsAffected[] = $iId;
                    $iAffected++;  
                }
            }
        }
		echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t($CNF['T']['grid_action_err_perform'])));
    }
    
    public function performActionResendCemail()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return echoJson(array());

        $oAccount = BxDolAccount::getInstance();

        $iAffected = 0;
        $aIdsAffected = array();
        foreach($aIds as $iId)
            if($oAccount->sendConfirmationEmail($iId)) {
                $aIdsAffected[] = $iId;
                $iAffected++;  
            }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t($CNF['T']['grid_action_err_perform'])));
    }

    public function performActionResetPassword()
    {
    	$aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return echoJson(array());

        $iId = $aIds[0];
        $oAccount = BxDolAccount::getInstance($iId);
        if(!$oAccount)
            return echoJson(array());

        $aRes = array();
        $sPwd = genRndPwd();
        if (BxDolAccount::getInstance()->updatePassword($sPwd, $iId)){
            $sPopupId = $this->_oModule->_oConfig->getHtmlIds('password_popup');
            $sPopupTitle = _t('_bx_accounts_form_display_account_settings_password_popup');
            $sPopupContent = $this->_oModule->_oTemplate->parseHtmlByName('reset_password.html', array(
                'js_object' => $this->_oModule->_oConfig->getJsObject('main'),
                'html_id_text' => $this->_oModule->_oConfig->getHtmlIds('password_text'),
                'html_id_button' => $this->_oModule->_oConfig->getHtmlIds('password_button'),
                'password' => $sPwd,
            ));

            $aRes = array('popup' => BxTemplStudioFunctions::getInstance()->popupBox($sPopupId, $sPopupTitle, $sPopupContent));
        }
        else 
            $aRes = array('msg' => _t('_bx_accnt_grid_action_err_perform'));

        return echoJson($aRes);
    }

    public function performActionResendRemail()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return echoJson(array());

        $oAccount = BxDolAccount::getInstance();

        $iAffected = 0;
        $aIdsAffected = array();
        foreach($aIds as $iId)
            if($oAccount->sendResetPasswordEmail($iId)) {
                $aIdsAffected[] = $iId;
                $iAffected++;  
            }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t($CNF['T']['grid_action_err_perform'])));
    }

    public function performActionUnlockAccount()
    {
    	$aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            echoJson(array());
            return;
        }

        $oAccountQuery = BxDolAccountQuery::getInstance();
        foreach($aIds as $iId) {
            $oAccount = BxDolAccount::getInstance($iId);
            if(!$oAccount)
                continue;

            if ($oAccount->isLocked()){
                $oAccountQuery->unlockAccount($iId);
            }
            
            $oAccount->doAudit($iId, '_sys_audit_action_account_unlock');
        }

        return echoJson(array('grid' => $this->getCode(false), 'blink' => $aIds));
    }

    public function performActionSetOperatorRole()
    {
    	$aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return echoJson(array());
        
        $oUtils = BxDolStudioRolesUtils::getInstance();

        $aRoles = $oUtils->getRoles();
        if(empty($aRoles) || !is_array($aRoles))
            return echoJson(array('msg' => _t('_sys_txt_error_occured')));

        $iId = (int)array_shift($aIds);

        $sPopupName = str_replace('_', '-', $this->MODULE) . '-set-role-popup';
        $sPopupContent = $this->_oModule->_oTemplate->getPopupSetRole($aRoles, $iId, $oUtils->getRole($iId));

        return echoJson(array('popup' => array(
            'html' => BxTemplFunctions::getInstance()->transBox($sPopupName, $sPopupContent),
            'options' => array(
                'closeOnOuterClick' => true,
                'removeOnClose' => true
            )
        )));
    }

    public function performActionSetOperatorRoleSubmit()
    {
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return echoJson(array());

        $iId = (int)array_shift($aIds);
        if(!$iId)
            return echoJson(array('msg' => _t('_sys_txt_error_occured')));

        if(!BxDolStudioRolesUtils::getInstance()->setRole($iId, bx_process_input(bx_get('role'), BX_DATA_INT)))
            return echoJson(array('msg' => _t('_error occured')));

        echoJson(array('grid' => $this->getCode(false), 'blink' => $iId));
    }

    public function performActionMakeOperator()
    {
    	$this->_performActionChangeRole(3);
    }

    public function performActionUnmakeOperator()
    {
    	$this->_performActionChangeRole(1);
    }

    protected function _performActionChangeRole($iRole)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return echoJson(array());

        $oAccount = BxDolAccount::getInstance();
        $oUtils = BxDolStudioRolesUtils::getInstance();

        $iAffected = 0;
        $aIdsAffected = array();
        foreach($aIds as $iId) {
            if(!$this->_oModule->_oDb->updateAccount(array('role' => $iRole), array('id' => $iId))) 
                continue;

            $oUtils->setRole($iId, $iRole == 3 ? BX_DOL_STUDIO_ROLE_OPERATOR : 0);

            $oAccount->doAudit($iId, '_sys_audit_action_account_change_role_to_' . $iRole);

            $aIdsAffected[] = $iId;
            $iAffected++;
        }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t($CNF['T']['grid_action_err_perform'])));
    }

    protected function _performActionEnable($isChecked)
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

    	$aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            echoJson(array());
            return;
        }
        $iAffected = 0;
        $aIdsAffected = array();
        foreach($aIds as $iId)
        	if($this->_enable($iId, $isChecked)) {
        		$aIdsAffected[] = $iId;
        		$iAffected++;
                
                $oAccount = BxDolAccount::getInstance($iId);
                $oAccount->doAudit($iId, '_sys_audit_action_account_' . $isChecked ? 'activated' : 'suspended');
        	}

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t($CNF['T']['grid_action_err_perform'])));
    }

    protected function _enable($mixedId, $isChecked)
    {
    	$oProfile = BxDolProfile::getInstanceAccountProfile($mixedId);
    	if(!$oProfile)
    	    return false;

        $iAction = BX_PROFILE_ACTION_MANUAL;
        $sMethod = $isChecked ? 'activate' : 'suspend';
        if(!$oProfile->$sMethod($iAction, 0 ,false))
            return false;

        sendMailTemplate('t_ChangeStatusAccount' . ucfirst($sMethod), $oProfile->getAccountObject()->id(), $oProfile->id(), array(), BX_EMAIL_SYSTEM);
        
        $aProfiles = $oProfile->getAccountObject()->getProfiles();
        foreach($aProfiles as $aProfile){
            BxDolProfile::getInstance($aProfile['id'])->$sMethod($iAction, 0 ,false);
        }
        
    	return true;
    }

    //--- Layout methods ---//
    protected function _getActionEditEmail($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '';
    }
    
    protected function _getCellEmailConfirmed($mixedValue, $sKey, $aField, $aRow)
    {
    	$mixedValue = (int)$mixedValue == 1 ? '_Yes' : '_No';
        return parent::_getCellDefault(_t($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getActionResetPassword($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '';
    }

    protected function _getActionResendRemail($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($sType == 'single')
            return '';

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionUnlockAccount($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '';
    }

    protected function _getCellName($mixedValue, $sKey, $aField, $aRow)
    {
        $oAccount = BxDolAccount::getInstance($aRow['id']);
        if ($oAccount)
            $s = ($aRow['locked'] == 1 ? $this->_oTemplate->parseIcon("lock col-red1") . ' ' : '') . $oAccount->getDisplayName();
        return parent::_getCellDefault ($s, $sKey, $aField, $aRow);
    }
    
	protected function _getCellProfiles($mixedValue, $sKey, $aField, $aRow)
    {
        $s = $this->_oModule->_oTemplate->getProfilesByAccount($aRow);

        return parent::_getCellDefault ($s, $sKey, $aField, $aRow);
    }

    protected function _getCellLogged($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = !empty($mixedValue) ? bx_time_js($mixedValue) : _t('_sys_not_available');

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    } 

    protected function _getCellLastActive($mixedValue, $sKey, $aField, $aRow)
    {
        if(!isset($aRow['last_active']))
            $mixedValue = (new BxDolSessionQuery())->getLastActivityAccount($aRow['id']);

        $iTs = max((int)$mixedValue, (int)$aRow['active']);
        return parent::_getCellDefault($iTs ? bx_time_js($iTs) : _t('_sys_not_available'), $sKey, $aField, $aRow);
    }

    protected function _getCellAdded($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = !empty($mixedValue) ? bx_time_js($mixedValue) : _t('_sys_not_available');

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    } 
    
    protected function _getCellIsConfirmed($mixedValue, $sKey, $aField, $aRow)
    {
        $oAccount = BxDolAccount::getInstance($aRow['id']);
        $s = "";
        if ($oAccount)
            $s = $oAccount->getCurrentConfirmationStatusValue();
        return parent::_getCellDefault(_t('_bx_accnt_grid_confirmation_status_' . $s), $sKey, $aField, $aRow);
    }

    protected function _getOrderFields($bTranslatable = false)
    {
        $aResult = parent::_getOrderFields($bTranslatable);

        if(!$bTranslatable && $this->_oModule->_oConfig->isLastActiveSorting())
            $aResult[] = 'last_active';

        return $aResult;
    }
    
    protected function _isCheckboxDisabled($aRow)
    {
        return false;
    }

    protected function _getContentInfo($iId)
    {
    	return BxDolAccountQuery::getInstance()->getInfoById($iId);
    }

    protected function _doDelete($iId, $aParams = [])
    {
        return ($oAccount = BxDolAccount::getInstance($iId)) !== false && $oAccount->delete(isset($aParams['with_content']) && $aParams['with_content'] === true, true);
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        
        $this->_oTemplate->addJs(array(
            'main.css'
        ));

        $this->_oTemplate->addJs(array(
        	'jquery.form.min.js',
            'clipboard.min.js',
            'main.js'
        ));
    }

    protected function _isVisibleGrid($a)
    {
        if(isAdmin())
            return true;
        
        return parent::_isVisibleGrid($a);
    }

    protected function _exportToCsv($aIds, $aFields, $aTitles, $aConverters)
    {
        $sFileDiv = ';';
        $sFileName = 'accounts-' . date('Y.m.d') . '.csv';
        $sFilePath = BX_DIRECTORY_PATH_TMP . $sFileName;
        $oFileHandler = fopen($sFilePath, 'w');
        if(!$oFileHandler)
            return false;

        fputcsv($oFileHandler, $aTitles, $sFileDiv);

        $aFieldsFlip = array_flip($aFields);
        $oAccountQuery = BxDolAccountQuery::getInstance();

        foreach($aIds as $iId) {
            $aAccount = $oAccountQuery->getInfoById($iId);
            if(empty($aAccount) || !is_array($aAccount))
                continue;
            
            $aConvert = array_intersect_key($aConverters, $aAccount);
            foreach($aConvert as $sField => $sMethod)
                $aAccount[$sField] = $this->$sMethod($aAccount[$sField]);

            fputcsv($oFileHandler, array_intersect_key($aAccount, $aFieldsFlip), $sFileDiv);
        }

        fclose($oFileHandler);

        return array($sFilePath, BX_DOL_URL_ROOT . 'tmp/' . $sFileName);
    }

    protected function _exportToXml($aIds, $aFields, $aTitles, $aConverters)
    {
        $sFileName = 'accounts-' . date('Y.m.d') . '.xml';
        $sFilePath = BX_DIRECTORY_PATH_TMP . $sFileName;
        $oFileHandler = fopen($sFilePath, 'w');
        if(!$oFileHandler)
            return false;

        $aFieldsFlip = array_flip($aFields);
        $oAccountQuery = BxDolAccountQuery::getInstance();

        $oXML = xmlwriter_open_memory();
        xmlwriter_set_indent($oXML, 1);
        xmlwriter_set_indent_string($oXML, '  ');
        
        xmlwriter_start_document($oXML, '1.0', 'UTF-8');
        xmlwriter_start_element($oXML, 'accounts');

        foreach($aIds as $iId) {
            $aAccount = $oAccountQuery->getInfoById($iId);
            if(empty($aAccount) || !is_array($aAccount))
                continue;

            $aConvert = array_intersect_key($aConverters, $aAccount);
            foreach($aConvert as $sField => $sMethod)
                $aAccount[$sField] = $this->$sMethod($aAccount[$sField]);

            xmlwriter_start_element($oXML, 'account');
            $aAccountFields = array_intersect_key($aAccount, $aFieldsFlip);
            foreach($aAccountFields as $sAccountField => $sAccountValue) {
                xmlwriter_start_element($oXML, $sAccountField);
                xmlwriter_write_cdata($oXML, $sAccountValue);
                xmlwriter_end_element($oXML);
            }
            xmlwriter_end_element($oXML);
        }

        xmlwriter_end_document($oXML);

        fwrite($oFileHandler, xmlwriter_output_memory($oXML));
        fclose($oFileHandler);

        return array($sFilePath, BX_DOL_URL_ROOT . 'tmp/' . $sFileName);
    }

    protected function _exportFieldConverterAdded($mixedValue)
    {
        return $this->__exportFieldConverterDate($mixedValue);
    }

    protected function _exportFieldConverterChanged($mixedValue)
    {
        return $this->__exportFieldConverterDate($mixedValue);
    }

    protected function _exportFieldConverterLogged($mixedValue)
    {
        return $this->__exportFieldConverterDateTime($mixedValue);
    }

    protected function _exportFieldConverterLangId($mixedValue)
    {
        return $mixedValue ? BxDolLanguages::getInstance()->getLangName($mixedValue) : '';
    }

    protected function __exportFieldConverterDate($mixedValue)
    {
        return date('Y.m.d', $mixedValue);
    }

    protected function __exportFieldConverterDateTime($mixedValue)
    {
        return date('Y.m.d H:i', $mixedValue);
    }
}

/** @} */

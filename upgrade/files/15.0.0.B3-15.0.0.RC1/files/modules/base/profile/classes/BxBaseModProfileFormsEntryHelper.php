<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseProfile Base classes for profile modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Profile forms helper functions
 */
class BxBaseModProfileFormsEntryHelper extends BxBaseModGeneralFormsEntryHelper
{
    protected $_sAutoApproval = false;

    public function __construct($oModule)
    {
        parent::__construct($oModule);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $sAutoApproval = isset($CNF['PARAM_AUTOAPPROVAL']) ? getParam($CNF['PARAM_AUTOAPPROVAL']) : BX_DOL_PROFILE_ACTIVATE_ALWAYS;
        $bAdministrator = BxDolAcl::getInstance()->isMemberLevelInSet(array(MEMBERSHIP_ID_ADMINISTRATOR));
        if (isAdmin() || $bAdministrator)
            $sAutoApproval = BX_DOL_PROFILE_ACTIVATE_ALWAYS;
        $this->setAutoApproval($sAutoApproval);
    }

    public function isAutoApproval($sAction = BX_DOL_PROFILE_ACTIVATE_ALWAYS)
    {
        if ($this->_sAutoApproval == BX_DOL_PROFILE_ACTIVATE_ALWAYS || $this->_sAutoApproval == $sAction)
            return true;
        
        return false;
    }
    
    public function setAutoApproval($mValue)
    {
        if ($mValue === true)
            $mValue = BX_DOL_PROFILE_ACTIVATE_ALWAYS;
        
        return ($this->_sAutoApproval = $mValue);
    }

    public function getObjectFormEdit ($sDisplay = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oForm = parent::getObjectFormEdit ($sDisplay);
        if(!$oForm)
            return $oForm;

        //--- Edit Settings: Fill in tabs list
        if(($sKey = 'OBJECT_FORM_ENTRY_DISPLAY_EDIT_SETTINGS') && isset($CNF[$sKey]) && $CNF[$sKey] == $sDisplay)
            if(($sField = 'FIELD_STG_TABS') && !empty($CNF[$sField]) && !empty($oForm->aInputs[$CNF[$sField]]) && is_array($oForm->aInputs[$CNF[$sField]])) 
                if(($sMenu = 'OBJECT_MENU_SUBMENU_VIEW_ENTRY') && !empty($CNF[$sMenu]) && ($oMenu = BxDolMenu::getObjectInstance($CNF[$sMenu])) !== false && ($aMenuItems = $oMenu->getQueryObject()->getMenuItems()))
                    foreach($aMenuItems as $aMenuItem) {
                        if($aMenuItem['name'] == 'more-auto' || (int)$aMenuItem['active'] == 0)
                            continue;

                        $oForm->aInputs[$CNF[$sField]]['values'][] = [
                            'key' => $aMenuItem['name'],
                            'value' => _t($aMenuItem['title'])
                        ];
                    }

        return $oForm;
    }

    protected function _getProfileAndContentData ($iContentId)
    {
        $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);
        if(!$aContentInfo)
            return array (false, false);

        $oProfile = BxDolProfile::getInstanceMagic($aContentInfo['profile_id']);
        return array($oProfile, $aContentInfo);
    }

    public function deleteData ($iContentId, $aContentInfo = false, $oProfile = null, $oForm = null)
    {
        if (!$aContentInfo)
            list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);

        // delete profile with content
        $oProfile = BxDolProfile::getInstance($aContentInfo['profile_id']);
        if (!$oProfile->delete(false, true))
            return _t('_sys_txt_error_entry_delete');

        return '';
    }

    public function deleteDataService ($iContentId, $aContentInfo = false, $oProfile = null, $oForm = null)
    {
        return parent::deleteData ($iContentId, $aContentInfo, $oProfile, $oForm);
    }

    public function onDataDeleteAfter ($iContentId, $aContentInfo, $oProfile)
    {
        if($s = parent::onDataDeleteAfter($iContentId, $aContentInfo, $oProfile))
            return $s;

        $CNF = &$this->_oModule->_oConfig->CNF;

        $bActAsProfile = BxDolService::call($oProfile->getModule(), 'act_as_profile');
        if(($oPrivacyView = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false && $bActAsProfile)
            $oPrivacyView->deleteGroupCustomByProfileId($oProfile->id());

        if(($oPrivacyPost = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_POST'])) !== false) {
            $oPrivacyPost->deleteGroupCustomByContentId($iContentId);

            if($bActAsProfile)
                $oPrivacyPost->deleteGroupCustomByProfileId($oProfile->id());
        }

        return '';
    }

    public function onDataEditBefore ($iContentId, $aContentInfo, &$aTrackTextFieldsChanges, &$oProfile, &$oForm)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);

        $oEditedProfile = BxDolProfile::getInstanceMagic($aContentInfo['profile_id']);
        
        $sStatus = $oEditedProfile->getStatus();
        if (!$this->isAutoApproval(BX_DOL_PROFILE_ACTIVATE_EDIT) && BX_PROFILE_STATUS_ACTIVE == $sStatus){
            $aTrackTextFieldsChanges = array ();
        }

        foreach(['TITLE', 'BIRTHDAY', 'PICTURE', 'COVER', 'BADGE'] as $sIt)
            if(($sField = 'FIELD_' . $sIt) && isset($CNF[$sField], $aContentInfo[$CNF[$sField]]))
                $oForm->addTrackFields($CNF[$sField], $aContentInfo);
    }

    public function onDataEditAfter ($iContentId, $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm)
    {
        if($s = parent::onDataEditAfter($iContentId, $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm))
            return $s;

        $CNF = &$this->_oModule->_oConfig->CNF;

        /*
         * Load updated data.
         */
        $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);
       
        // change profile to 'pending' only if profile is 'active' 
        $oEditedProfile = BxDolProfile::getInstanceMagic($aContentInfo['profile_id']);
        $sStatus = $oEditedProfile->getStatus();

        if(!$this->isAutoApproval(BX_DOL_PROFILE_ACTIVATE_EDIT) && BX_PROFILE_STATUS_ACTIVE == $sStatus && !empty($aTrackTextFieldsChanges['changed_fields']))
            $oEditedProfile->disapprove(BX_PROFILE_ACTION_AUTO, 0, $this->_oModule->serviceActAsProfile());

        // process uploaded files
        foreach(['PICTURE', 'COVER', 'BADGE'] as $sIt) {
            $sField = 'FIELD_' . $sIt;
            if(!isset($CNF[$sField]))
                continue;

            $oForm->processFiles($CNF[$sField], $iContentId, false);

            if($this->_bIsApi)
                $oForm->processFilesFlagsApi($CNF[$sField], $iContentId);

            if(($aChanged = $oForm->isTrackFieldChanged($CNF[$sField], true)) !== false)
                $oForm->processFileDeletion($CNF[$sField], $aChanged['old']);
        }

        if(isset($CNF['FIELD_ALLOW_POST_TO']) && !empty($aContentInfo[$CNF['FIELD_ALLOW_POST_TO']]) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_POST'])) !== false)
            $oPrivacy->reassociateGroupCustomWithContent($oProfile->id(), $iContentId, (int)$aContentInfo[$CNF['FIELD_ALLOW_POST_TO']]);

        // update content filters
        if(isset($CNF['FIELD_BIRTHDAY']) && $oForm->isTrackFieldChanged($CNF['FIELD_BIRTHDAY']))
            BxDolContentFilter::getInstance()->updateValuesByProfile($oProfile->getInfo());

        // reset profile switcher cache
        if ($oEditedProfile->id() !== bx_get_logged_profile_id() && $oForm->isTrackFieldChanged($CNF['FIELD_TITLE']) || $oForm->isTrackFieldChanged($CNF['FIELD_PICTURE'])) {
            bx_content_cache_del("profile_switcher_" . $oEditedProfile->getAccountId() . "_0");
            bx_content_cache_del("profile_switcher_" . $oEditedProfile->getAccountId() . "_1");
        }

        bx_content_cache_del_by_prefix('sprofile_unit_vars:' . $oEditedProfile->id() . ':');

        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled()) {
            $aProfileData = BxDolProfile::getDataForPage($oEditedProfile);
            $oSockets->sendEvent('profile', $aContentInfo['profile_id'], 'changed', json_encode($aProfileData));
        }

        return '';
    }

    public function onDataAddAfter ($iAccountId, $iContentId)
    {
        /*
         * Add account and content association.
         * Note. It should be done first to correctly get and use author's profile later.
         */
        $iProfileId = BxDolProfile::add(BX_PROFILE_ACTION_MANUAL, $iAccountId, $iContentId, BX_PROFILE_STATUS_PENDING, $this->_oModule->getName());
        $oProfile = BxDolProfile::getInstance($iProfileId);

        if($s = parent::onDataAddAfter($iAccountId, $iContentId))
            return $s;

        $CNF = &$this->_oModule->_oConfig->CNF;

        /*
         * Load updated data.
         */
        $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);

        /* 
         * approve profile if auto-approval is enabled and profile status is 'pending'
         * don't send Activation letter when 'Auto Approval' mode is enabled.
         */
        $sStatus = $oProfile->getStatus();
        if ($sStatus == BX_PROFILE_STATUS_PENDING && $this->isAutoApproval(BX_DOL_PROFILE_ACTIVATE_ADD))
            $oProfile->approve(BX_PROFILE_ACTION_AUTO, 0, false);

        // set created profile some default membership
        if ((int)bx_get('level_id') && bx_srv('bx_acl', 'get_prices', [(int)bx_get('level_id'), true]))
            $iAclLevel = (int)bx_get('level_id');
        else if(isset($CNF['PARAM_DEFAULT_ACL_LEVEL']))
            $iAclLevel = isAdmin() && getLoggedId() == $iAccountId ? MEMBERSHIP_ID_ADMINISTRATOR : getParam($CNF['PARAM_DEFAULT_ACL_LEVEL']);
        else
            $iAclLevel = MEMBERSHIP_ID_STANDARD;

        BxDolAcl::getInstance()->setMembership($iProfileId, $iAclLevel, 0, true);
        
        // process uploaded files
        $oForm = $this->getObjectFormAdd();
        if (isset($CNF['FIELD_PICTURE']))
            $oForm->processFiles($CNF['FIELD_PICTURE'], $iContentId, true);
        if (isset($CNF['FIELD_COVER']))
            $oForm->processFiles($CNF['FIELD_COVER'], $iContentId, true);
        if (isset($CNF['FIELD_BADGE']))
            $oForm->processFiles($CNF['FIELD_BADGE'], $iContentId, true);

        if(isset($CNF['FIELD_ALLOW_POST_TO']) && !empty($aContentInfo[$CNF['FIELD_ALLOW_POST_TO']]) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_POST'])) !== false)
            $oPrivacy->associateGroupCustomWithContent($oProfile->id(), $iContentId, (int)$aContentInfo[$CNF['FIELD_ALLOW_POST_TO']]);

        // switch context to the created profile
        if ($this->_oModule->serviceActAsProfile()) {
            $oAccount = BxDolAccount::getInstance($iAccountId);
            $oAccount->updateProfileContext($iProfileId);

            //update recomedations
            BxDolRecommendation::updateData($iProfileId, true);

            // update content filters
            BxDolContentFilter::getInstance()->updateValuesByProfile($oProfile->getInfo());
        }

        return '';
    }

    public function redirectAfterAdd($aContentInfo, $sUrl = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oSession = BxDolSession::getInstance();

        $sRedirectType = empty($CNF['PARAM_REDIRECT_AADD']) ? BX_DOL_PROFILE_REDIRECT_PROFILE : getParam($CNF['PARAM_REDIRECT_AADD']);
        $sRedirectDefault = 'page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']];

        $sRedirectUrl = $sRedirectDefault;
        switch ($sRedirectType) {
            case BX_DOL_PROFILE_REDIRECT_PROFILE:
                break;

            // if user just joined the redirect to the page where user comes from. 
            case BX_DOL_PROFILE_REDIRECT_LAST:
                $sJoinReferrer = $oSession->getValue('join-referrer');
                if($sJoinReferrer) {
                    $sRedirectUrl = $sJoinReferrer;
                    $oSession->unsetValue('join-referrer');
                }
                break;

            case BX_DOL_PROFILE_REDIRECT_CUSTOM:
                $sRedirectCustom = getParam($CNF['PARAM_REDIRECT_AADD_CUSTOM_URL']);
                if($sRedirectCustom) {
                    $sRedirectUrl = $this->prepareCustomRedirectUrl($sRedirectCustom, $aContentInfo);
                }
                break;
                
            case BX_DOL_PROFILE_REDIRECT_HOMEPAGE:
                $sRedirectUrl =  BX_DOL_URL_ROOT;  
                break;
        }

        $sCustomReferrer = $oSession->getValue('custom-referrer');
        if($sCustomReferrer) {
            $sRedirectUrl = $sCustomReferrer;
            $oSession->unsetValue('custom-referrer');
        }

        return parent::redirectAfterAdd($aContentInfo, $sRedirectUrl);
    }
}

/** @} */

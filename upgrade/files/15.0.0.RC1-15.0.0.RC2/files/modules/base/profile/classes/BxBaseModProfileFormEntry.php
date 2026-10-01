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
 * Create/edit profile form.
 */
class BxBaseModProfileFormEntry extends BxBaseModGeneralFormEntry
{
    protected $_iAccountProfileId = 0;
    protected $_aImageFields = array ();
    
    protected $_aUploadersInfo = [];

    public function __construct($aInfo, $oTemplate = false)
    {   
        if (!isset($this->_bAllowChangeUserForAdmins))
            $this->_bAllowChangeUserForAdmins = false;
        
        parent::__construct($aInfo, $oTemplate);

        $this->_sAuthorKey = 'profile_id';

        $CNF = &$this->_oModule->_oConfig->CNF;

        if (!empty($CNF['FIELD_PICTURE']) && isset($this->aInputs[$CNF['FIELD_PICTURE']])) {
            $this->_aImageFields[$CNF['FIELD_PICTURE']] = array (
                'storage_object' => $CNF['OBJECT_STORAGE'],
                'images_transcoder' => $CNF['OBJECT_IMAGES_TRANSCODER_THUMB'],
                'uploaders' => $CNF['OBJECT_UPLOADERS_PICTURE'],
            );
        }

        if (!empty($CNF['FIELD_COVER']) && isset($this->aInputs[$CNF['FIELD_COVER']])) {
            $sStorage = $this->_oModule->_oConfig->getObject($CNF['OBJECT_STORAGE_COVER']);
            $sUploadersId = genRndPwd(8, false);
            $aUploaders = !empty($this->aInputs[$CNF['FIELD_COVER']]['value']) ? unserialize($this->aInputs[$CNF['FIELD_COVER']]['value']) : $this->_oModule->_oConfig->getUploaders($CNF['FIELD_COVER']);

            foreach($aUploaders as $sUploader){
                $this->_aUploadersInfo[$sUploader] = array(
                    'id' => $sUploadersId, 
                    'name' => $sUploader,
                    'js_object' => BxDolUploader::getObjectInstance($sUploader, $sStorage, $sUploadersId)->getNameJsInstanceUploader()
                );
            }
            
            $this->_aImageFields[$CNF['FIELD_COVER']] = array (
                'storage_object' => $CNF['OBJECT_STORAGE_COVER'],
                'images_transcoder' => $CNF['OBJECT_IMAGES_TRANSCODER_COVER_THUMB'],
                'uploaders_id' => $sUploadersId,
                'uploaders' => $aUploaders
            );
        }

        if (($sKey = 'FIELD_BADGE') && !empty($CNF[$sKey]) && isset($this->aInputs[$CNF[$sKey]])) {
            $this->_aImageFields[$CNF[$sKey]] = [
                'storage_object' => $CNF['OBJECT_STORAGE_BADGE'],
                'images_transcoder' => $CNF['OBJECT_IMAGES_TRANSCODER_BADGE'],
                'uploaders' => $CNF['OBJECT_UPLOADERS_BADGE'],
            ];
        }

        if (($sKey = 'FIELD_BADGE_LINK_SELECT') && !empty($CNF[$sKey]) && isset($this->aInputs[$CNF[$sKey]])) {
            $oProfile = BxDolProfile::getInstance();
            $iProfile = $oProfile->id();

            $aValues = [
                ['key' => '', 'value' => _t('_sys_please_select')]
            ];

            $aContexts = bx_srv('system', 'get_modules_by_type', ['context']);
            foreach($aContexts as $aContext) {
                $aCpIds = bx_srv($aContext['name'], 'get_participating_profiles', [$iProfile]);
                foreach($aCpIds as $iCpId)
                    if(($sCpLink = $oProfile->getUrl($iCpId)) && ($sCpName = $oProfile->getDisplayName($iCpId)))
                        $aValues[] = [
                            'key' => $sCpLink, 
                            'value' => $sCpName
                        ];
            }

            $this->aInputs[$CNF[$sKey]] = array_merge($this->aInputs[$CNF[$sKey]], [
                'values' => $aValues
            ]);
        }

        if (($sKey = 'FIELD_BADGE_LINK_CUSTOM') && !empty($CNF[$sKey]) && isset($this->aInputs[$CNF[$sKey]])) {
            if(!empty($this->aInputs[$CNF[$sKey]]['attrs']['placeholder']))
                $this->aInputs[$CNF[$sKey]]['attrs']['placeholder'] = _t($this->aInputs[$CNF[$sKey]]['attrs']['placeholder']);
        }

        foreach ($this->_aImageFields as $sField => $aParams) {
            $this->aInputs[$sField]['storage_object'] = $aParams['storage_object'];
            $this->aInputs[$sField]['uploaders'] = !empty($this->aInputs[$sField]['value']) ? unserialize($this->aInputs[$sField]['value']) : $aParams['uploaders'];
            $this->aInputs[$sField]['images_transcoder'] = $aParams['images_transcoder'];
            $this->aInputs[$sField]['uploaders_id'] = isset($aParams['uploaders_id']) ? $aParams['uploaders_id'] : '';
            $this->aInputs[$sField]['storage_private'] = 0;
            $this->aInputs[$sField]['multiple'] = false;
            $this->aInputs[$sField]['content_id'] = 0;
            $this->aInputs[$sField]['ghost_template'] = '';
        }

        if(($sField = 'friends_count') && isset($this->aInputs[$sField]) && !$this->_oModule->_oConfig->isFriends())
            unset($this->aInputs[$sField]);

        $oAccountProfile = BxDolProfile::getInstanceAccountProfile();
        if ($oAccountProfile)
            $this->_iAccountProfileId = $oAccountProfile->id();
    }

    public function getUploadersInfo($sField = '')
    {
        if(empty($sField))
            return $this->_aUploadersInfo;

        $aUploaders = !empty($this->aInputs[$sField]['value']) ? unserialize($this->aInputs[$sField]['value']) : $this->_oModule->_oConfig->getUploaders($sField);

        return $this->_aUploadersInfo[array_shift($aUploaders)];
    }
    
    function initChecker ($aValues = array (), $aSpecificValues = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aContentInfo = isset($CNF['FIELD_ID']) && isset($aValues[$CNF['FIELD_ID']]) ? $this->_oModule->_oDb->getContentInfoById ($aValues[$CNF['FIELD_ID']]) : array();
        
        foreach ($this->_aImageFields as $sField => $aParams) {

            if ($aValues && !empty($aValues[$CNF['FIELD_ID']]))
                $this->aInputs[$sField]['content_id'] = $aValues[$CNF['FIELD_ID']];

            $this->aInputs[$sField]['ghost_template'] = $this->_oModule->_oTemplate->parseHtmlByName('form_ghost_template.html', $this->_getProfilePhotoGhostTmplVars($sField, $aContentInfo));
        }

        //--- Edit Settings: Fill in tabs list
        if(($sDisplay = $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT_SETTINGS'] ?? false) && $sDisplay == $this->aParams['display'])
            if(($sField = $CNF['FIELD_STG_TABS'] ?? false) && !empty($this->aInputs[$sField]) && is_array($this->aInputs[$sField])) 
                if(($sMenu = 'OBJECT_MENU_SUBMENU_VIEW_ENTRY') && !empty($CNF[$sMenu]) && ($oMenu = BxDolMenu::getObjectInstance($CNF[$sMenu])) !== false) {
                    $oMenu->setContentId($aContentInfo[$CNF['FIELD_ID']]);
                    if(($aMenuItems = $oMenu->getQueryObject()->getMenuItems()))
                        foreach($aMenuItems as $aMenuItem) {
                            if(!$oMenu->isMenuItemActive($aMenuItem) || !$oMenu->isMenuItemVisible($aMenuItem) || $aMenuItem['name'] == 'more-auto')
                                continue;

                            $this->aInputs[$sField]['values'][] = [
                                'key' => $aMenuItem['name'],
                                'value' => _t($aMenuItem['title'])
                            ];
                        }
                }
        
        parent::initChecker($aValues, $aSpecificValues);

        if(($sField = $CNF['FIELD_STG_TABS'] ?? false) && !empty($this->aInputs[$sField]) && is_array($this->aInputs[$sField]) && ($sValue = $this->aInputs[$sField]['value']))
            $this->aInputs[$sField]['value'] = !is_array($sValue) ? explode(',', $sValue) : [];

        if(($sDisplay = 'OBJECT_FORM_ENTRY_DISPLAY_EDIT_BADGE') && !empty($CNF[$sDisplay]) && $this->aParams['display'] == $CNF[$sDisplay]) {
            $sBadgeLink = $aContentInfo[$CNF['FIELD_BADGE_LINK']] ?? '';

            $bFilledIn = false;
            if(($sKey = 'FIELD_BADGE_LINK_SELECT') && !empty($CNF[$sKey]) && isset($this->aInputs[$CNF[$sKey]]))
                foreach($this->aInputs[$CNF[$sKey]]['values'] as $aValue)
                    if($aValue['key'] == $sBadgeLink) {
                        $this->aInputs[$CNF[$sKey]]['value'] = $sBadgeLink;
                        $bFilledIn = true;
                        break;
                    }
    
            if(!$bFilledIn && ($sKey = 'FIELD_BADGE_LINK_CUSTOM') && !empty($CNF[$sKey]) && isset($this->aInputs[$CNF[$sKey]]))
                $this->aInputs[$CNF[$sKey]]['value'] = $sBadgeLink;
        }
    }

    function update ($iContentId, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(($sField = 'FIELD_STG_TABS') && !empty($CNF[$sField]) && empty($aValsToAdd[$CNF[$sField]])) {
            $mixedValue = $this->getCleanValue($CNF[$sField]);
            if(is_array($mixedValue))
                self::setSubmittedValue($CNF[$sField], implode(',', $mixedValue), $this->aFormAttrs['method']);
        }

        if((($sFldS = 'FIELD_BADGE_LINK_SELECT') && !empty($CNF[$sFldS]) && ($sValS = $this->getCleanValue($CNF[$sFldS]))) || (($sFldC = 'FIELD_BADGE_LINK_CUSTOM') && !empty($CNF[$sFldC]) && ($sValC = $this->getCleanValue($CNF[$sFldC])))) {
            $aValsToAdd[$CNF['FIELD_BADGE_LINK']] = $sValS ?: ($sValC ?: '');
        }

        return parent::update($iContentId, $aValsToAdd, $aTrackTextFieldsChanges);
    }

    function delete ($iContentId, $aContentInfo = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iProfileId = $this->getContentOwnerProfileId($iContentId);        

        foreach ($this->_aImageFields as $sField => $aParams) {
            $oStorage = BxDolStorage::getObjectInstance($aParams['storage_object']);
            $aFiles = $oStorage->getGhosts($iProfileId, $iContentId);

            foreach ($aFiles as $aFile) {
                if (!$oStorage->getFile($aFile['id']))
                    continue;
                $bRet = $oStorage->deleteFile($aFile['id'], $this->_iAccountProfileId);
            }
        }

        return parent::delete($iContentId, $aContentInfo);
    }

    public function processFilesFlagsApi ($sFieldFile, $iContentId)
    {
        if(!isset($this->aInputs[$sFieldFile]) || ($this->aInputs[$sFieldFile]['multiple'] ?? true))
            return false;
        
        $aContentInfo = $this->_oModule->_oDb->getEntriesBy(['type' => 'id', 'id' => $iContentId]);
        if(empty($aContentInfo) || !is_array($aContentInfo) || !isset($aContentInfo[$sFieldFile]))
            return false;

        $iFileId = 0;
        if(($mixedFileIds = $this->getCleanValue($sFieldFile)) === '')
            $iFileId = 0;
        else if(is_array($mixedFileIds))
            $iFileId = (int)reset($mixedFileIds);
        else
            return false;

        if($iFileId == $aContentInfo[$sFieldFile] || !$this->_oModule->_oDb->updateContentPictureById($iContentId, 0, $iFileId, $sFieldFile))
            return false;

        $this->_processTrackFields($iContentId);

        return true;
    }

    protected function genCustomViewRowValueProfileEmail($aInput)
    {
        return $this->genCustomViewRowValueProfileEmailOrIp($aInput);
    }
    
    protected function genCustomViewRowValueProfileIp($aInput)
    {
        return $this->genCustomViewRowValueProfileEmailOrIp($aInput);
    }
    
    protected function genCustomViewRowValueFriendsCount($aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!isset($CNF['URI_VIEW_FRIENDS']))
            return '';

        if(($oProfile = $this->_oModule->getProfileByCurrentUrl()) !== false)
            return $this->_oModule->_oTemplate->parseHtmlByName('name_link.html', [
                'href' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_FRIENDS'] . '&profile_id=' . $oProfile->id())),
                'title' => '',
                'content' => BxDolConnection::getObjectInstance('sys_profiles_friends')->getConnectedContentCount($oProfile->id(), true)
            ]);

        return '';
    }

    protected function genCustomViewRowValueFollowersCount($aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!isset($CNF['URI_VIEW_SUBSCRIPTIONS']))
            return '';

        if(($oProfile = $this->_oModule->getProfileByCurrentUrl()) !== false)
            return $this->_oModule->_oTemplate->parseHtmlByName('name_link.html', array(
                'href' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_SUBSCRIPTIONS'] . '&profile_id=' . $oProfile->id())),
                'title' => '',
                'content' => BxDolConnection::getObjectInstance('sys_profiles_subscriptions')->getConnectedInitiatorsCount($oProfile->id())
            ));

        return '';
    }

    private function genCustomViewRowValueProfileEmailOrIp($aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if(empty($aInput['value']))
            return '';

        $sValue = $aInput['value'];

        $sModuleAccounts = 'bx_accounts';
    	if(!BxDolModuleQuery::getInstance()->isEnabledByName($sModuleAccounts))
    		return $sValue;

		$oModuleAccounts = BxDolModule::getInstance($sModuleAccounts);
		if(!$oModuleAccounts || empty($oModuleAccounts->_oConfig->CNF['URL_MANAGE_ADMINISTRATION']))
			return $sValue;

        return $this->_oModule->_oTemplate->parseHtmlByName('name_link.html', array(
            'href' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($oModuleAccounts->_oConfig->CNF['URL_MANAGE_ADMINISTRATION'], array(
            	'filter' => urlencode($sValue)
            ))),
            'title' => '',
            'content' => $sValue
        ));
    }
    
    protected function genCustomViewRowValueProfileStatus($aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if(empty($aInput['value']))
            return '';

        $sStatus = _t('_sys_profile_status_' . $aInput['value']);
        if(empty($CNF['URL_MANAGE_ADMINISTRATION']) || empty($CNF['FIELD_TITLE']) || empty($this->aInputs[$CNF['FIELD_TITLE']]['value']))
            return $sStatus;

        return $this->_oModule->_oTemplate->parseHtmlByName('name_link.html', array(
            'href' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_MANAGE_ADMINISTRATION'], array(
            	'filter' => urlencode($this->aInputs[$CNF['FIELD_TITLE']]['value'])
            ))),
            'title' => '',
            'content' => $sStatus
        ));
    }

    protected function genCustomViewRowValueProfileLastActive($aInput)
    {
        $iLastActiveSession = 0;
        if(!empty($this->_iContentId) && ($oProfile = BxDolProfile::getInstanceByContentAndType($this->_iContentId, $this->MODULE)) !== false)
            $iLastActiveSession = (new BxDolSessionQuery())->getLastActivityAccount($oProfile->getAccountId());

        $iLastActive = max($iLastActiveSession, (int)$aInput['value']);
        return !empty($iLastActive) ? bx_time_js($iLastActive) : '';
    }

    protected function _associalFileWithContent($oStorage, $iFileId, $iProfileId, $iContentId, $sPictureField = '')
    {
        $oStorage->updateGhostsContentId ($iFileId, $iProfileId, $iContentId, $this->_isAdmin($iContentId));

        $bResult = (int)$this->_oModule->_oDb->updateContentPictureById($iContentId, 0/*$iProfileId*/, $iFileId, $sPictureField) > 0;
        if(!$bResult) 
            return;

        $this->_oModule->onUpdateImage($iContentId, $sPictureField, $iFileId, $iProfileId);
    }

    protected function _getProfilePhotoGhostTmplVars($sField, $aContentInfo = array())
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

    	return [
            'name' => $this->aInputs[$sField]['name'],
            'content_id' => $this->aInputs[$sField]['content_id'],
            'bx_if:set_thumb' => [
                'condition' => false,
                'content' => [],
            ]
        ];
    }

    protected function _isAdmin ($iContentId = 0)
    {
        if (parent::_isAdmin ($iContentId))
            return true;
        if (!$iContentId || !($aDataEntry = $this->_oModule->_oDb->getContentInfoById((int)$iContentId)))
            return false;
        return CHECK_ACTION_RESULT_ALLOWED == $this->_oModule->checkAllowedEdit ($aDataEntry);        
    }

    protected function _getPrivacyFields($aKeysF2O = array())
    {
        if(empty($aKeysF2O))
            $aKeysF2O = array(
                'FIELD_ALLOW_VIEW_TO' => 'OBJECT_PRIVACY_VIEW',
                'FIELD_ALLOW_POST_TO' => 'OBJECT_PRIVACY_POST',
                'FIELD_ALLOW_CONTACT_TO' => 'OBJECT_PRIVACY_CONTACT'
            );

        return parent::_getPrivacyFields($aKeysF2O);
    }
}

/** @} */

<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Menu to set acl level for profile
 */
class BxBaseMenuSetAclLevel extends BxTemplMenu
{
    protected $_bWithDuration;
    protected $_bHiddenByDefault;
    protected $_bContentOnly;

    protected $mixedProfileId;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);
        
        $this->_bWithDuration = true;
        $this->_bHiddenByDefault = true;
        $this->_bContentOnly = false;
    }
    
    public function setWithDuration($bWithDuration)
    {
        $this->_bWithDuration = $bWithDuration;
    }

    public function setHiddenByDefault($bHiddenByDefault)
    {
        $this->_bHiddenByDefault = $bHiddenByDefault;
    }

    public function setContentOnly($bContentOnly)
    {
        $this->_bContentOnly = $bContentOnly;
    }

    public function getCode ($mixedProfileId = 0)
    {
    	$this->mixedProfileId = $mixedProfileId;

        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest' && ($mixedProfileId = bx_get('profile_id', 'post')) && ($iAclLevelId = bx_get('level_id', 'post'))) {
            $mixedProfileId = BxDolServiceCallCodec::decodeAclProfileId($mixedProfileId);

            echoJson($this->setMembership($mixedProfileId, $iAclLevelId, bx_get('duration', 'post') !== false ? (int)bx_get('duration', 'post') : 0, (int)bx_get('card', 'post') > 0));
            exit;
        }

        $mixedProfileId = $this->mixedProfileId;
        if(bx_get('profile_id') !== false)
            $mixedProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        if($this->_bWithDuration && !is_array($mixedProfileId)) {
            $oForm = BxDolForm::getObjectInstance('sys_acl', 'sys_acl_set');
            if($oForm) {
                $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . bx_append_url_params('menu.php', [
                    'o' => 'sys_set_acl_level', 
                ]);

                $oProfile = BxDolProfile::getInstance($mixedProfileId);
                $bProfile = $oProfile !== false;

                $oForm->aInputs['profile_id']['value'] = $bProfile ? $oProfile->id() : $mixedProfileId;
                $oForm->aInputs['card']['value'] = 0;

                $oAcl = BxDolAcl::getInstance();
                $aAclLevels = $oAcl->getMembershipsBy(['type' => 'all_active_not_automatic_pair', 'available_to' => $bProfile ? $oProfile->getModule() : '']);
		foreach ($aAclLevels as $k => $s)
                    $oForm->aInputs['level_id']['values'][] = ['key' => $k, 'value' => _t($s)];

                $aProfileAclLevel = $oAcl->getMemberMembershipInfo($mixedProfileId);
                $oForm->aInputs['level_id']['value'] = $aProfileAclLevel['id'];

                $sContent = $this->_oTemplate->parseHtmlByName('acl_set.html', [
                    'form' => $oForm->getCode(),
                    'form_id' => $oForm->getId(),
                    'profile_id' => $mixedProfileId,
                ]);

                if($this->_bContentOnly)
                    return $sContent;

                return PopupBox('sys_acl_set_' . $mixedProfileId, _t('_sys_form_popup_acl_set'), $sContent, $this->_bHiddenByDefault);
            }
        }

        return parent::getCode ();
    }

    public function getMenuItems ()
    {
        $this->loadData();
        return parent::getMenuItems();
    }

    protected function loadData()
    {
    	$mixedProfileId = $this->mixedProfileId;
    	if(bx_get('profile_id') !== false)
        	$mixedProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        $oAcl = BxDolAcl::getInstance();
        if (!$oAcl)
            return;

		$bBulk = is_array($mixedProfileId);
		if(!$bBulk) {
			$aProfileAclLevel = $oAcl->getMemberMembershipInfo($mixedProfileId);
			$this->setSelected('', $aProfileAclLevel['id']);
		}

		$aAclLevels = $oAcl->getMembershipsBy(array('type' => 'all_active_not_automatic_pair'));
		foreach ($aAclLevels as $k => $s)
            $aAclLevels[$k] = _t($s);

        $aItems = array();
        foreach ($aAclLevels as $iId => $sTitle) {
            $aItems[] = array(
                'id' => $iId,
                'name' => $iId,
                'class' => '',
                'title' => $sTitle,
                'icon' => '',
                'link' => 'javascript:void(0);',
                'onclick' => "bx_set_acl_level(" . (!$bBulk ? $mixedProfileId : "'" . urlencode(json_encode($mixedProfileId)) . "'") . ", {$iId}, " . bx_js_string("$(this).parents('.bx-popup-applied:first')") . ");"
            );
        }

        $this->_aObject['menu_items'] = $aItems;
    }

    protected function setMembership($mixedProfileId, $iAclLevelId, $iAclLevelDuration = 0, $bAclCard = false)
    {
        bx_import('BxDolAcl');

        if(!is_array($mixedProfileId))
            $mixedProfileId = array($mixedProfileId);

        $iPerformerId = bx_get_logged_profile_id();
        $aCheck = checkActionModule($iPerformerId, 'set acl level', 'system', false);
        if(!isAdmin() && $aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return array('code' => 1, 'msg' => $aCheck[CHECK_ACTION_MESSAGE]);

        $iSet = 0;
        $aCards = array();
        $oAcl = BxDolAcl::getInstance();
        foreach($mixedProfileId as $iProfileId) {
            if(!$oAcl->setMembership($iProfileId, $iAclLevelId, $iAclLevelDuration, true))
                continue;

            $iSet += 1;
            if($bAclCard) {
                $aCards['card_' . $iProfileId] = $oAcl->getProfileMembership($iProfileId);

                if(($aMembership = $oAcl->getMemberMembershipInfo($iProfileId))) {
                    $aMembershipInfo = $oAcl->getMembershipInfo($aMembership['id']);

                    $sContent = $this->_oTemplate->parseHtmlByName('menu_meta_item.html', [
                        'icon' => $this->_oTemplate->getImage($aMembershipInfo['icon'], ['class' => 'bx-acl-m-thumbnail']), 
                        'caption' => _t($aMembership['name'])
                    ]);

                    $aCards['label_' . $iProfileId] = $this->_oTemplate->parseTag('span', $sContent, ['id' => 'sys-mi-acl-' . $iProfileId]);
                }
                
            }

            checkActionModule($iPerformerId, 'set acl level', 'system', true); // perform action
        }

        if(count($mixedProfileId) != $iSet)
            return array('code' => 2, 'msg' => _t('_error occured'));
        
        
        $aResult = array('code' => 0);
        if($bAclCard)
            $aResult['card'] = $aCards;

        return $aResult;
    }
}

/** @} */

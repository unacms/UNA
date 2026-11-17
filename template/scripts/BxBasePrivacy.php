<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Privacy representation.
 * @see BxDolPrivacy
 */
class BxBasePrivacy extends BxDolPrivacy
{
    protected $_oTemplate;

    protected $_sJsObjClass;
    protected $_sJsObjName;
    protected $_aHtmlIds;

    public function __construct ($aOptions, $oTemplate)
    {
        parent::__construct ($aOptions);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_sJsObjClass = 'BxDolPrivacy';
        $this->_sJsObjName = 'oBxDolPrivacy' . bx_gen_method_name($this->_sObject);

        $sHtmlId = str_replace(array('_' , ' '), array('-', '-'), $this->_sObject);
        $this->_aHtmlIds = array(
            'group_element' => 'bx-form-element-' . $this->convertActionToField($this->_aObject['action']),
            'group_custom_element' => 'sys-pgc-' . $sHtmlId,
            'group_custom_select_popup' => 'sys-privacy-gcsp-' . $sHtmlId . '-'
        );
    }

    public function getJsObjectName()
    {
        return $this->_sJsObjName;
    }

    /**
     * Get initialization section of comments box
     *
     * @return string
     */
    public function getJsScript($sCodeAdd = '', $bDynamicMode = false)
    {
        $sCode = $this->_sJsObjName . " = new " . $this->_sJsObjClass . "(" . json_encode(array(
            'sObject' => $this->_sObject,
            'sObjName' => $this->_sJsObjName,
            'sRootUrl' => BX_DOL_URL_ROOT,
            'aGroupSettings' => $this->_aGroupsSettings,
            'aHtmlIds' => $this->_aHtmlIds
        )) . ");" . $sCodeAdd;

        if($bDynamicMode) {
            $sCode = "var " . $this->_sJsObjName . " = null;
            if(typeof(jQuery.ui.sortable) == 'undefined')
                $.getScript('" . bx_js_string($this->_oTemplate->getJsUrl('jquery-ui/jquery-ui.min.js'), BX_ESCAPE_STR_APOS) . "');
            if(window['" . $this->_sJsObjName . "'] === null)
                $.getScript('" . bx_js_string($this->_oTemplate->getJsUrl('BxDolPrivacy.js'), BX_ESCAPE_STR_APOS) . "', function(data, textStatus, jqxhr) {
                    " . $sCode . "
                });";
        }
        else
            $sCode = "if(window['" . $this->_sJsObjName . "'] == undefined) var " . $sCode;

        return $this->addCssJs($bDynamicMode) . $this->_oTemplate->_wrapInTagJsCode($sCode);
    }

    public function addCssJs($bDynamicMode = false)
    {
        $sInclude = '';

        if(!$bDynamicMode)
            $this->_oTemplate->addJs(array(
                'jquery-ui/jquery-ui.min.js',
                'BxDolPrivacy.js'
            ));

        $sInclude .= $this->_oTemplate->addCss(array(
            'forms.css', 
            'privacy.css'
        ), $bDynamicMode);

        return $bDynamicMode ? $sInclude : '';
    }

    protected function getSelectGroup($aValues = array(), $aParams = array())
    {
        $sJsObject = $this->getJsObjectName();

        $oForm = BxDolForm::getObjectInstance($this->_sFormGroupCustom, $this->_sFormDisplayGcMembers);
        $oForm->initChecker($aValues);

        if($oForm->isSubmittedAndValid()) {
            $aMembers = array();
            if(($aMembersSearch = $oForm->getCleanValue('search')) !== false)
                $aMembers = array_merge($aMembers, $aMembersSearch);

            if(($aMembersList = $oForm->getCleanValue('list')) !== false)
                $aMembers = array_merge($aMembers, $aMembersList);

            $aMembers = array_unique($aMembers);

            $iGroupCustomId = $oForm->getGroupCustomId();
            if(!$iGroupCustomId) {
                if(empty($aMembers) || !is_array($aMembers))
                    return array();

                $this->deleteGroupCustom(array(
                    'profile_id' => $oForm->getCleanValue('profile_id'),
                    'content_id' => $oForm->getCleanValue('content_id'),
                    'object' => $oForm->getCleanValue('object')
                ));

                $iGroupCustomId = $oForm->insert();
                foreach($aMembers as $iMemberId)
                    $this->_oDb->insertGroupCustomMember(array('group_id' => $iGroupCustomId, 'member_id' => $iMemberId));
            }
            else {
                $this->_oDb->deleteGroupCustomMember(array('group_id' => $iGroupCustomId));

                foreach($aMembers as $iMemberId)
                    $this->_oDb->insertGroupCustomMember(array('group_id' => $iGroupCustomId, 'member_id' => $iMemberId));
            }

            return array('eval' => $sJsObject . '.onSelectUsers(oData);', 'content' => $oForm->getElementGroupCustom(array(
                'value' => $iGroupCustomId, 
                'value_items' => $aMembers
            )));
        }

        $iGroupId = $oForm->getGroupId();
        $oForm->setId( $oForm->getId() . '_' . $iGroupId );
        $sContent = BxTemplFunctions::getInstance()->transBox($this->_aHtmlIds['group_custom_select_popup'] . $iGroupId, $this->_oTemplate->parseHtmlByName('privacy_group_custom_select_popup.html', array(
            'js_object' => $sJsObject,
            'group' => $iGroupId,
            'form' => $oForm->getCode(),
            'form_id' => $oForm->getId()
        )));

        $aResult = array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false)));
        if(isset($aParams['popup_only']) && (bool)$aParams['popup_only'] === true)
            return $aResult;

        return array_merge($aResult, array(
            'eval' => $sJsObject . '.onSelectGroup(oData);', 
            'content' => $oForm->getElementGroupCustom()
        ));
    }

    protected function getSelectMemberships($aValues = array(), $aParams = array())
    {
        $sJsObject = $this->getJsObjectName();

        $oForm = BxDolForm::getObjectInstance($this->_sFormGroupCustom, $this->_sFormDisplayGcMemberships);
        $oForm->initChecker($aValues);

        if($oForm->isSubmittedAndValid()) {
            $aMemberships = $oForm->getCleanValue('memberships');

            $iGroupCustomId = $oForm->getGroupCustomId();
            if(!$iGroupCustomId) {
                if(empty($aMemberships) || !is_array($aMemberships))
                    return array();

                $this->deleteGroupCustom(array(
                    'profile_id' => $oForm->getCleanValue('profile_id'),
                    'content_id' => $oForm->getCleanValue('content_id'),
                    'object' => $oForm->getCleanValue('object')
                ));

                $iGroupCustomId = $oForm->insert();
                foreach($aMemberships as $iMembershipId)
                    $this->_oDb->insertGroupCustomMembership(array('group_id' => $iGroupCustomId, 'membership_id' => $iMembershipId));
            }
            else {
                $this->_oDb->deleteGroupCustomMembership(array('group_id' => $iGroupCustomId));

                if(!empty($aMemberships) && is_array($aMemberships))
                    foreach($aMemberships as $iMembershipId)
                        $this->_oDb->insertGroupCustomMembership(array('group_id' => $iGroupCustomId, 'membership_id' => $iMembershipId));
            }

            return array('eval' => $sJsObject . '.onSelectMemberships(oData);', 'content' => $oForm->getElementGroupCustom(array(
                'value' => $iGroupCustomId, 
                'value_items' => $aMemberships
            )));
        }

        $iGroupId = $oForm->getGroupId();
        $oForm->setId($oForm->getId() . '_' . $iGroupId);
        $sContent = BxTemplFunctions::getInstance()->transBox($this->_aHtmlIds['group_custom_select_popup'] . $iGroupId, $this->_oTemplate->parseHtmlByName('privacy_group_custom_select_popup.html', array(
            'js_object' => $sJsObject,
            'group' => $iGroupId,
            'form' => $oForm->getCode(),
            'form_id' => $oForm->getId()
        )));

        $aResult = array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false)));
        if(isset($aParams['popup_only']) && (bool)$aParams['popup_only'] === true)
            return $aResult;

        return array_merge($aResult, array(
            'eval' => $sJsObject . '.onSelectGroup(oData);', 
            'content' => $oForm->getElementGroupCustom()
        ));
    }

    protected function getLoadGroupCustom($iProfileId, $iContentId, $iGroupId, $aHtmlIds)
    {
        return $this->_sJsObjName . ".loadGroupCustom(" . json_encode(array(
            'iProfileId' => $iProfileId,
            'iContentId' => $iContentId,
            'iGroupId' => $iGroupId,
            'aHtmlIds' => $aHtmlIds
        )) . ");";
    }
}

/** @} */

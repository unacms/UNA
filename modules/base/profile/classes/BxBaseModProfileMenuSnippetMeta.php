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

class BxBaseModProfileMenuSnippetMeta extends BxBaseModGeneralMenuSnippetMeta
{
    protected $_oFunctions;

    protected $_bContentPublic;
    protected $_oContentProfile;

    protected $_aConnectionToFunctionCheck;

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_oFunctions = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate);

        $this->_iButtonsMax = 2;
        $this->_bShowZeros = true;

        $this->_bContentPublic = false;
        $this->_oContentProfile = null;

        $this->_aConnectionToFunctionCheck = $this->_oModule->_oConfig->getConnectionToFunctionCheck();
    }

    public function setContentId($iContentId)
    {
        parent::setContentId($iContentId);

        if(!empty($this->_iContentId))
            $this->_oContentProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->_sModule);
    }

    protected function getMenuItemConnectionJsCode($sConnection, $sAction, $iContentProfile, $aItem)
    {
        return 'bx_conn_action(this, \'' . $sConnection . '\', \'' . $sAction . '\', \'' . $iContentProfile . '\', false, function(oData, eLink) {$(eLink).parents(\'.bx-menu-item:first\').remove();})';
    }

    protected function getMenuItemRecommendationJsCode($sObject, $sAction, $iContentId, $aItem)
    {
        return 'bx_recommendation_action(this, \'' . $sObject . '\', \'' . $sAction . '\', \'' . $iContentId . '\', false, function(oData, eLink) {$(eLink).parents(\'.bx-base-pofile-unit-with-cover:first\').remove();})';
    }

    public function setContentPublic($bContentPublic)
    {
        $this->_bContentPublic = $bContentPublic;
    }

    protected function _getMenuItemObjFriends($aItem)
    {
        return $this->_getMenuItemConnectionObj('sys_profiles_friends', 'friends', $aItem);
    }

    protected function _getMenuItemObjSubscriptions($aItem)
    {
        return $this->_getMenuItemConnectionObj('sys_profiles_subscriptions', 'subscriptions', $aItem);
    }

    protected function _getMenuItemBefriend($aItem)
    {
        if($this->_sContext == 'recom_friends')
            return $this->_getMenuItemRecommendation('sys_friends', 'add', $aItem);
        else
            return $this->_getMenuItemConnection('sys_profiles_friends', 'add', $aItem);
    }

    protected function _getMenuItemUnfriend($aItem)
    {
        return $this->_getMenuItemConnection('sys_profiles_friends', 'remove', $aItem);
    }

    protected function _getMenuItemSubscribe($aItem)
    {
        if($this->_sContext == 'recom_subscriptions')
            return $this->_getMenuItemRecommendation('sys_subscriptions', 'add', $aItem);
        else
            return $this->_getMenuItemConnection('sys_profiles_subscriptions', 'add', $aItem);
    }

    protected function _getMenuItemUnsubscribe($aItem)
    {
        return $this->_getMenuItemConnection('sys_profiles_subscriptions', 'remove', $aItem);
    }

    protected function _getMenuItemIgnoreBefriend($aItem)
    {
        return $this->_getMenuItemRecommendation('sys_friends', 'ignore', $aItem);
    }

    protected function _getMenuItemIgnoreSubscribe($aItem)
    {
        return $this->_getMenuItemRecommendation('sys_subscriptions', 'ignore', $aItem);
    }

    protected function _getMenuItemFriends($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_oModule->_oConfig->isFriends() || !$this->_isVisibleInContext($aItem))
            return false;

        if(!$this->_bContentPublic || !$this->_oContentProfile)
            return false;

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_friends');
        if(!$oConnection)
            return false;

        $iContentProfile = $this->_oContentProfile->id();

        $iFriends = $oConnection->getConnectedInitiatorsCount($iContentProfile, true);
        if(!$iFriends && !$this->_bShowZeros)
            return false;

        if($this->_bIsApi) {
            $sUrl = $this->_oContentProfile->getUrl();
            if(!empty($CNF['URI_VIEW_FRIENDS']))
                $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_FRIENDS'] . '&profile_id=' . $iContentProfile));

            return $this->_getMenuItemAPI($aItem, 'text', [
                'title' => _t('_sys_menu_item_title_sm_friends', $iFriends),
                'link' => bx_api_get_relative_url($sUrl),
            ]);
        }

        $aObjectOptions = [
            'caption' => ($sKey = 'menu_item_title_sm_friends') && isset($CNF['T'][$sKey]) ? $CNF['T'][$sKey] : '_sys_' . $sKey
        ];
        if(!empty($aItem['icon']))
            $aObjectOptions['custom_icon'] = $this->_oFunctions->getIconAsHtml($aItem['icon']);

        return $this->getUnitMetaItemCustom($oConnection->getCounter($iContentProfile, false, $aObjectOptions));
    }

    protected function _getMenuItemFriendsMutual($aItem)
    {
        if(!$this->_isVisibleInContext($aItem))
            return false;

        if(!$this->_bContentPublic || !$this->_oContentProfile)
            return false;

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_friends');
        if(!$oConnection)
            return false;

        $iProfileId = $this->_oContentProfile->id();

        $iFriends = $oConnection->getCommonContentCount($iProfileId, bx_get_logged_profile_id(), true);
        if(!$iFriends && !$this->_bShowZeros)
            return false;

        $CNF = &$this->_oModule->_oConfig->CNF;

        $sTitle = _t('_sys_menu_item_title_sm_friends_mutual', $iFriends);

        $sUrl = $this->_oContentProfile->getUrl();
        if(!empty($CNF['URI_VIEW_FRIENDS']))
            $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_FRIENDS'] . '&profile_id=' . $iProfileId));

        if($this->_bIsApi)
            return $this->_getMenuItemAPI($aItem, 'text', [
                'title' => $sTitle,
                'link' => bx_api_get_relative_url($sUrl),
            ]);

        return $this->getUnitMetaItemText($sTitle);
    }

    protected function _getMenuItemSubscribers($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_isVisibleInContext($aItem))
            return false;

        if(!$this->_bContentPublic || !$this->_oContentProfile)
            return false;

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        if(!$oConnection)
            return false;

        $iContentProfile = $this->_oContentProfile->id();

        $iSubscribers = $oConnection->getConnectedInitiatorsCount($iContentProfile);
        if(!$iSubscribers && !$this->_bShowZeros)
            return false;

        if($this->_bIsApi)
            return false;

        $aObjectOptions = [
            'content_type' => BX_CONNECTIONS_CONTENT_TYPE_INITIATORS,
            'caption' => ($sKey = 'menu_item_title_sm_subscribers') && isset($CNF['T'][$sKey]) ? $CNF['T'][$sKey] : '_sys_' . $sKey
        ];
        if(!empty($aItem['icon']))
            $aObjectOptions['custom_icon'] = $this->_oFunctions->getIconAsHtml($aItem['icon']);

        return $this->getUnitMetaItemCustom($oConnection->getCounter($iContentProfile, false, $aObjectOptions));
    }

    protected function _getMenuItemMembership($aItem)
    {
        if(!$this->_isVisibleInContext($aItem))
            return false;

        if(!$this->_bContentPublic || !$this->_oContentProfile)
            return false;

        $aMembership = BxDolAcl::getInstance()->getMemberMembershipInfo($this->_oContentProfile->id());
        if(empty($aMembership) || !is_array($aMembership))
            return false;

        $sTitle = _t($aMembership['name']);

        if($this->_bIsApi)
            return $this->_getMenuItemAPI($aItem, 'text', [
                'title' => $sTitle
            ]);

        return $this->getUnitMetaItemText($sTitle);
    }

    protected function _getMenuItemConnection($sConnection, $sAction, &$aItem)
    {
        if(!$this->_isVisibleInContext($aItem))
            return false;

        if(!isLogged() || $this->_oModule->{$this->_aConnectionToFunctionCheck[$sConnection][$sAction]}($this->_aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        $iContentProfile = $this->_oContentProfile->id();
        $sTitle = $this->_oModule->getMenuItemTitleByConnection($sConnection, $sAction, $iContentProfile);
        if(empty($sTitle))
            return false;

        if($this->_bIsApi)
            return $this->_getMenuItemAPI($aItem, ['display' => 'element'], [
                'title' => $sTitle,
                'data' => [
                    'type' => 'connections',
                    'o' => $sConnection,
                    'a' => $sAction,
                    'iid' => bx_get_logged_profile_id(),
                    'cid' => $iContentProfile,
                    'title' => $sTitle,
                    'primary' => !empty($aItem['primary']),
                ]
            ]);

        $mixedItem = $this->getUnitMetaItemButton($sTitle, [
            'class' => !empty($aItem['primary']) ? 'bx-btn-primary' : '',
            'onclick' => $this->getMenuItemConnectionJsCode($sConnection, $sAction, $iContentProfile, $aItem)
        ]);

        return $mixedItem !== false ? [$mixedItem, 'bx-menu-item-button'] : false;
    }

    protected function _getMenuItemConnectionObj($sConnection, $sAction, &$aItem)
    {
        if(!$this->_isVisibleInContext($aItem))
            return false;

        if(!isLogged() || $this->_oModule->{$this->_aConnectionToFunctionCheck[$sConnection][$sAction]}($this->_aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        $iContentProfile = $this->_oContentProfile->id();

        $oObject = BxDolConnection::getObjectInstance($sConnection);
        if(!$oObject)
            return false;

        $aObjectOptions = [
            'uniq_id' => genRndPwd(8, false),
            'show_do_as_button' => true,
            'show_do_label' => true
        ];

        if($this->_bIsApi) {
            // no element (the viewer's own profile, no action to offer): no item, as the site shows no button
            $aElement = $oObject->getElementApi($iContentProfile, false, $aObjectOptions);
            if(empty($aElement) || !is_array($aElement))
                return false;

            return $this->_getMenuItemAPI($aItem, ['display' => 'element'], [
                'data' => array_merge($aElement, [
                    'primary' => !empty($aItem['primary']),
                ])
            ]);
        }

        return ($mixedItem = $oObject->getElement($iContentProfile, false, $aObjectOptions)) && ($mixedItem = $this->getUnitMetaItemCustom($mixedItem)) ? [$mixedItem, 'bx-menu-item-button'] : false;
    }

    protected function _getMenuItemRecommendation($sObject, $sAction, $aItem)
    {
        if(!isLogged() || !$this->_isVisibleInContext($aItem))
            return false;

        $oRecommendation = BxDolRecommendation::getObjectInstance($sObject);
        if(!$oRecommendation)
            return false;

        /**
         * Recommendations actions' availability depends on the related connection's action 'Add'.
         */
        $sConnection = $oRecommendation->getConnection();
        if($this->_oModule->{$this->_aConnectionToFunctionCheck[$sConnection]['add']}($this->_aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        $sTitle = _t($aItem['title']);
        $iContentProfile = $this->_oContentProfile->id();

        if($this->_bIsApi)
            return $this->_getMenuItemAPI($aItem, ['display' => 'element'], [
                'title' => $sTitle,
                'data' => [
                    'type' => 'recommendation',
                    'o' => $sObject,
                    'a' =>  $sAction,
                    'iid' => bx_get_logged_profile_id(),
                    'cid' => $iContentProfile,
                    'title' => $sTitle,
                    'primary' => !empty($aItem['primary']),
                ]
            ]);

        $mixedItem = $this->getUnitMetaItemButton($sTitle, [
            'class' => !empty($aItem['primary']) ? 'bx-btn-primary' : '',
            'onclick' => $this->getMenuItemRecommendationJsCode($sObject, $sAction, $iContentProfile, $aItem)
        ]);

        return $mixedItem !== false ? [$mixedItem, 'bx-menu-item-button'] : false;
    }
}

/** @} */

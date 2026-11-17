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

    /**
     * The menu is drawn on a profile's card (unit_card.html), as the apps' card: two buttons at most, the first
     * one the main (primary) one.
     */
    protected $_bCard;

    /**
     * The friends' and followers' counts share one group of avatars, drawn before the first of them
     * (BxBaseModProfileTemplate::getConnectionsPreview); whether it is drawn for the current profile.
     */
    protected $_bConnectionsPreview;

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_oFunctions = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate);

        $this->_iButtonsMax = 2;
        $this->_bShowZeros = true;

        $this->_bContentPublic = false;
        $this->_oContentProfile = null;
        $this->_bCard = false;
        $this->_bConnectionsPreview = false;

        $this->_aConnectionToFunctionCheck = $this->_oModule->_oConfig->getConnectionToFunctionCheck();
    }

    public function setContentId($iContentId)
    {
        parent::setContentId($iContentId);

        $this->_bConnectionsPreview = false;

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

    /**
     * The group of avatars before the first count drawn for the current profile: of its friends and followers
     * together, as far as the menu shows their counts.
     */
    protected function _getConnectionsPreview()
    {
        if($this->_bConnectionsPreview || !$this->_oContentProfile) {
            return '';
        }

        $this->_bConnectionsPreview = true;

        return $this->_oModule->_oTemplate->getConnectionsPreview($this->_oContentProfile->id(), $this->_isCountShown('friends'), $this->_isCountShown('subscribers'));
    }

    protected function _isCountShown($sName)
    {
        if(!isset($this->_aObject['menu_items'][$sName])) {
            return false;
        }

        $aItem = $this->_aObject['menu_items'][$sName];
        return $this->_isActive($aItem) && $this->_isVisible($aItem) && $this->_isVisibleInContext($aItem);
    }

    /**
     * A count without avatars of its own: its text, after the shared group where it is the first count.
     */
    protected function _getConnectionCounter($oConnection, $iContentProfile, $aObjectOptions)
    {
        $sCounter = $oConnection->getCounter($iContentProfile, false, array_merge($aObjectOptions, [
            'show_counter_label_with_profiles' => false,
            'show_counter_label_icon' => false
        ]));
        if(empty($sCounter)) {
            return false;
        }

        return $this->getUnitMetaItemCustom($this->_getConnectionsPreview() . $sCounter);
    }

    public function setCard($bCard)
    {
        $this->_bCard = (bool)$bCard;
    }

    /**
     * How many buttons the menu drew for the current profile (counted since setContentId).
     */
    public function getButtonsCount()
    {
        return (int)$this->_iButtons;
    }

    /**
     * A card's first button: none drawn yet for this profile.
     */
    protected function _isCardFirstButton()
    {
        return $this->_bCard && (int)$this->_iButtons == 0;
    }

    protected function _getButtonClass($aItem)
    {
        return !empty($aItem['primary']) || $this->_isCardFirstButton() ? 'bx-btn-primary' : '';
    }

    protected function _getButtonItemClass($bFirst)
    {
        return 'bx-menu-item-button' . ($bFirst ? ' bx-menu-item-button-first' : '');
    }

    /**
     * A card's button has its action's icon before its title, so a narrow card can show the icon alone.
     */
    protected function _getCardButtonContent($sTitle, $sIcon)
    {
        if(!$this->_bCard || empty($sIcon)) {
            return $sTitle;
        }

        return $this->_oTemplate->parseHtmlByName('unit_card_button.html', [
            'icon' => $sIcon,
            'title' => $sTitle
        ]);
    }

    protected function _getConnectionIcon($sConnection, $sAction)
    {
        $oConnection = BxDolConnection::getObjectInstance($sConnection);

        return $oConnection && method_exists($oConnection, 'getActionIconName') ? $oConnection->getActionIconName($sAction) : '';
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
        return $this->_getConnectionCounter($oConnection, $iContentProfile, $aObjectOptions);
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
        // a card leaves a count of zero out, as its friends and followers are
        if(!$iFriends && (!$this->_bShowZeros || $this->_bCard)) {
            return false;
        }

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
        return $this->_getConnectionCounter($oConnection, $iContentProfile, $aObjectOptions);
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

        $bFirst = $this->_isCardFirstButton();
        $mixedItem = $this->getUnitMetaItemButton($this->_getCardButtonContent($sTitle, $this->_getConnectionIcon($sConnection, $sAction)), [
            'class' => $this->_getButtonClass($aItem),
            'onclick' => $this->getMenuItemConnectionJsCode($sConnection, $sAction, $iContentProfile, $aItem)
        ]);

        return $mixedItem !== false ? [$mixedItem, $this->_getButtonItemClass($bFirst)] : false;
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
            if(empty($aElement) || !is_array($aElement)) {
                return false;
            }

            return $this->_getMenuItemAPI($aItem, ['display' => 'element'], [
                'data' => array_merge($aElement, [
                    'primary' => !empty($aItem['primary']),
                ])
            ]);
        }

        // on a card a toggle is one of its two buttons, and the first one is the main one
        if($this->_bCard && !$this->_buttonsCounterCheck()) {
            return false;
        }

        $bFirst = $this->_isCardFirstButton();
        if($bFirst) {
            $aObjectOptions['show_do_as_primary'] = true;
        }

        if(!($mixedItem = $oObject->getElement($iContentProfile, false, $aObjectOptions)) || !($mixedItem = $this->getUnitMetaItemCustom($mixedItem))) {
            return false;
        }

        if($this->_bCard) {
            $this->_buttonsCounterIncrement();
        }

        return [$mixedItem, $this->_getButtonItemClass($bFirst)];
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

        $bFirst = $this->_isCardFirstButton();
        $sIcon = $sAction == 'ignore' ? 'times' : $this->_getConnectionIcon($sConnection, $sAction);
        $mixedItem = $this->getUnitMetaItemButton($this->_getCardButtonContent($sTitle, $sIcon), [
            'class' => $this->_getButtonClass($aItem),
            'onclick' => $this->getMenuItemRecommendationJsCode($sObject, $sAction, $iContentProfile, $aItem)
        ]);

        return $mixedItem !== false ? [$mixedItem, $this->_getButtonItemClass($bFirst)] : false;
    }
}

/** @} */

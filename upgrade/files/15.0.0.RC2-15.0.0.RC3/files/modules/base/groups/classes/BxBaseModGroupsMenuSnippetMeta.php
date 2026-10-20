<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGroups Base classes for groups modules
 * @ingroup     UnaModules
 *
 * @{
 */

class BxBaseModGroupsMenuSnippetMeta extends BxBaseModProfileMenuSnippetMeta
{
    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        if(isset($CNF['OBJECT_CONNECTIONS']))
            $this->_aConnectionToFunctionCheck[$CNF['OBJECT_CONNECTIONS']] = [
                'add' => 'checkAllowedFanAdd', 
                'remove' => 'checkAllowedFanRemove'
            ];
    }

    protected function getMenuItemConnectionJsCode($sConnection, $sAction, $iContentProfile, $aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!empty($CNF['OBJECT_CONNECTIONS']) && $sConnection == $CNF['OBJECT_CONNECTIONS'] && ($oConnection = BxDolConnection::getObjectInstance($sConnection)) !== false && $oConnection->hasQuestionnaire($iContentProfile))
            return $this->_oModule->_oConfig->getJsObject('main') . ".connAction(this, '" . $sConnection . "', '" . $sAction . "', '" . $iContentProfile . "')";

        return parent::getMenuItemConnectionJsCode($sConnection, $sAction, $iContentProfile, $aItem);
    }

    protected function _getMenuItemJoinPaid($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_isVisibleInContext($aItem))
            return false;

        if(!isLogged() || $this->_oModule->checkAllowedFanAdd($this->_aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
        if(!$oConnection)
            return false;

        $sTitle = $this->_oModule->getMenuItemTitleByConnection($CNF['OBJECT_CONNECTIONS'], 'add', $this->_oContentProfile->id());
        if(empty($sTitle))
            return false;

        return [
            $this->getUnitMetaItemButton(_t(!empty($CNF['T']['menu_item_title_sm_join_paid']) ? $CNF['T']['menu_item_title_sm_join_paid'] : '_sys_menu_item_title_sm_join_paid'), [
                'href' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_JOIN_ENTRY'], [
                    'profile_id' => $this->_oContentProfile->id()
                ]))
            ]),
            'bx-menu-item-button'
        ];
    }

    protected function _getMenuItemJoin($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!isLogged() || $this->_oModule->checkAllowedFanAdd($this->_aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        if(!isset($CNF['OBJECT_CONNECTIONS']))
            return false;

        if(($sKey = 'OBJECT_RECOMMENDATIONS_FANS') && isset($CNF[$sKey]) && $this->_sContext == BxDolRecommendation::getContextName($CNF[$sKey]))
            return $this->_getMenuItemRecommendation($CNF[$sKey], 'add', $aItem);
        else
            return $this->_getMenuItemConnection($CNF['OBJECT_CONNECTIONS'], 'add', $aItem);
    }

    protected function _getMenuItemLeave($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!isLogged() || $this->_oModule->checkAllowedFanRemove($this->_aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        if(!isset($CNF['OBJECT_CONNECTIONS']))
            return false;

        return $this->_getMenuItemConnection($CNF['OBJECT_CONNECTIONS'], 'remove', $aItem);
    }

    protected function _getMenuItemIgnoreJoin($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($CNF['OBJECT_RECOMMENDATIONS_FANS']))
            return false;

        return $this->_getMenuItemRecommendation($CNF['OBJECT_RECOMMENDATIONS_FANS'], 'ignore', $aItem);
    }

    protected function _getMenuItemPrivacy($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sField = 'FIELD_ALLOW_VIEW_TO';
        if(empty($CNF[$sField]) || empty($this->_aContentInfo[$CNF[$sField]]))
            return false;

        if($this->_aContentInfo[$CNF[$sField]] == BX_DOL_PG_ALL)
            return false;

        return $this->getUnitMetaItemText(_t($CNF['T']['txt_private_group']));
    }

    protected function _getMenuItemMembers($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_isVisibleInContext($aItem))
            return false;

        if(!$this->_bContentPublic || !$this->_oContentProfile || empty($CNF['OBJECT_CONNECTIONS']))
            return false;

        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
        if(!$oConnection)
            return false;

        $iMembers = $oConnection->getConnectedInitiatorsCount($this->_oContentProfile->id(), true);
        if(!$iMembers && !$this->_bShowZeros)
            return false;

        $sTitle = isset($CNF['T']['menu_item_title_sm_members']) ? $CNF['T']['menu_item_title_sm_members'] : '_sys_menu_item_title_sm_members';
        
        if($this->_bIsApi)
            return $this->_getMenuItemAPI($aItem, 'text', [
                'title' => _t($sTitle, $iMembers)
            ]);

        $sIcon = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIconAsHtml(!empty($aItem['icon']) ? $aItem['icon'] : '');

        return $this->getUnitMetaItemCustom($oConnection->getCounter($this->_oContentProfile->id(), true, [
            'caption' => $sTitle, 
            'custom_icon' => $sIcon
        ], BX_CONNECTIONS_CONTENT_TYPE_INITIATORS));
    }

    protected function _getMenuItemCountry($aItem)
    {
        return $this->_getMenuItemLocation($aItem, true);
    }

    protected function _getMenuItemCountryCity($aItem)
    {
        return $this->_getMenuItemLocation($aItem, false);
    }

    protected function _getMenuItemLocation($aItem, $bCountryOnly = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_isVisibleInContext($aItem))
            return false;

        if(!$this->_bContentPublic || !$this->_oContentProfile || empty($CNF['OBJECT_CONNECTIONS']))
            return false;

        $oMeta = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);
        if(!$oMeta)
            return false;

        if (!($sLocation = $oMeta->locationsString($this->_iContentId, false, $bCountryOnly ? array('country_only' => 1) : array('country_city_only' => 1))))
            return false;

        return $this->getUnitMetaItemText($sLocation);
    }
}

/** @} */

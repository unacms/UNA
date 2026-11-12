<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Menu representation.
 * @see BxDolMenu
 */
class BxBaseMenuProfileFollowings extends BxTemplMenu
{
    protected $_sConnection;
    protected $_oConnection;

    protected $_iPerPageDefault;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_isMultilevel = true;
        $this->_bDisplayAddons = true;

        $this->_sConnection = 'sys_profiles_subscriptions';
        $this->_oConnection = BxDolConnection::getObjectInstance($this->_sConnection);

        $this->_iPerPageDefault = 10;
    }

    public function performActionLoadMore($sContextModule)
    {
        $aResult = [];

        $iStart = (int)bx_get('start');
        $iPerPage = (int)bx_get('per_page');
        
        $iProfile = bx_get_logged_profile_id();
        $aSubitems = $this->_getMenuSubitems($iProfile, $sContextModule, $iStart, $iPerPage);
        if(empty($aSubitems) || !is_array($aSubitems))
            return echoJson($aResult);

        $aTmplVarsSubitems = [];
        foreach($aSubitems as $aSubitem) {
            $aSubitem = $this->_getMenuItem($aSubitem);
            if($aSubitem !== false)
                $aTmplVarsSubitems[] = $aSubitem;
        }

        $aResult['content'] = $this->_oTemplate->parseHtmlByName(str_replace('.html', '_subitems.html', $this->getTemplateName()), [
            'bx_repeat:menu_items' => $aTmplVarsSubitems,
        ]);

        return echoJson($aResult);
    }

    /**
     * The modules' items for the apps (API v2 GET /navigation), each with the ids of the contexts
     * the viewer follows in that module (`contexts`, newest first, the same connection and order
     * as the web's submenu) and whether there are more (`contexts_more`); a module the viewer
     * follows nothing in is left out, as on the web. Its items are active in the apps
     * (`active_api`) and visible to the viewer. BxBaseApiV2Navigation reads the contexts' profiles
     * at once instead of a profile at a time.
     * @param bool $bAddons not used: the items have no counters
     * @param int $iPerModule how many contexts of a module at most
     */
    public function getMenuItemsForApps($bAddons = false, $iPerModule = 0)
    {
        $iProfile = (int)bx_get_logged_profile_id();
        if (!$iProfile)
            return [];

        if ($iPerModule <= 0)
            $iPerModule = $this->_iPerPageDefault;

        $bIsApi = $this->_bIsApi;
        $this->_bIsApi = true;
        try {
            $aResult = [];
            foreach (parent::getMenuItemsRaw() as $a) {
                if (!$this->_isActive($a) || !$this->_isVisible($a) || empty($a['module']))
                    continue;

                $aIds = $this->_getContextIds($iProfile, $a['module'], 0, $iPerModule + 1);
                if (empty($aIds) || !is_array($aIds))
                    continue;

                $bMore = count($aIds) > $iPerModule;
                if ($bMore)
                    $aIds = array_slice($aIds, 0, $iPerModule);

                if (empty($a['icon']) && bx_is_srv($a['module'], 'module_icon'))
                    $a['icon'] = bx_srv($a['module'], 'module_icon');

                $a = $this->_replaceMarkers($a);
                $a['title'] = !empty($a['title']) ? _t($a['title']) : '';
                $a['icon_code'] = isset($a['icon']) ? (string)$a['icon'] : '';
                $a['link_code'] = isset($a['link']) ? (string)$a['link'] : '';
                $a['addon_call'] = '';
                $a['submenu'] = '';
                $a['contexts'] = array_map('intval', array_values($aIds));
                $a['contexts_more'] = $bMore;
                $this->_updateVisibilityParamsAPI($a);
                $aResult[] = $a;
            }
        }
        finally {
            $this->_bIsApi = $bIsApi;
        }

        return $aResult;
    }

    protected function getMenuItemsRaw ()
    {
        $aMenuItems = parent::getMenuItemsRaw();
        if(empty($aMenuItems) || !is_array($aMenuItems))
            return $aMenuItems;

        $iProfile = bx_get_logged_profile_id();

        foreach($aMenuItems as $iIndex => $aItem) {
            if(empty($aItem['icon']) && bx_is_srv($aItem['module'], 'module_icon'))
                $aMenuItems[$iIndex]['icon'] = bx_srv($aItem['module'], 'module_icon');

            if(empty($aItem['onclick']))
                $aMenuItems[$iIndex]['onclick'] = "javascript:bx_menu_toggle(this, '" . $this->_sObject . "', '" . $aItem['name'] . "')";

            $aSubmenu = $this->_getMenuSubitems($iProfile, $aItem['module']);

            if(!empty($aSubmenu))
                $aMenuItems[$iIndex]['subitems'] = $aSubmenu;
            else
                unset($aMenuItems[$iIndex]);
        }

        return $aMenuItems;
    }
    
    /**
     * The ids of a module's contexts the profile is connected with, newest first: here the ones
     * it follows (sys_profiles_subscriptions). BxBaseMenuProfileMemberships lists the ones it is a
     * member or a friend of instead.
     */
    protected function _getContextIds($iProfile, $sContextModule, $iStart, $iLimit)
    {
        if (!$this->_oConnection)
            return [];

        $aIds = $this->_oConnection->getConnectedContentByType($iProfile, [$sContextModule], false, $iStart, $iLimit, BX_CONNECTIONS_ORDER_ADDED_DESC);
        return is_array($aIds) ? $aIds : [];
    }

    protected function _getMenuSubitems($iProfile, $sContextModule, $iStart = 0, $iPerPage = 0)
    {
        if(!$iPerPage)
            $iPerPage = $this->_iPerPageDefault;

        $aIds = $this->_getContextIds($iProfile, $sContextModule, $iStart, $iPerPage + 1);

        $bNext = false;
        if(count($aIds) > $iPerPage) {
            array_pop($aIds);
            $bNext = true;
        }        

        $aSubmenu = array();
        foreach($aIds as $iId) {
            $oContext = BxDolProfile::getInstance($iId);
            if(!$oContext)
                continue;

            $aSubmenu[] = array(
                'id' => 'context-' . $iId, 
                'name' => 'context-' . $iId, 
                'class' => '', 
                'link' => $oContext->getUrl(), 
                'onclick' => '', 
                'target' => '_self', 
                'title' => $oContext->getDisplayName(), 
                'icon' => $oContext->getIcon(),
                'active' => 1
            );
        }

        if($bNext) {
            $sMoreName = 'context-type-' . str_replace('_', '-', $sContextModule) . '-more';

            $aSubmenu[] = array(
                'id' => $sMoreName, 
                'name' => $sMoreName, 
                'class' => '', 
                'link' => 'javascript:void(0)', 
                'onclick' => "javascript:bx_menu_followings_load_more(this, '" . $this->_sObject . "', '" . $sContextModule . "', " . ($iStart + $iPerPage) . ", " . $iPerPage . ")", 
                'target' => '_self', 
                'title' => _t('_sys_show_more'), 
                'icon' => 'chevron-down',
                'active' => 1
            );
        }

        return $aSubmenu;
    }

    protected function _getTmplVarsAddon($mixedAddon, $aMenuItem)
    {
        $aAddon = parent::_getTmplVarsAddon($mixedAddon, $aMenuItem);

        $sAddonF = '';
        if(!empty($aAddon['addon']))
            $sAddonF = $this->_oTemplate->parseHtmlByTemplateName('menu_item_addon', array(
                'content' => $aAddon['addon']
            ));

        return array(
            'addon' => $aAddon['addon'],
            'addonf' => $sAddonF		
        );
    }
}

/** @} */

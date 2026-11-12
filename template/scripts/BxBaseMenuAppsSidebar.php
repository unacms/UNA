<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Apps Sidebar (`sys_apps_sidebar`, Studio > Navigation > Apps Sidebar): the sidebar of the apps
 * that use API v2 (GET /navigation, BxBaseApiV2Navigation). Each of its items is a group of that
 * sidebar: its submenu's items, under the item's title when it has one. The site draws this menu
 * nowhere and API v1 is not asked for it, so editing it changes the apps' sidebar only; the
 * site's own panel is Site Panel (`sys_site_panel`, BxBaseMenuPanel), which this class draws as
 * when the menu is put on a page.
 * @see BxDolMenu
 */
class BxBaseMenuAppsSidebar extends BxTemplMenuPanel
{
    /**
     * The sidebar's groups for the apps: its top-level items active in the apps (`active_api`)
     * that the viewer may see, as they are, for BxBaseApiV2Navigation to read each one's submenu
     * (`submenu_object`) as a group.
     */
    public function getMenuItemsForApps($bAddons = false)
    {
        if (!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->getMenuItemsRaw();

        $bIsApi = $this->_bIsApi;
        $this->_bIsApi = true;
        try {
            $aResult = [];
            foreach ($this->_aObject['menu_items'] as $a) {
                if (!$this->_isActive($a) || !$this->_isVisible($a))
                    continue;

                $a = $this->_replaceMarkers($a);
                $a['title'] = !empty($a['title']) ? _t($a['title']) : '';
                $a['icon_code'] = isset($a['icon']) ? (string)$a['icon'] : '';
                $a['link_code'] = isset($a['link']) ? (string)$a['link'] : '';
                $a['addon_call'] = '';
                $a['submenu'] = isset($a['submenu_object']) ? (string)$a['submenu_object'] : '';
                $this->_updateVisibilityParamsAPI($a);
                $aResult[] = $a;
            }
        }
        finally {
            $this->_bIsApi = $bIsApi;
        }

        return $aResult;
    }
}

/** @} */

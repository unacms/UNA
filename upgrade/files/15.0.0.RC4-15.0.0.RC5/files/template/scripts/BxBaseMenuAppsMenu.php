<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Apps Menu (`sys_apps_menu`, Studio > Navigation > Apps Menu): the first section of the apps'
 * sidebar (API v2 GET /navigation, the Apps Sidebar's item Apps Menu): one's main places, Home,
 * Explore, Profile, Messages, Notifications and Connections, with their counters. The site draws
 * this menu nowhere and API v1 is not asked for it; a module adds its item in its enable.sql.
 * @see BxDolMenu
 */
class BxBaseMenuAppsMenu extends BxTemplMenu
{
    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        // the items' counters (unread messages, notifications, friend requests)
        $this->_bDisplayAddons = true;
    }
}

/** @} */

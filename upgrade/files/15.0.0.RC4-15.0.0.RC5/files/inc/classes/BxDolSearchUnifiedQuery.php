<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries of the search window, @see BxDolSearchUnified
 */
class BxDolSearchUnifiedQuery extends BxDolDb
{
    /**
     * The icon each module has in the site's main menu (the first of its items with one), as the apps
     * show the section's icon: [module name => Lucide icon name].
     */
    public static function getModuleIcons()
    {
        $oDb = BxDolDb::getInstance();
        $aRows = $oDb->getAll("SELECT `module`, `icon` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `icon` <> '' ORDER BY `order` ASC");

        $aResult = [];
        foreach(is_array($aRows) ? $aRows : [] as $aRow)
            if(!isset($aResult[$aRow['module']]))
                $aResult[$aRow['module']] = $aRow['icon'];

        return $aResult;
    }
}

/** @} */

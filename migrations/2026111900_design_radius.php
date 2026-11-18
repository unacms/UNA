<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Corners (Studio > Designer > Settings): the size of the site's and Studio's corner radii (none, small, large), and
 * smooth corners with their multiplier, as hidden options of the templates category. Each is added only when missing.
 */

$oDb = BxDolDb::getInstance();

$iCategoryId = (int)$oDb->getOne("SELECT `id` FROM `sys_options_categories` WHERE `name` = 'templates' LIMIT 1");
if(!$iCategoryId) {
    return false;
}

$aOptions = [
    ['sys_design_radius', 'large', 'select', 'none,small,large', 21],
    ['sys_design_radius_smooth', '', 'checkbox', '', 22],
    ['sys_design_radius_smooth_factor', '1.75', 'digit', '', 23],
];
foreach($aOptions as $aOption) {
    if($oDb->getOne("SELECT `id` FROM `sys_options` WHERE `name` = :name LIMIT 1", ['name' => $aOption[0]])) {
        continue;
    }

    $oDb->query("INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES (:category, :name, :caption, :value, :type, :extra, '', '', :order)", [
        'category' => $iCategoryId,
        'name' => $aOption[0],
        'caption' => '_adm_stg_cpt_option_' . $aOption[0],
        'value' => $aOption[1],
        'type' => $aOption[2],
        'extra' => $aOption[3],
        'order' => $aOption[4],
    ]);
}

$oDb->cacheParams(true, true); // reread, not only clear: the rest of the request still reads options

return true;

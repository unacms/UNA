<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Form label style: the site's style (regular, or adaptive: floating labels) as a hidden option edited in
 * Studio > Designer > Settings, and a form display's own style ('' follows the site's).
 * MySQL has no ADD COLUMN IF NOT EXISTS, so the column is checked first.
 */

$oDb = BxDolDb::getInstance();

if(!$oDb->isFieldExists('sys_form_displays', 'label_style') && $oDb->query("ALTER TABLE `sys_form_displays` ADD `label_style` varchar(16) NOT NULL DEFAULT '' AFTER `view_mode`") === false)
    return false;

$iCategoryId = (int)$oDb->getOne("SELECT `id` FROM `sys_options_categories` WHERE `name` = 'templates' LIMIT 1");
if(!$iCategoryId)
    return false;

if(!$oDb->getOne("SELECT `id` FROM `sys_options` WHERE `name` = 'sys_form_label_style' LIMIT 1"))
    $oDb->query("INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES (:category, 'sys_form_label_style', '_adm_stg_cpt_option_sys_form_label_style', 'regular', 'select', 'regular,adaptive', '', '', 20)", ['category' => $iCategoryId]);

$oDb->cacheParams(true, true); // reread, not only clear: the rest of the request still reads options

return true;

<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Page blocks: the header icon, a larger icon before a block's title and description (`icon` stays the small one on
 * the title's line). MySQL has no ADD COLUMN IF NOT EXISTS, so the column is checked first.
 */

$oDb = BxDolDb::getInstance();
if($oDb->isFieldExists('sys_pages_blocks', 'header_icon'))
    return true;

return $oDb->query("ALTER TABLE `sys_pages_blocks` ADD `header_icon` text NOT NULL AFTER `icon`") !== false;

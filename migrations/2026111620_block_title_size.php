<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * A page block's title size (Studio > Pages > block: "Title size"): '' regular, 'compact' or 'large'. The padding size
 * takes the same names: its 'relaxed' is now 'large'. MySQL 5.7 has no ADD COLUMN IF NOT EXISTS, so the column is
 * added only when it is missing.
 */

BxDolMigrationsHelper::addColumn('sys_pages_blocks', 'title_size', "varchar(16) NOT NULL DEFAULT '' AFTER `padding_size`");

BxDolDb::getInstance()->query("UPDATE `sys_pages_blocks` SET `padding_size` = 'large' WHERE `padding_size` = 'relaxed'");

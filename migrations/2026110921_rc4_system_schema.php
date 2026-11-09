<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC3
 *
 * RC3 to RC4: added columns and indexes of the update pack (upgrade/files/15.0.0.RC3-15.0.0.RC4/script.php).
 * MySQL 5.7 has no ADD COLUMN IF NOT EXISTS, so each one is added only when it is missing.
 * The app related SQL of that script is the next migration.
 */

BxDolMigrationsHelper::addColumn('sys_keys', 'scope', "tinyint(4) NOT NULL DEFAULT '0' AFTER `data`");
BxDolMigrationsHelper::addColumn('sys_objects_page', 'cover_hidden_on', "varchar(255) NOT NULL DEFAULT '' AFTER `cover_title`");
BxDolMigrationsHelper::addColumn('sys_pages_blocks', 'title_hidden_on', "varchar(255) NOT NULL DEFAULT '' AFTER `hidden_on`");
BxDolMigrationsHelper::addColumn('sys_pages_blocks', 'bg_hidden_on', "varchar(255) NOT NULL DEFAULT '' AFTER `title_hidden_on`");
BxDolMigrationsHelper::addColumn('sys_pages_blocks', 'padding_hidden_on', "varchar(255) NOT NULL DEFAULT '' AFTER `bg_hidden_on`");

BxDolMigrationsHelper::addIndex('sys_menu_items', 'set_name', ['set_name']);

<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * A page block's padding size (Studio > Pages > block: "Padding"): '' regular, 'compact' or 'relaxed'.
 * MySQL 5.7 has no ADD COLUMN IF NOT EXISTS, so the column is added only when it is missing.
 */

BxDolMigrationsHelper::addColumn('sys_pages_blocks', 'padding_size', "varchar(16) NOT NULL DEFAULT '' AFTER `padding_hidden_on`");

<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Grids: the `engine` column of sys_objects_grid picks the client that renders a grid, empty for the
 * classic HTML grid, 'ag' for AG Grid. Added only when missing.
 */

BxDolMigrationsHelper::addColumn('sys_objects_grid', 'engine', "varchar(16) NOT NULL DEFAULT '' AFTER `show_total_count`");

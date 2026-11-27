SET @sName = 'bx_se_migration';

-- SETTINGS
DELETE FROM `top`, `toc`, `to` USING `sys_options_types` AS `top` 
LEFT JOIN `sys_options_categories` AS `toc` ON `top`.`id`=`toc`.`type_id` 
LEFT JOIN `sys_options` AS `to` ON `toc`.`id`=`to`.`category_id` WHERE `top`.`name`=@sName;

DELETE FROM `sys_options` WHERE `name` IN ('se_migration_salt', 'se_migration_version');

-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = @sName LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` IN ('bx_se_migration_transfers');
DELETE FROM `sys_grid_fields` WHERE `object` IN ('bx_se_migration_transfers', 'bx_se_migration_transfers_path');
DELETE FROM `sys_grid_actions` WHERE `object` IN ('bx_se_migration_transfers');
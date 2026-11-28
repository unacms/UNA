SET @sName = 'bx_reputation';


-- SETTINGS
DELETE FROM `tot`, `toc`, `to` USING `sys_options_types` AS `tot` LEFT JOIN `sys_options_categories` AS `toc` ON `tot`.`id`=`toc`.`type_id` LEFT JOIN `sys_options` AS `to` ON `toc`.`id`=`to`.`category_id` WHERE `tot`.`name`=@sName;


-- PAGES & BLOCKS
DELETE FROM `sys_objects_page` WHERE `module` = @sName;
DELETE FROM `sys_pages_blocks` WHERE `module` = @sName OR `object` IN('bx_reputation_leaderboard', 'bx_reputation_manage', 'bx_reputation_history', 'bx_reputation_info');


-- MENU
DELETE FROM `sys_objects_menu` WHERE `module` = @sName;
DELETE FROM `sys_menu_sets` WHERE `module` = @sName;
DELETE FROM `sys_menu_items` WHERE `module` = @sName OR `set_name` IN('bx_reputation_submenu');


-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = @sName;
DELETE FROM `sys_acl_actions` WHERE `Module` = @sName;


-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` LIKE 'bx_reputation_%';
DELETE FROM `sys_grid_fields` WHERE `object` LIKE 'bx_reputation_%';
DELETE FROM `sys_grid_actions` WHERE `object` LIKE 'bx_reputation_%';


-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = @sName LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

SET @sName = 'bx_github';


-- SETTINGS
DELETE FROM `tot`, `toc`, `to` USING `sys_options_types` AS `tot` LEFT JOIN `sys_options_categories` AS `toc` ON `tot`.`id`=`toc`.`type_id` LEFT JOIN `sys_options` AS `to` ON `toc`.`id`=`to`.`category_id` WHERE `tot`.`name`=@sName;


-- PAGES & BLOCKS
DELETE FROM `sys_objects_page` WHERE `module` = @sName;
DELETE FROM `sys_pages_blocks` WHERE `module` = @sName OR `object` IN ('bx_github_settings', 'bx_github_authorize');


-- MENU
DELETE FROM `sys_objects_menu` WHERE `module` = @sName;
DELETE FROM `sys_menu_sets` WHERE `module` = @sName;
DELETE FROM `sys_menu_items` WHERE `module` = @sName; -- OR `set_name` IN('');


-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = @sName;
DELETE FROM `sys_acl_actions` WHERE `Module` = @sName;


-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` LIKE 'bx_github_%';
DELETE FROM `sys_grid_fields` WHERE `object` LIKE 'bx_github_%';
DELETE FROM `sys_grid_actions` WHERE `object` LIKE 'bx_github_%';

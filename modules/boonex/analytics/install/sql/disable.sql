SET @sName = 'bx_analytics';

-- SETTINGS
SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = @sName LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` IN (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId);
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;

-- PAGES
DELETE FROM `sys_objects_page` WHERE `module` = @sName;
DELETE FROM `sys_pages_blocks` WHERE `module` = @sName;

-- MENU
DELETE FROM `sys_menu_items` WHERE `module` = @sName ;

-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = @sName;
DELETE FROM `sys_acl_actions` WHERE `Module` = @sName;

-- INJECTIONS
DELETE FROM `sys_injections` WHERE `name` = 'bx_analytics_tracker';

-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = @sName LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

-- CRON
DELETE FROM `sys_cron_jobs` WHERE `name` = 'bx_analytics_pruning';

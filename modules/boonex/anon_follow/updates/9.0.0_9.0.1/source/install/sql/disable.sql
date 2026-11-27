SET @sName = 'bx_anon_follow';

-- SETTINGS
SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = @sName LIMIT 1);
SET @iCategId = (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` = @iCategId;
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;

-- PAGES
DELETE FROM `sys_pages_blocks` WHERE `module` = @sName;

-- MENUS
DELETE FROM `sys_menu_items` WHERE `module` = @sName;

-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` IN ('bx_anon_follow_grid_subscribed_me', 'bx_anon_follow_grid_subscriptions');
DELETE FROM `sys_grid_fields` WHERE `object` IN ('bx_anon_follow_grid_subscribed_me', 'bx_anon_follow_grid_subscriptions');
DELETE FROM `sys_grid_actions` WHERE `object` IN ('bx_anon_follow_grid_subscribed_me', 'bx_anon_follow_grid_subscriptions');

-- INJECTION
DELETE FROM `sys_injections` WHERE `name`= @sName;

-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = @sName LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

-- SETTINGS
SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = 'bx_resources' LIMIT 1);
SET @iCategId = (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` = @iCategId;
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;

-- PAGES
DELETE FROM `sys_objects_page` WHERE `module` = 'bx_resources';
DELETE FROM `sys_pages_blocks` WHERE `module` = 'bx_resources' OR `object` IN('bx_resources_create_entry', 'bx_resources_edit_entry', 'bx_resources_delete_entry', 'bx_resources_view_entry', 'bx_resources_view_entry_comments', 'bx_resources_author', 'bx_resources_context', 'bx_resources_manage', 'bx_resources_administration');

-- MENU
DELETE FROM `sys_objects_menu` WHERE `module` = 'bx_resources';
DELETE FROM `sys_menu_sets` WHERE `module` = 'bx_resources';
DELETE FROM `sys_menu_items` WHERE `module` = 'bx_resources' OR `set_name` IN('bx_resources_view', 'bx_resources_view_actions', 'bx_resources_view_submenu', 'bx_resources_menu_manage_tools');

-- PRIVACY 
DELETE FROM `sys_objects_privacy` WHERE `object` = 'bx_resources_allow_view_to';

-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = 'bx_resources';
DELETE FROM `sys_acl_actions` WHERE `Module` = 'bx_resources';

-- SEARCH
DELETE FROM `sys_objects_search` WHERE `ObjectName` IN ('bx_resources', 'bx_resources_cmts');

-- CATEGORY
DELETE FROM `sys_objects_category` WHERE `object` = 'bx_resources_cats';

-- STATS
DELETE FROM `sys_statistics` WHERE `name` LIKE 'bx_resources%';

-- CHARTS
DELETE FROM `sys_objects_chart` WHERE `object` LIKE 'bx_resources%';

-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` LIKE 'bx_resources_%';
DELETE FROM `sys_grid_fields` WHERE `object` LIKE 'bx_resources_%';
DELETE FROM `sys_grid_actions` WHERE `object` LIKE 'bx_resources_%';

-- UPLOADERS
DELETE FROM `sys_objects_uploader` WHERE `object` LIKE 'bx_resources_%';

-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = 'bx_resources' LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

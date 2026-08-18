
-- SETTINGS
SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = 'bx_tasks' LIMIT 1);
SET @iCategId = (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` = @iCategId;
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;

-- PAGES
DELETE FROM `sys_objects_page` WHERE `module` = 'bx_tasks';
DELETE FROM `sys_pages_blocks` WHERE `module` = 'bx_tasks' OR `object` IN('bx_tasks_create_entry', 'bx_tasks_edit_entry', 'bx_tasks_delete_entry', 'bx_tasks_view_entry', 'bx_tasks_view_entry_comments', 'bx_tasks_context', 'bx_tasks_manage', 'bx_tasks_administration', 'bx_tasks_time_manage', 'bx_tasks_time_administration', 'bx_tasks_context_time', 'bx_tasks_context_time_administration', 'bx_tasks_context_pre_values', 'bx_tasks_timers');

-- MENU
DELETE FROM `sys_objects_menu` WHERE `module` = 'bx_tasks';
DELETE FROM `sys_menu_sets` WHERE `module` = 'bx_tasks';
DELETE FROM `sys_menu_items` WHERE `module` = 'bx_tasks' OR `set_name` IN('bx_tasks_create_task_attachments', 'bx_tasks_view', 'bx_tasks_view_actions', 'bx_tasks_submenu', 'bx_tasks_view_submenu', 'bx_tasks_view_context_submenu', 'bx_tasks_use_tools_submenu', 'bx_tasks_manage_tools_submenu', 'bx_tasks_menu_manage_tools', 'bx_tasks_browse');

-- PRIVACY 
DELETE FROM `sys_objects_privacy` WHERE `object` = 'bx_tasks_allow_view_to';

-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = 'bx_tasks';
DELETE FROM `sys_acl_actions` WHERE `Module` = 'bx_tasks';

-- SEARCH
DELETE FROM `sys_objects_search` WHERE `ObjectName` IN ('bx_tasks', 'bx_tasks_cmts');

-- CONNECTIONS
DELETE FROM `sys_objects_connection` WHERE `object` = 'bx_tasks_assignments';

-- METATAGS
DELETE FROM `sys_objects_metatags` WHERE `object` = 'bx_tasks';

-- CATEGORY
DELETE FROM `sys_objects_category` WHERE `object` = 'bx_tasks_cats';

-- STATS
DELETE FROM `sys_statistics` WHERE `name` LIKE 'bx_tasks%';

-- CHARTS
DELETE FROM `sys_objects_chart` WHERE `object` LIKE 'bx_tasks%';

-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` LIKE 'bx_tasks_%';
DELETE FROM `sys_grid_fields` WHERE `object` LIKE 'bx_tasks_%';
DELETE FROM `sys_grid_actions` WHERE `object` LIKE 'bx_tasks_%';

-- UPLOADERS
DELETE FROM `sys_objects_uploader` WHERE `object` LIKE 'bx_tasks_%';

-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = 'bx_tasks' LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

-- CRON
DELETE FROM `sys_cron_jobs` WHERE `name` LIKE 'bx_tasks%';

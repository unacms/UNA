
-- SETTINGS
SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = 'bx_stories' LIMIT 1);
SET @iCategId = (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` = @iCategId;
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;


-- PAGES
DELETE FROM `sys_objects_page` WHERE `module` = 'bx_stories';
DELETE FROM `sys_pages_blocks` WHERE `module` = 'bx_stories' OR `object` IN('bx_stories_create_entry', 'bx_stories_add_media', 'bx_stories_edit_entry', 'bx_stories_delete_entry', 'bx_stories_view_entry', 'bx_stories_view_entry_comments', 'bx_stories_home', 'bx_stories_popular', 'bx_stories_top', 'bx_stories_updated', 'bx_stories_author', 'bx_stories_context', 'bx_stories_search', 'bx_stories_manage');


-- MENU
DELETE FROM `sys_objects_menu` WHERE `module` = 'bx_stories';
DELETE FROM `sys_menu_sets` WHERE `module` = 'bx_stories';
DELETE FROM `sys_menu_items` WHERE `module` = 'bx_stories' OR `set_name` IN('bx_stories_view', 'bx_stories_view_actions', 'bx_stories_view_actions_media', 'bx_stories_submenu', 'bx_stories_view_submenu', 'bx_stories_snippet_meta', 'bx_stories_menu_manage_tools', 'bx_stories_my');


-- PRIVACY 
DELETE FROM `sys_objects_privacy` WHERE `object` IN ('bx_stories_allow_view_to');


-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = 'bx_stories';
DELETE FROM `sys_acl_actions` WHERE `Module` = 'bx_stories';


-- SEARCH
DELETE FROM `sys_objects_search` WHERE `ObjectName` IN ('bx_stories', 'bx_stories_cmts', 'bx_stories_media');


-- METATAGS
DELETE FROM `sys_objects_metatags` WHERE `object` IN ('bx_stories');


-- STATS
DELETE FROM `sys_statistics` WHERE `name` LIKE 'bx_stories%';


-- CHARTS
DELETE FROM `sys_objects_chart` WHERE `object` LIKE 'bx_stories%';


-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` IN ('bx_stories_administration', 'bx_stories_common');
DELETE FROM `sys_grid_fields` WHERE `object` IN ('bx_stories_administration', 'bx_stories_common');
DELETE FROM `sys_grid_actions` WHERE `object` IN ('bx_stories_administration', 'bx_stories_common');


-- UPLOADERS
DELETE FROM `sys_objects_uploader` WHERE `object` IN('bx_stories_html5', 'bx_stories_crop', 'bx_stories_record_video');


-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = 'bx_stories' LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

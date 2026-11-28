
-- SETTINGS

SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = 'bx_workspaces' LIMIT 1);
SET @iCategId = (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` = @iCategId;
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;

-- PAGES

DELETE FROM `sys_objects_page` WHERE `module` = 'bx_workspaces';
DELETE FROM `sys_pages_blocks` WHERE `module` = 'bx_workspaces' OR `object` IN('bx_workspaces_create_profile', 'bx_workspaces_delete_profile', 'bx_workspaces_edit_profile', 'bx_workspaces_edit_profile_cover', 'bx_workspaces_view_profile', 'bx_workspaces_view_profile_closed', 'bx_workspaces_profile_info', 'bx_workspaces_profile_friends', 'bx_workspaces_friend_requests', 'bx_workspaces_profile_favorites', 'bx_workspaces_profile_subscriptions', 'bx_workspaces_profile_comments', 'bx_workspaces_home', 'bx_workspaces_search', 'bx_workspaces_manage');

-- MENU

DELETE FROM `sys_objects_menu` WHERE `module` = 'bx_workspaces';
DELETE FROM `sys_menu_sets` WHERE `module` = 'bx_workspaces';
DELETE FROM `sys_menu_items` WHERE `module` = 'bx_workspaces' OR `set_name` IN('bx_workspaces_view_submenu', 'bx_workspaces_submenu', 'bx_workspaces_view_actions', 'bx_workspaces_view_actions_more', 'bx_workspaces_view_actions_all', 'bx_workspaces_view_meta', 'bx_workspaces_snippet_meta', 'bx_workspaces_menu_manage_tools');

-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = 'bx_workspaces';
DELETE FROM `sys_acl_actions` WHERE `Module` = 'bx_workspaces';

-- METATAGS
DELETE FROM `sys_objects_metatags` WHERE `object` = 'bx_workspaces';

-- SEARCH
DELETE FROM `sys_objects_search` WHERE `ObjectName` IN ('bx_workspaces', 'bx_workspaces_cmts');

-- STATS
DELETE FROM `sys_statistics` WHERE `name` LIKE 'bx_workspaces%';

-- CHARTS
DELETE FROM `sys_objects_chart` WHERE `object` LIKE 'bx_workspaces%';

-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` IN ('bx_workspaces_administration', 'bx_workspaces_common');
DELETE FROM `sys_grid_fields` WHERE `object` IN ('bx_workspaces_administration', 'bx_workspaces_common');
DELETE FROM `sys_grid_actions` WHERE `object` IN ('bx_workspaces_administration', 'bx_workspaces_common');

-- LIVE UPDATES
DELETE FROM `sys_objects_live_updates` WHERE `name` LIKE 'bx_workspaces%';

-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = 'bx_workspaces' LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

-- PRIVACY 
DELETE FROM `sys_objects_privacy` WHERE `object` IN ('bx_workspaces_allow_view_to', 'bx_workspaces_allow_post_to', 'bx_workspaces_allow_contact_to');

-- EMAIL TEMPLATES
DELETE FROM `sys_email_templates` WHERE `Module` = 'bx_workspaces';

-- UPLOADERS
DELETE FROM `sys_objects_uploader` WHERE `object` IN ('bx_workspaces_cover_crop', 'bx_workspaces_picture_crop');

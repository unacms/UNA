
-- SETTINGS
SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = 'bx_jobs' LIMIT 1);
SET @iCategId = (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` = @iCategId;
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;

-- PAGES
DELETE FROM `sys_objects_page` WHERE `module` = 'bx_jobs';
DELETE FROM `sys_pages_blocks` WHERE `module` = 'bx_jobs' OR `object` IN('bx_jobs_create_profile', 'bx_jobs_delete_profile', 'bx_jobs_context', 'bx_jobs_join_profile', 'bx_jobs_edit_profile', 'bx_jobs_edit_profile_cover', 'bx_jobs_invite', 'bx_jobs_view_profile', 'bx_jobs_view_profile_closed', 'bx_jobs_profile_info', 'bx_jobs_profile_pricing', 'bx_jobs_profile_comments', 'bx_jobs_home', 'bx_jobs_fans', 'bx_jobs_manage_item', 'bx_jobs_joined', 'bx_jobs_favorites', 'bx_jobs_top', 'bx_jobs_search', 'bx_jobs_manage', 'bx_jobs_administration');

-- MENU
DELETE FROM `sys_objects_menu` WHERE `module` = 'bx_jobs';
DELETE FROM `sys_menu_sets` WHERE `module` = 'bx_jobs';
DELETE FROM `sys_menu_items` WHERE `module` = 'bx_jobs' OR `set_name` IN('bx_jobs_view_submenu', 'bx_jobs_submenu', 'bx_jobs_view_actions', 'bx_jobs_view_actions_more', 'bx_jobs_view_actions_all', 'bx_jobs_view_meta', 'bx_jobs_my', 'bx_jobs_snippet_meta', 'bx_jobs_menu_manage_tools');

-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = 'bx_jobs';
DELETE FROM `sys_acl_actions` WHERE `Module` = 'bx_jobs';

-- METATAGS
DELETE FROM `sys_objects_metatags` WHERE `object` = 'bx_jobs';

-- CATEGORY
DELETE FROM `sys_objects_category` WHERE `object` = 'bx_jobs_cats';

-- SEARCH
DELETE FROM `sys_objects_search` WHERE `ObjectName` = 'bx_jobs';

-- CONNECTIONS
DELETE FROM `sys_objects_connection` WHERE `object` = 'bx_jobs_fans';

-- RECOMMENDATIONS
SET @iRecFans = (SELECT `id` FROM `sys_objects_recommendation` WHERE `name`='bx_jobs_fans' LIMIT 1);
DELETE FROM `sys_objects_recommendation` WHERE `id`=@iRecFans;
DELETE FROM `sys_recommendation_criteria` WHERE `object_id`=@iRecFans;
DELETE FROM `sys_recommendation_data` WHERE `object_id`=@iRecFans;

-- STATS
DELETE FROM `sys_statistics` WHERE `name` LIKE 'bx_jobs%';

-- CHARTS
DELETE FROM `sys_objects_chart` WHERE `object` LIKE 'bx_jobs%';

-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` IN ('bx_jobs_administration', 'bx_jobs_common', 'bx_jobs_fans', 'bx_jobs_bans', 'bx_jobs_invites', 'bx_jobs_questions_manage', 'bx_jobs_prices_manage', 'bx_jobs_prices_view');
DELETE FROM `sys_grid_fields` WHERE `object` IN ('bx_jobs_administration', 'bx_jobs_common', 'bx_jobs_fans', 'bx_jobs_bans', 'bx_jobs_invites', 'bx_jobs_questions_manage', 'bx_jobs_prices_manage', 'bx_jobs_prices_view');
DELETE FROM `sys_grid_actions` WHERE `object` IN ('bx_jobs_administration', 'bx_jobs_common', 'bx_jobs_fans', 'bx_jobs_bans', 'bx_jobs_invites', 'bx_jobs_questions_manage', 'bx_jobs_prices_manage', 'bx_jobs_prices_view');

-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = 'bx_jobs' LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;

-- PRIVACY 
DELETE FROM `sys_objects_privacy` WHERE `object` IN ('bx_jobs_allow_view_to', 'bx_jobs_allow_view_notification_to', 'bx_jobs_allow_post_to', 'bx_jobs_allow_view_favorite_list');

-- EMAIL TEMPLATES
DELETE FROM `sys_email_templates` WHERE `Module` = 'bx_jobs';

-- UPLOADERS
DELETE FROM `sys_objects_uploader` WHERE `object` IN ('bx_jobs_cover_crop', 'bx_jobs_picture_crop');

-- CRON
DELETE FROM `sys_cron_jobs` WHERE `name` IN ('bx_jobs_pruning');

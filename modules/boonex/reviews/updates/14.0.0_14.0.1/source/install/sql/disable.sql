
-- SETTINGS
SET @iTypeId = (SELECT `ID` FROM `sys_options_types` WHERE `name` = 'bx_reviews' LIMIT 1);
SET @iCategId = (SELECT `ID` FROM `sys_options_categories` WHERE `type_id` = @iTypeId LIMIT 1);
DELETE FROM `sys_options` WHERE `category_id` = @iCategId;
DELETE FROM `sys_options_categories` WHERE `type_id` = @iTypeId;
DELETE FROM `sys_options_types` WHERE `id` = @iTypeId;

-- PAGES
DELETE FROM `sys_objects_page` WHERE `module` = 'bx_reviews';
DELETE FROM `sys_pages_blocks` WHERE `module` = 'bx_reviews' OR `object` IN('bx_reviews_create_entry', 'bx_reviews_edit_entry', 'bx_reviews_delete_entry', 'bx_reviews_view_entry', 'bx_reviews_view_entry_comments', 'bx_reviews_home', 'bx_reviews_popular', 'bx_reviews_top', 'bx_reviews_updated', 'bx_reviews_author', 'bx_reviews_context', 'bx_reviews_search', 'bx_reviews_manage');

-- MENU
DELETE FROM `sys_objects_menu` WHERE `module` = 'bx_reviews';
DELETE FROM `sys_menu_sets` WHERE `module` = 'bx_reviews';
DELETE FROM `sys_menu_items` WHERE `module` = 'bx_reviews' OR `set_name` IN('bx_reviews_entry_attachments', 'bx_reviews_view', 'bx_reviews_view_actions', 'bx_reviews_submenu', 'bx_reviews_view_submenu', 'bx_reviews_snippet_meta', 'bx_reviews_my', 'bx_reviews_menu_manage_tools');

-- PRIVACY 
DELETE FROM `sys_objects_privacy` WHERE `object` IN ('bx_reviews_allow_view_to', 'bx_reviews_allow_view_favorite_list');

-- ACL
DELETE `sys_acl_actions`, `sys_acl_matrix` FROM `sys_acl_actions`, `sys_acl_matrix` WHERE `sys_acl_matrix`.`IDAction` = `sys_acl_actions`.`ID` AND `sys_acl_actions`.`Module` = 'bx_reviews';
DELETE FROM `sys_acl_actions` WHERE `Module` = 'bx_reviews';

-- SEARCH
DELETE FROM `sys_objects_search` WHERE `ObjectName` IN ('bx_reviews', 'bx_reviews_products', 'bx_reviews_cmts');

-- METATAGS
DELETE FROM `sys_objects_metatags` WHERE `object` = 'bx_reviews';

-- CATEGORY
DELETE FROM `sys_objects_category` WHERE `object` = 'bx_reviews_cats';

-- STATS
DELETE FROM `sys_statistics` WHERE `name` LIKE 'bx_reviews%';

-- CHARTS
DELETE FROM `sys_objects_chart` WHERE `object` LIKE 'bx_reviews%';

-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object` IN ('bx_reviews_administration', 'bx_reviews_common', 'bx_reviews_voting_options');
DELETE FROM `sys_grid_fields` WHERE `object` IN ('bx_reviews_administration', 'bx_reviews_common', 'bx_reviews_voting_options');
DELETE FROM `sys_grid_actions` WHERE `object` IN ('bx_reviews_administration', 'bx_reviews_common', 'bx_reviews_voting_options');

-- UPLOADERS
DELETE FROM `sys_objects_uploader` WHERE `object` LIKE 'bx_reviews_%';

-- ALERTS
SET @iHandler := (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = 'bx_reviews' LIMIT 1);
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;
DELETE FROM `sys_alerts_handlers` WHERE `id` = @iHandler;
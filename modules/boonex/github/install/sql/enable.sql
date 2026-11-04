SET @sName = 'bx_github';


-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', @sName, '_bx_github', 'bx_github@modules/boonex/github/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, @sName, '_bx_github', 10);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_github_authorize', 'app', @iCategId, '_bx_github_option_authorize', 'select', 'a:2:{s:6:"module";s:9:"bx_github";s:6:"method";s:21:"get_options_authorize";}', '', '', 10);


-- PAGES

-- PAGE: settings
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES
('bx_github_settings', '_bx_github_page_title_sys_settings', '_bx_github_page_title_settings', @sName, 5, 2147483647, 1, 'github-settings', 'page.php?i=github-settings', '', '', '', 0, 1, 0, 'BxGitHubPageSettings', 'modules/boonex/github/classes/BxGitHubPageSettings.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_github_settings', 1, @sName, '_bx_github_page_block_title_apps', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_github";s:6:"method";s:14:"get_block_apps";}', 0, 0, 1),
('bx_github_settings', 1, @sName, '_bx_github_page_block_title_authorizations', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_github";s:6:"method";s:24:"get_block_authorizations";}', 0, 0, 2),
('bx_github_settings', 1, @sName, '_bx_github_page_block_title_settings', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_github";s:6:"method";s:18:"get_block_settings";}', 0, 0, 3);

-- PAGE: authorize
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES
('bx_github_authorize', '_bx_github_page_title_sys_authorize', '_bx_github_page_title_authorize', @sName, 5, 2147483647, 1, 'github-authorize', 'page.php?i=github-authorize', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_github_authorize', 1, @sName, '_bx_github_page_block_title_authorize', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_github";s:6:"method";s:19:"get_block_authorize";}', 0, 0, 2);


-- MENUS

-- MENU: account settings menu
SET @iMoAccountSettings = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_settings' AND `order` < 9999 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('sys_account_settings', @sName, 'github-settings', '_bx_github_menu_item_title_system_settings', '_bx_github_menu_item_title_settings', 'page.php?i=github-settings', '', '_self', 'github', '', '', 2147483646, 1, 0, 1, @iMoAccountSettings + 1);


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'add app', NULL, '_bx_github_acl_action_add_app', '', 1, 3);
SET @iIdActionAddRepository = LAST_INSERT_ID();

SET @iUnauthenticated = 1;
SET @iAccount = 2;
SET @iStandard = 3;
SET @iUnconfirmed = 4;
SET @iPending = 5;
SET @iSuspended = 6;
SET @iModerator = 7;
SET @iAdministrator = 8;
SET @iPremium = 9;

INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES

-- add repository
(@iModerator, @iIdActionAddRepository),
(@iAdministrator, @iIdActionAddRepository),
(@iPremium, @iIdActionAddRepository);


-- GRIDS: apps
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_github_apps', 'Sql', 'SELECT * FROM `bx_github_apps` WHERE 1 ', 'bx_github_apps', 'id', '', '', '', 20, NULL, 'start', '', 'title,client_id', '', 'like', '', '', 2147483646, 'BxGitHubGridApps', 'modules/boonex/github/classes/BxGitHubGridApps.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_github_apps', 'checkbox', '_sys_select', '5%', 0, 0, '', 1),
('bx_github_apps', 'title', '_bx_github_grid_column_title_apps_title', '30%', 0, 16, '', 2),
('bx_github_apps', 'client_id', '_bx_github_grid_column_title_apps_client_id', '25%', 0, 20, '', 3),
('bx_github_apps', 'callback_url', '_bx_github_grid_column_title_apps_callback_url', '20%', 0, 0, '', 4),
('bx_github_apps', 'actions', '', '20%', 0, 0, '', 5);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_github_apps', 'independent', 'add', '_bx_github_grid_action_title_apps_add', '', 0, 0, 1),
('bx_github_apps', 'bulk', 'delete', '_bx_github_grid_action_title_apps_delete', '', 0, 1, 1),
('bx_github_apps', 'single', 'edit', '_bx_github_grid_action_title_apps_edit', 'pencil-alt', 1, 0, 1),
('bx_github_apps', 'single', 'delete', '_bx_github_grid_action_title_apps_delete', 'remove', 1, 1, 2);


-- GRIDS: authorizations
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_github_authorizations', 'Sql', 'SELECT `tan`.*, `tap`.`title` AS `app_title` FROM `bx_github_authorizations` AS `tan` INNER JOIN `bx_github_apps` AS `tap` ON `tan`.`app_id`=`tap`.`id`  WHERE 1 ', 'bx_github_authorizations', 'id', '', '', '', 20, NULL, 'start', '', '', '', 'like', '', '', 2147483646, 'BxGitHubGridAuthorizations', 'modules/boonex/github/classes/BxGitHubGridAuthorizations.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_github_authorizations', 'checkbox', '_sys_select', '5%', 0, 0, '', 1),
('bx_github_authorizations', 'app_id', '_bx_github_grid_column_title_auth_app_id', '45%', 0, 0, '', 2),
('bx_github_authorizations', 'added', '_bx_github_grid_column_title_auth_added', '10%', 0, 0, '', 3),
('bx_github_authorizations', 'changed', '_bx_github_grid_column_title_auth_changed', '10%', 0, 0, '', 4),
('bx_github_authorizations', 'at_expires_in', '_bx_github_grid_column_title_auth_at_expires_in', '10%', 0, 0, '', 5),
('bx_github_authorizations', 'actions', '', '20%', 0, 0, '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_github_authorizations', 'bulk', 'delete', '_bx_github_grid_action_title_apps_delete', '', 0, 1, 1),
('bx_github_authorizations', 'single', 'refresh', '_bx_github_grid_action_title_apps_refresh', 'redo', 1, 0, 1),
('bx_github_authorizations', 'single', 'delete', '_bx_github_grid_action_title_apps_delete', 'remove', 1, 1, 2);
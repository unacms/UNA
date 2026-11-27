SET @sName = 'bx_reputation';


-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', @sName, '_bx_reputation', 'bx_reputation@modules/boonex/reputation/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, @sName, '_bx_reputation', 10);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_reputation_enable_multilevel', '', @iCategId, '_bx_reputation_option_enable_multilevel', 'checkbox', '', '', '', 1),
('bx_reputation_leaderboard_limit', '10', @iCategId, '_bx_reputation_option_leaderboard_limit', 'digit', '', '', '', 11),
('bx_reputation_history_limit', '20', @iCategId, '_bx_reputation_option_history_limit', 'digit', '', '', '', 13),
('bx_reputation_actions_limit', '20', @iCategId, '_bx_reputation_option_actions_limit', 'digit', '', '', '', 15);


-- PAGE: leaderboard
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_reputation_leaderboard', '_bx_reputation_page_title_sys_leaderboard', '_bx_reputation_page_title_leaderboard', @sName, 13, 2147483647, 1, 'leaderboard', 'page.php?i=leaderboard', '', '', '', 0, 1, 0, 'BxReputationPageBrowse', 'modules/boonex/reputation/classes/BxReputationPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_reputation_leaderboard', 0, @sName, '_bx_reputation_page_block_title_leaderboard_week', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:21:"get_block_leaderboard";s:6:"params";a:2:{i:0;i:0;i:1;i:7;}}', 0, 1, 1),
('bx_reputation_leaderboard', 0, @sName, '_bx_reputation_page_block_title_leaderboard_month', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:21:"get_block_leaderboard";s:6:"params";a:2:{i:0;i:0;i:1;i:30;}}', 0, 1, 1),
('bx_reputation_leaderboard', 0, @sName, '_bx_reputation_page_block_title_leaderboard_all_time', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:21:"get_block_leaderboard";}', 0, 1, 1),
('bx_reputation_leaderboard', 1, @sName, '_bx_reputation_page_block_title_leaderboard', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:21:"get_block_leaderboard";s:6:"params";a:4:{i:0;i:0;i:1;i:0;i:2;b:1;i:3;b:1;}}', 0, 1, 1);

-- PAGE: manage leaderboard
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_reputation_manage', '_bx_reputation_page_title_sys_manage', '_bx_reputation_page_title_manage', @sName, 13, 2147483647, 1, 'reputation-manage', 'page.php?i=reputation-manage', '', '', '', 0, 1, 0, 'BxReputationPageBrowse', 'modules/boonex/reputation/classes/BxReputationPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_reputation_manage', 1, @sName, '_bx_reputation_page_block_title_manage', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:16:"get_block_manage";s:6:"params";a:1:{i:0;i:0;}}', 0, 1, 1);

-- PAGE: history
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_reputation_history', '_bx_reputation_page_title_sys_history', '_bx_reputation_page_title_history', @sName, 13, 2147483647, 1, 'points-history', 'page.php?i=points-history', '', '', '', 0, 1, 0, 'BxReputationPageBrowse', 'modules/boonex/reputation/classes/BxReputationPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_reputation_history', 2, @sName, '_bx_reputation_page_block_title_summary', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:17:"get_block_summary";}', 0, 1, 1),
('bx_reputation_history', 3, @sName, '_bx_reputation_page_block_title_history', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:17:"get_block_history";}', 0, 1, 1);

-- PAGE: info
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_reputation_info', '_bx_reputation_page_title_sys_info', '_bx_reputation_page_title_info', @sName, 13, 2147483647, 1, 'points-info', 'page.php?i=points-info', '', '', '', 0, 1, 0, 'BxReputationPageBrowse', 'modules/boonex/reputation/classes/BxReputationPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_reputation_info', 2, @sName, '_bx_reputation_page_block_title_levels', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:16:"get_block_levels";}', 0, 1, 1),
('bx_reputation_info', 3, @sName, '_bx_reputation_page_block_title_actions', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:17:"get_block_actions";}', 0, 1, 1);

-- PAGES: add page block on home
SET @iPBCellHome = 2;
SET @iPBOrderHome = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = @iPBCellHome ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', @iPBCellHome, @sName, '_bx_reputation_page_block_title_system_summary', '_bx_reputation_page_block_title_summary', 13, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:17:"get_block_summary";}', 0, 0, 1, @iPBOrderHome + 1);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 3;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, @sName, '_bx_reputation_page_block_title_system_summary', '_bx_reputation_page_block_title_summary', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:17:"get_block_summary";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 0);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES 
('', 0, @sName, '_bx_reputation_page_block_title_system_widget', '_bx_reputation_page_block_title_widget', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:13:"bx_reputation";s:6:"method";s:16:"get_block_widget";}', 0, 1, 0, 1, IFNULL(@iBlockOrder, 0) + 1);


-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_reputation_submenu', '_bx_reputation_menu_title_submenu', '_bx_reputation_menu_title_public_submenu', 'bx_reputation_submenu', 'bx_reputation', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_reputation_submenu', 'bx_reputation', '_bx_reputation_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_reputation_submenu', 'bx_reputation', 'leaderboard', '_bx_reputation_menu_item_title_system_leaderboard', '_bx_reputation_menu_item_title_leaderboard', 'page.php?i=leaderboard', '', '', '', '', 2147483647, 1, 1, 1),
('bx_reputation_submenu', 'bx_reputation', 'points-history', '_bx_reputation_menu_item_title_system_points_history', '_bx_reputation_menu_item_title_points_history', 'page.php?i=points-history', '', '', '', '', 2147483647, 1, 1, 2),
('bx_reputation_submenu', 'bx_reputation', 'points-info', '_bx_reputation_menu_item_title_system_points_info', '_bx_reputation_menu_item_title_points_info', 'page.php?i=points-info', '', '', '', '', 2147483647, 1, 1, 3);

-- MENU: add to site menu
SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', @sName, 'leaderboard', '_bx_reputation_menu_item_title_system_leaderboard', '_bx_reputation_menu_item_title_leaderboard', 'page.php?i=leaderboard', '', '', 'star', '', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'edit any entry', NULL, '_bx_reputation_acl_action_edit_any_entry', '', 1, 3);
SET @iIdActionEntryEditAny = LAST_INSERT_ID();

SET @iModerator = 7;
SET @iAdministrator = 8;

INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES

-- edit any entry
(@iModerator, @iIdActionEntryEditAny),
(@iAdministrator, @iIdActionEntryEditAny);


-- GRIDS: administration tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_reputation_handlers', 'Sql', 'SELECT * FROM `bx_reputation_handlers` WHERE 1 ', 'bx_reputation_handlers', 'id', '', 'active', '', 20, NULL, 'start', '', 'type,alert_unit,alert_action', '', 'like', 'reports', '', 192, 'BxReputationGridHandlers', 'modules/boonex/reputation/classes/BxReputationGridHandlers.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_reputation_handlers', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_reputation_handlers', 'switcher', '_bx_reputation_grid_column_title_hdr_active', '8%', 0, 0, '', 2),
('bx_reputation_handlers', 'alert_unit', '_bx_reputation_grid_column_title_hdr_alert_unit', '25%', 0, 0, '', 3),
('bx_reputation_handlers', 'alert_action', '_bx_reputation_grid_column_title_hdr_alert_action', '21%', 0, 0, '', 4),
('bx_reputation_handlers', 'points_active', '_bx_reputation_grid_column_title_hdr_points_active', '12%', 0, 0, '', 5),
('bx_reputation_handlers', 'points_passive', '_bx_reputation_grid_column_title_hdr_points_passive', '12%', 0, 0, '', 6),
('bx_reputation_handlers', 'actions', '', '20%', 0, 0, '', 7);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_reputation_handlers', 'bulk', 'activate', '_bx_reputation_grid_action_title_hdr_activate', '', 0, 0, 1),
('bx_reputation_handlers', 'bulk', 'deactivate', '_bx_reputation_grid_action_title_hdr_deactivate', '', 0, 0, 2),
('bx_reputation_handlers', 'single', 'edit', '_bx_reputation_grid_action_title_hdr_edit', 'pencil-alt', 1, 0, 1);

-- GRIDS: levels
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_reputation_levels', 'Sql', 'SELECT * FROM `bx_reputation_levels` WHERE 1 ', 'bx_reputation_levels', 'id', 'order', 'active', '', 20, NULL, 'start', '', 'name', 'title', 'like', '', '', 192, 'BxReputationGridLevels', 'modules/boonex/reputation/classes/BxReputationGridLevels.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_reputation_levels', 'order', '', '1%', 0, 0, '', 1),
('bx_reputation_levels', 'switcher', '', '9%', 0, 0, '', 2),
('bx_reputation_levels', 'icon', '_bx_reputation_grid_column_title_lvl_icon', '5%', 0, 0, '', 3),
('bx_reputation_levels', 'title', '_bx_reputation_grid_column_title_lvl_title', '35%', 1, 16, '', 4),
('bx_reputation_levels', 'points_in', '_bx_reputation_grid_column_title_lvl_points_in', '10%', 0, 0, '', 5),
('bx_reputation_levels', 'points_out', '_bx_reputation_grid_column_title_lvl_points_out', '10%', 0, 0, '', 6),
('bx_reputation_levels', 'date', '_bx_reputation_grid_column_title_lvl_date', '10%', 0, 0, '', 7),
('bx_reputation_levels', 'actions', '', '20%', 0, 0, '', 8);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_reputation_levels', 'independent', 'add', '_bx_reputation_grid_action_title_lvl_add', '', 0, 0, 1),
('bx_reputation_levels', 'single', 'edit', '_bx_reputation_grid_action_title_lvl_edit', 'pencil-alt', 1, 0, 1),
('bx_reputation_levels', 'single', 'delete', '_bx_reputation_grid_action_title_lvl_delete', 'remove', 1, 1, 2);

-- GRIDS: manage leaderboard
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_reputation_manage_leaderboard', 'Sql', 'SELECT * FROM `bx_reputation_profiles` WHERE 1 AND `profile_id`<>0 ', 'bx_reputation_profiles', 'id', 'points', 'visible', '', 20, NULL, 'start', '', '', '', 'like', '', '', 192, 'BxReputationGridManageLeaderboard', 'modules/boonex/reputation/classes/BxReputationGridManageLeaderboard.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_reputation_manage_leaderboard', 'switcher', '', '10%', 0, 0, '', 1),
('bx_reputation_manage_leaderboard', 'profile_id', '_bx_reputation_grid_column_title_mng_lb_profile_id', '70%', 0, 0, '', 2),
('bx_reputation_manage_leaderboard', 'points', '_bx_reputation_grid_column_title_mng_lb_points', '20%', 0, 0, '', 3);


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxReputationAlertsResponse', 'modules/boonex/reputation/classes/BxReputationAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('profile', 'delete', @iHandler),

('sys_profiles_friends', 'connection_added', @iHandler),
('sys_profiles_friends', 'connection_removed', @iHandler),

('sys_profiles_subscriptions', 'connection_added', @iHandler),
('sys_profiles_subscriptions', 'connection_removed', @iHandler);


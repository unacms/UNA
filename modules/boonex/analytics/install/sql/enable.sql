SET @sName = 'bx_analytics';

-- SETTINGS
SET @iTypeOrder = (SELECT IFNULL(MAX(`order`), 0) + 1 FROM `sys_options_types` WHERE `group` = 'modules');

INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`)
VALUES('modules', @sName, '_bx_analytics_adm_stg_cpt_type', 'bx_analytics@modules/boonex/analytics/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));

SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES(@iTypeId, 'bx_analytics_tracking', '_bx_analytics_adm_stg_cpt_category_tracking', 0, 1);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_analytics_tracking', '_bx_analytics_adm_stg_cpt_tracking', '_bx_analytics_adm_stg_inf_tracking', 'on', 'checkbox', '', '', '', '', 1),
(@iCategoryId, 'bx_analytics_platforms', '_bx_analytics_adm_stg_cpt_platforms', '_bx_analytics_adm_stg_inf_platforms', 'core-web,next-web,rn-ios,rn-android,api,core', 'list', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:21:"get_options_platforms";}', '', '', '', 2),
(@iCategoryId, 'bx_analytics_session_timeout', '_bx_analytics_adm_stg_cpt_session_timeout', '_bx_analytics_adm_stg_inf_session_timeout', '30', 'digit', '', '', '', '', 3),
(@iCategoryId, 'bx_analytics_online_window', '_bx_analytics_adm_stg_cpt_online_window', '_bx_analytics_adm_stg_inf_online_window', '5', 'digit', '', '', '', '', 4),
(@iCategoryId, 'bx_analytics_ignore_params', '_bx_analytics_adm_stg_cpt_ignore_params', '_bx_analytics_adm_stg_inf_ignore_params', 'range, tz, platform, metric, bucket, from, to, f[*], tab_*, page_*', 'text', '', '', '', '', 5),
(@iCategoryId, 'bx_analytics_track_bots', '_bx_analytics_adm_stg_cpt_track_bots', '_bx_analytics_adm_stg_inf_track_bots', 'on', 'checkbox', '', '', '', '', 6);

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES(@iTypeId, 'bx_analytics_privacy', '_bx_analytics_adm_stg_cpt_category_privacy', 0, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_analytics_identity', '_bx_analytics_adm_stg_cpt_identity', '_bx_analytics_adm_stg_inf_identity', 'cookieless', 'select', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:20:"get_options_identity";}', '', '', '', 1),
(@iCategoryId, 'bx_analytics_link_members', '_bx_analytics_adm_stg_cpt_link_members', '_bx_analytics_adm_stg_inf_link_members', 'on', 'checkbox', '', '', '', '', 2),
(@iCategoryId, 'bx_analytics_respect_dnt', '_bx_analytics_adm_stg_cpt_respect_dnt', '_bx_analytics_adm_stg_inf_respect_dnt', 'on', 'checkbox', '', '', '', '', 3),
(@iCategoryId, 'bx_analytics_exclude_levels', '_bx_analytics_adm_stg_cpt_exclude_levels', '_bx_analytics_adm_stg_inf_exclude_levels', '', 'list', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_memberships";s:6:"params";a:0:{}s:5:"class";s:18:"TemplAuditServices";}', '', '', '', 4),
(@iCategoryId, 'bx_analytics_exclude_ips', '_bx_analytics_adm_stg_cpt_exclude_ips', '_bx_analytics_adm_stg_inf_exclude_ips', '', 'text', '', '', '', '', 5),
(@iCategoryId, 'bx_analytics_exclude_paths', '_bx_analytics_adm_stg_cpt_exclude_paths', '_bx_analytics_adm_stg_inf_exclude_paths', '', 'text', '', '', '', '', 6),
(@iCategoryId, 'bx_analytics_trusted_proxies', '_bx_analytics_adm_stg_cpt_trusted_proxies', '_bx_analytics_adm_stg_inf_trusted_proxies', '', 'text', '', '', '', '', 7),
(@iCategoryId, 'bx_analytics_geo_source', '_bx_analytics_adm_stg_cpt_geo_source', '_bx_analytics_adm_stg_inf_geo_source', 'headers', 'select', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:22:"get_options_geo_source";}', '', '', '', 8),
(@iCategoryId, 'bx_analytics_retention_days', '_bx_analytics_adm_stg_cpt_retention_days', '_bx_analytics_adm_stg_inf_retention_days', '400', 'digit', '', '', '', '', 9);

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES(@iTypeId,  'bx_analytics_general', '_bx_analytics_adm_stg_cpt_category_content', 0, 3);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_analytics_modules_disabled', '_bx_analytics_adm_stg_cpt_modules_enabled', '', 'rlist', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:11:"get_modules";}', '', '', '', 1),
(@iCategoryId, 'bx_analytics_items_count', '_bx_analytics_adm_stg_cpt_items_count', '20', 'digit', '', '', '', '', 2),
(@iCategoryId, 'bx_analytics_default_interval_day', '_bx_analytics_adm_stg_cpt_default_interval_day', '90', 'digit', '', '', '', '', 3);

-- PAGES & BLOCKS
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES
('bx_analytics_page', '_bx_analytics_page_title_sys_page', '_bx_analytics_page_title_page', @sName, 10, 2147483647, 1, 'analytics', '', '', '', 'noindex', 0, 1, 0, 'BxAnalyticsPage', 'modules/boonex/analytics/classes/BxAnalyticsPage.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_analytics_page', 1, @sName, '_bx_analytics_page_block_title_system_filters', '_bx_analytics_page_block_title_filters', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:17:"get_block_filters";}', 0, 1, 1, 1),
('bx_analytics_page', 1, @sName, '_bx_analytics_page_block_title_system_overview', '_bx_analytics_page_block_title_overview', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:18:"get_block_overview";}', 0, 1, 1, 2),
('bx_analytics_page', 2, @sName, '_bx_analytics_page_block_title_system_top_pages', '_bx_analytics_page_block_title_top_pages', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:5:"pages";}}', 0, 1, 1, 1),
('bx_analytics_page', 2, @sName, '_bx_analytics_page_block_title_system_top_locations', '_bx_analytics_page_block_title_top_locations', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:9:"locations";}}', 0, 1, 1, 2),
('bx_analytics_page', 2, @sName, '_bx_analytics_page_block_title_system_top_platforms', '_bx_analytics_page_block_title_top_platforms', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:9:"platforms";}}', 0, 1, 1, 3),
('bx_analytics_page', 3, @sName, '_bx_analytics_page_block_title_system_top_sources', '_bx_analytics_page_block_title_top_sources', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:7:"sources";}}', 0, 1, 1, 1),
('bx_analytics_page', 3, @sName, '_bx_analytics_page_block_title_system_top_devices', '_bx_analytics_page_block_title_top_devices', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:7:"devices";}}', 0, 1, 1, 2),
('bx_analytics_page', 4, @sName, '_bx_analytics_page_block_title_system_canvas', '_bx_analytics_page_block_title_canvas', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:10:"get_canvas";}', 0, 1, 1, 1);

-- BLOCKS: every report for the page builder
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('', 0, @sName, '_bx_analytics_page_block_title_system_filters', '_bx_analytics_page_block_title_filters', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:17:"get_block_filters";}', 0, 1, 1, 1),
('', 0, @sName, '_bx_analytics_page_block_title_system_overview', '_bx_analytics_page_block_title_overview', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:18:"get_block_overview";}', 0, 1, 1, 2),
('', 0, @sName, '_bx_analytics_page_block_title_system_top_pages', '_bx_analytics_page_block_title_top_pages', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:5:"pages";}}', 0, 1, 1, 3),
('', 0, @sName, '_bx_analytics_page_block_title_system_top_sources', '_bx_analytics_page_block_title_top_sources', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:7:"sources";}}', 0, 1, 1, 4),
('', 0, @sName, '_bx_analytics_page_block_title_system_top_locations', '_bx_analytics_page_block_title_top_locations', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:9:"locations";}}', 0, 1, 1, 5),
('', 0, @sName, '_bx_analytics_page_block_title_system_top_devices', '_bx_analytics_page_block_title_top_devices', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:7:"devices";}}', 0, 1, 1, 6),
('', 0, @sName, '_bx_analytics_page_block_title_system_top_platforms', '_bx_analytics_page_block_title_top_platforms', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:13:"get_block_top";s:6:"params";a:1:{i:0;s:9:"platforms";}}', 0, 1, 1, 7),
('', 0, @sName, '_bx_analytics_page_block_title_system_table_pages', '_bx_analytics_page_block_title_table_pages', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:15:"get_block_table";s:6:"params";a:1:{i:0;s:5:"pages";}}', 0, 1, 1, 8),
('', 0, @sName, '_bx_analytics_page_block_title_system_table_sources', '_bx_analytics_page_block_title_table_sources', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:15:"get_block_table";s:6:"params";a:1:{i:0;s:7:"sources";}}', 0, 1, 1, 9),
('', 0, @sName, '_bx_analytics_page_block_title_system_realtime', '_bx_analytics_page_block_title_realtime', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:16:"get_block_report";s:6:"params";a:1:{i:0;s:8:"realtime";}}', 0, 1, 1, 10),
('', 0, @sName, '_bx_analytics_page_block_title_system_map', '_bx_analytics_page_block_title_map', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:16:"get_block_report";s:6:"params";a:1:{i:0;s:3:"map";}}', 0, 1, 1, 11),
('', 0, @sName, '_bx_analytics_page_block_title_system_bots', '_bx_analytics_page_block_title_bots', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:16:"get_block_report";s:6:"params";a:1:{i:0;s:4:"bots";}}', 0, 1, 1, 12),
('', 0, @sName, '_bx_analytics_page_block_title_system_canvas', '_bx_analytics_page_block_title_canvas', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:10:"get_canvas";}', 0, 1, 1, 13);

-- STUDIO DASHBOARD: traffic next to the core blocks
SET @iStdDashboardOrder = (SELECT IFNULL(MAX(`order`), 0) + 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_std_dashboard' AND `cell_id` = 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `icon`, `designbox_id`, `class`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_std_dashboard', 1, @sName, '', '_bx_analytics_page_block_title_std_dash_traffic', 'chart-line', 11, 'bx-dbd-block-medium', 0, 0, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:28:"get_studio_dashboard_traffic";}', 0, 0, 1, @iStdDashboardOrder);

-- MENU: account dashboard
SET @iMoAccountDashboard = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard' LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES
('sys_account_dashboard', @sName, 'dashboard-analytics', '_bx_analytics_item_title_system_analytics', '_bx_analytics_item_title_analytics', 'page.php?i=analytics', '', '', 'chart-line', '', '', 2147483647, 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:12:"is_avaliable";}', 1, 0, 1, @iMoAccountDashboard + 1);

-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'use analytics', NULL, '_bx_analytics_acl_action_use_analytics', '', 1, 3);
SET @iIdActionUseAnalytics = LAST_INSERT_ID();

SET @iModerator = 7;
SET @iAdministrator = 8;
INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES
(@iModerator, @iIdActionUseAnalytics),
(@iAdministrator, @iIdActionUseAnalytics);

-- INJECTIONS: the tracker on every page
INSERT INTO `sys_injections` (`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
('bx_analytics_tracker', 0, 'injection_footer', 'service', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:16:"get_tracker_code";}', 0, 1);

-- ALERTS: forget deleted profiles
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES
(@sName, 'BxAnalyticsAlertsResponse', 'modules/boonex/analytics/classes/BxAnalyticsAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('profile', 'delete', @iHandler);

-- CRON: daily salts and data retention
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_analytics_pruning', '15 * * * *', '', '', 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:7:"pruning";}');

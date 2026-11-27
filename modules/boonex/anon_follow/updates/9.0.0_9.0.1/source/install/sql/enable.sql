SET @sName = 'bx_anon_follow';

-- SETTINGS
SET @iTypeOrder = (SELECT IFNULL(MAX(`order`), 0) + 1 FROM `sys_options_types` WHERE `group` = 'modules');

INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) 
VALUES('modules', @sName, '_bx_anon_follow', 'bx_anon_follow@modules/boonex/anon_follow/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));

SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES(@iTypeId,  'bx_anon_follow', '_bx_anon_follow', 0, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_anon_follow_persons_fields', '_bx_anon_follow_persons_fields', '', 'list', 'a:3:{s:6:"module";s:14:"bx_anon_follow";s:6:"method";s:18:"get_profile_fields";s:6:"params";a:1:{i:0;s:10:"bx_persons";}}', '', '', '', 0),
(@iCategoryId, 'bx_anon_follow_orgs_fields', '_bx_anon_follow_orgs_fields', '', 'list', 'a:3:{s:6:"module";s:14:"bx_anon_follow";s:6:"method";s:18:"get_profile_fields";s:6:"params";a:1:{i:0;s:16:"bx_organizations";}}', '', '', '', 1),
(@iCategoryId, 'bx_anon_follow_fields_separator', '_bx_anon_follow_fields_separator', ', ', 'digit', '', '', '', '', 2);

-- PAGES
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('', 2, @sName, '_bx_anon_follow_page_block_title_sys_anon_follow', '_bx_anon_follow_page_block_title_anon_follow', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:14:"bx_anon_follow";s:6:"method";s:19:"subscribed_me_table";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}}', 0, 1, 1, 0),
('', 2, @sName, '_bx_anon_follow_page_block_title_sys_anon_follow_subscriptions', '_bx_anon_follow_page_block_title_anon_follow_subscriptions', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:14:"bx_anon_follow";s:6:"method";s:19:"subscriptions_table";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}}', 0, 1, 1, 0);

-- MENU: add menu item to profiles modules actions menu (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visibility_custom`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_actions', @sName, 'anon-follow', '_bx_anon_follow_menu_item_title_system_follow', '_bx_anon_follow_menu_item_title_follow', 'javascript:void(0)', 'bx_conn_action_anon(this, \'sys_profiles_subscriptions\', \'add\', \'{profile_id}\')', '', 'user-secret', '', 'a:3:{s:6:"module";s:14:"bx_anon_follow";s:6:"method";s:19:"check_is_subscribed";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 2147483646, 1, 0, 0),
('trigger_profile_snippet_meta', @sName, 'anon-follow', '_bx_anon_follow_menu_item_title_system_follow', '_bx_anon_follow_menu_item_title_follow', 'javascript:void(0)', 'bx_conn_action_anon(this, \'sys_profiles_subscriptions\', \'add\', \'{profile_id}\')', '', 'user-secret', '', '', 2147483646, 1, 0, 0);

-- GRID: connections
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_anon_follow_grid_subscribed_me', 'Sql', 'SELECT `p`.`id`, `c`.`added`, `c2`.`id` AS `anonimus` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections} {join_connections2}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 'BxAnonFollowGridSubscribedMe', 'modules/boonex/anon_follow/classes/BxAnonFollowGridSubscribedMe.php'),
('bx_anon_follow_grid_subscriptions', 'Sql', 'SELECT `p`.`id`, `c`.`added`, `c2`.`id` AS `anonimus` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections} {join_connections2}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 'BxAnonFollowGridSubscriptions', 'modules/boonex/anon_follow/classes/BxAnonFollowGridSubscriptions.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_anon_follow_grid_subscribed_me', 'name', '_sys_name', '70%', '', 1),
('bx_anon_follow_grid_subscribed_me', 'actions', '', '30%', '', 2),
('bx_anon_follow_grid_subscriptions', 'name', '_sys_name', '70%', '', 1),
('bx_anon_follow_grid_subscriptions', 'actions', '', '30%', '', 2);


INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_anon_follow_grid_subscribed_me', 'single', 'subscribe', '_sys_subscribe', 'check', 0, 1),
('bx_anon_follow_grid_subscriptions', 'single', 'subscribe', '_sys_subscribe', 'check', 0, 1),
('bx_anon_follow_grid_subscriptions', 'single', 'delete', '', 'remove', 1, 2);

-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxAnonFollowAlertsResponse', 'modules/boonex/anon_follow/classes/BxAnonFollowAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('sys_profiles_subscriptions', 'connection_added', @iHandler),
('sys_profiles_subscriptions', 'connection_removed', @iHandler),
('bx_persons', 'menu_custom_item', @iHandler),
('bx_organizations', 'menu_custom_item', @iHandler);

-- INJECTION
INSERT INTO `sys_injections`(`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
(@sName, 0, 'injection_header', 'service', 'a:2:{s:6:"module";s:14:"bx_anon_follow";s:6:"method";s:10:"include_js";}', '0', '1');


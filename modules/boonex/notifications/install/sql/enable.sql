SET @sName = 'bx_notifications';


-- PAGES & BLOCKS
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_notifications_view', '_bx_ntfs_page_title_system_view', '_bx_ntfs_page_title_view', @sName, 5, 2147483647, 1, 'notifications-view', 'page.php?i=notifications-view', '', '', '', 0, 1, 0, 'BxNtfsPageView', 'modules/boonex/notifications/classes/BxNtfsPageView.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_notifications_view', 1, @sName, '_bx_ntfs_page_block_title_view', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:14:"get_block_view";}', 0, 1, 1);

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_notifications_settings', '_bx_ntfs_page_title_system_settings', '_bx_ntfs_page_title_settings', @sName, 1, 2147483647, 1, 'notifications-settings', 'page.php?i=notifications-settings', '', '', '', 0, 1, 0, 'BxNtfsPageSettings', 'modules/boonex/notifications/classes/BxNtfsPageSettings.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_notifications_settings', 1, @sName, '_bx_ntfs_page_block_title_delivery', 13, 2147483644, 'menu', 'bx_notifications_settings', 0, 0, 1),
('bx_notifications_settings', 2, @sName, '_bx_ntfs_page_block_title_settings', 13, 2147483644, 'service', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:18:"get_block_settings";}', 0, 1, 1);

-- PAGES: add page block on dashboard
SET @iPBCellDashboard = 3;
SET @iPBOrderDashboard = 4; --(SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `cell_id` = @iPBCellDashboard LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_dashboard', @iPBCellDashboard, @sName, '_bx_ntfs_page_block_title_view', 11, 2147483644, 'service', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:14:"get_block_view";}', 0, 0, 0, @iPBOrderDashboard);


-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_notifications_submenu', '_bx_ntfs_menu_title_submenu', '_bx_ntfs_menu_title_public_submenu', 'bx_notifications_submenu', @sName, 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_notifications_submenu', @sName, '_bx_ntfs_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_notifications_submenu', @sName, 'notifications-all', '_bx_ntfs_menu_item_title_system_notifications_all', '_bx_ntfs_menu_item_title_notifications_all', 'page.php?i=notifications-view', '', '', '', '', 2147483647, 1, 0, 1);

-- MENU: preview popup
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_notifications_preview', '_bx_ntfs_menu_title_preview', 'bx_notifications_preview', @sName, 20, 0, 1, 'BxNtfsMenuPreview', 'modules/boonex/notifications/classes/BxNtfsMenuPreview.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_notifications_preview', @sName, '_bx_ntfs_menu_set_title_preview', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_notifications_preview', @sName, 'more', '_bx_ntfs_menu_item_title_system_more', '_bx_ntfs_menu_item_title_more', 'page.php?i=notifications-view', '', '', '', '', 2147483647, 1, 0, 1);

-- MENU: settings sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_notifications_settings', '_bx_ntfs_menu_title_settings', 'bx_notifications_settings', @sName, 6, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_notifications_settings', @sName, '_bx_ntfs_menu_set_title_settings', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_notifications_settings', @sName, 'notifications-site', '_bx_ntfs_menu_item_title_system_notifications_site', '_bx_ntfs_menu_item_title_notifications_site', 'page.php?i=notifications-settings&delivery=site', '', '', '', '', 2147483647, 1, 0, 10),
('bx_notifications_settings', @sName, 'notifications-email', '_bx_ntfs_menu_item_title_system_notifications_email', '_bx_ntfs_menu_item_title_notifications_email', 'page.php?i=notifications-settings&delivery=email', '', '', '', '', 2147483647, 1, 0, 20),
('bx_notifications_settings', @sName, 'notifications-push', '_bx_ntfs_menu_item_title_system_notifications_push', '_bx_ntfs_menu_item_title_notifications_push', 'page.php?i=notifications-settings&delivery=push', '', '', '', '', 2147483647, 1, 0, 30);

-- MENU: member toolbar
SET @iMenuToolbarMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_toolbar_member' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `markers`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `hidden_on`, `active`, `copyable`, `order`) VALUES 
('sys_toolbar_member', @sName, 'notifications-preview', '_bx_ntfs_menu_item_title_system_preview', '_bx_ntfs_menu_item_title_preview', 'javascript:void(0)', 'bx_menu_slide(''bx_notifications_preview'', $(this).parents(''ul:first''), ''site'', {id:{value:''bx_notifications_preview'', force:1}, pointer:{align:''right''}, cssClass: ''''});', '', 'bell', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:28:"get_unread_notifications_num";}', '', 'bx_notifications_preview', 1, 2147483646, 9, 1, 1, 0);

-- MENU: notifications
SET @iMIOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_ntfs_submenu' AND `order` < 9999);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `markers`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `hidden_on`, `active`, `copyable`, `order`) VALUES
('sys_ntfs_submenu', @sName, 'notifications-view', '_bx_ntfs_menu_item_title_system_notifications', '_bx_ntfs_menu_item_title_notifications', 'page.php?i=notifications-view', '', '', 'bell', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:28:"get_unread_notifications_num";}', '', 'bx_notifications_preview', 1, 2147483646, 0, 1, 1, @iMIOrder + 1);

-- MENU: account notifications
SET @iMIOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_account_notifications' AND `order` < 9999);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `markers`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `hidden_on`, `active`, `copyable`, `order`) VALUES
('sys_account_notifications', @sName, 'notifications-notifications', '_bx_ntfs_menu_item_title_system_notifications', '_bx_ntfs_menu_item_title_notifications', 'javascript:void(0)', 'bx_menu_slide(''bx_notifications_preview'', this, ''site'', {id:{value:''bx_notifications_preview'', force:1}});', '', 'bell', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:28:"get_unread_notifications_num";}', '', 'bx_notifications_preview', 1, 2147483646, 6, 1, 1, @iMIOrder + 1);

-- MENU: account settings menu
SET @iMoAccountSettings = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_settings' AND `order` < 9999 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('sys_account_settings', @sName, 'notifications-settings', '_bx_ntfs_menu_item_title_system_notifications', '_bx_ntfs_menu_item_title_notifications', 'page.php?i=notifications-settings', '', '', 'bell', '', '', 2147483646, 1, 0, 1, @iMoAccountSettings + 1);


-- SETTINGS
SET @iTypeOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', @sName, '_bx_ntfs', 'bx_notifications@modules/boonex/notifications/|std-icon.svg', @iTypeOrder + 1);
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'bx_notifications_system', '_bx_ntfs_options_category_system', 1, 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_notifications_events_hide_site', '', @iCategId, '_bx_ntfs_option_events_hide_site', 'rlist', '', '', '', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:21:"get_actions_checklist";}', 1),
('bx_notifications_events_hide_email', '', @iCategId, '_bx_ntfs_option_events_hide_email', 'rlist', '', '', '', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:21:"get_actions_checklist";}', 2),
('bx_notifications_events_hide_push', '', @iCategId, '_bx_ntfs_option_events_hide_push', 'rlist', '', '', '', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:21:"get_actions_checklist";}', 3),
('bx_notifications_processed_event', '', @iCategId, '_bx_ntfs_option_processed_event', 'digit', '', '', '', '', 10);

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, @sName, '_bx_ntfs', 0, 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `info`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_notifications_events_per_page', '24', @iCategId, '_bx_ntfs_option_events_per_page', '', 'digit', '', '', '', '', 1),
('bx_notifications_events_per_preview', '5', @iCategId, '_bx_ntfs_option_events_per_preview', '', 'digit', '', '', '', '', 5),
('bx_notifications_enable_group_settings', 'on', @iCategId, '_bx_ntfs_option_enable_group_settings', '', 'checkbox', '', '', '', '', 10), 
('bx_notifications_enable_group_events', 'on', @iCategId, '_bx_ntfs_option_enable_group_events', '', 'checkbox', '', '', '', '', 11), 
('bx_notifications_enable_group_events_db', '', @iCategId, '_bx_ntfs_option_enable_group_events_db', '', 'checkbox', '', '', '', '', 13), 
('bx_notifications_enable_clicked_indicator', '', @iCategId, '_bx_ntfs_option_enable_clicked_indicator', '', 'checkbox', '', '', '', '', 15),
('bx_notifications_delivery_timeout', '120', @iCategId, '_bx_ntfs_option_delivery_timeout', '_bx_ntfs_option_delivery_timeout_inf', 'digit', '', '', '', '', 20),
('bx_notifications_queue_add_threshold', '0', @iCategId, '_bx_ntfs_option_queue_add_threshold', '_bx_ntfs_option_queue_add_threshold_inf', 'digit', '', '', '', '', 21),
('bx_notifications_queue_add_limit', '200', @iCategId, '_bx_ntfs_option_queue_add_limit', '_bx_ntfs_option_queue_add_limit_inf', 'digit', '', '', '', '', 22),
('bx_notifications_clear_interval', '90', @iCategId, '_bx_ntfs_option_clear_interval', '', 'digit', '', '', '', '', 30),
('bx_notifications_enable_own_actions', '', @iCategId, '_bx_ntfs_option_enable_own_actions', '', 'checkbox', '', '', '', '', 40),
('bx_notifications_enable_comment_post_ext', '', @iCategId, '_bx_ntfs_option_enable_comment_post_ext', '', 'checkbox', '', '', '', '', 41),
('bx_notifications_enable_reply_as_comment', 'on', @iCategId, '_bx_ntfs_option_enable_reply_as_comment', '', 'checkbox', '', '', '', '', 42),
('bx_notifications_summary_chars', '200', @iCategId, '_bx_ntfs_option_summary_chars', '', 'digit', '', '', '', '', 50),
('bx_notifications_owner_name_chars', '21', @iCategId, '_bx_ntfs_option_owner_name_chars', '', 'digit', '', '', '', '', 51),
('bx_notifications_content_chars', '32', @iCategId, '_bx_ntfs_option_content_chars', '', 'digit', '', '', '', '', 52),
('bx_notifications_email_subject_chars', '30', @iCategId, '_bx_ntfs_option_email_subject_chars', '', 'digit', '', '', '', '', 53),
('bx_notifications_push_message_chars', '190', @iCategId, '_bx_ntfs_option_push_message_chars', '', 'digit', '', '', '', '', 54);


-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_notifications_privacy_view', @sName, 'view', '_bx_notifications_privacy_view', '3', 'bx_notifications_events', 'id', 'owner_id', 'BxNtfsPrivacy', 'modules/boonex/notifications/classes/BxNtfsPrivacy.php');


-- LIVE UPDATES
INSERT INTO `sys_objects_live_updates`(`name`, `frequency`, `service_call`, `active`) VALUES
(@sName, 1, 'a:3:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:16:"get_live_updates";s:6:"params";a:3:{i:0;a:2:{s:11:"menu_object";s:18:"sys_toolbar_member";s:9:"menu_item";s:7:"account";}i:1;a:2:{s:11:"menu_object";s:25:"sys_account_notifications";s:9:"menu_item";s:27:"notifications-notifications";}i:2;s:7:"{count}";}}', 1),
('bx_notifications_toolbar', 1, 'a:3:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:16:"get_live_updates";s:6:"params";a:3:{i:0;a:0:{}i:1;a:2:{s:11:"menu_object";s:18:"sys_toolbar_member";s:9:"menu_item";s:21:"notifications-preview";}i:2;s:7:"{count}";}}', 1);


-- ALERTS
INSERT INTO `sys_alerts_handlers`(`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxNtfsResponse', 'modules/boonex/notifications/classes/BxNtfsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('profile', 'delete', @iHandler),

('comment', 'added', @iHandler),
('comment', 'deleted', @iHandler),

('meta_mention', 'added', @iHandler),

('sys_profiles_friends', 'connection_added', @iHandler),
('sys_profiles_friends', 'connection_removed', @iHandler),

('sys_profiles_subscriptions', 'connection_added', @iHandler),
('sys_profiles_subscriptions', 'connection_removed', @iHandler),

('sys_cmts', 'doVote', @iHandler),
('sys_cmts', 'undoVote', @iHandler),

('sys_cmts_reactions', 'doVote', @iHandler),
('sys_cmts_reactions', 'undoVote', @iHandler),

('sys_cmts', 'doVoteUp', @iHandler),
('sys_cmts', 'doVoteDown', @iHandler),

('sys_cmts', 'reported_content', @iHandler);


-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
(@sName, '_bx_ntfs_email_new_event', 'bx_notifications_new_event', '_bx_ntfs_email_new_event_subject', '_bx_ntfs_email_new_event_body');


-- GRIDS
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_notifications_settings_administration', 'Sql', 'SELECT `ts`.*, `th`.`alert_unit` AS `unit`, `th`.`alert_action` AS `action` FROM `bx_notifications_settings` AS `ts` LEFT JOIN `bx_notifications_handlers` AS `th` ON `ts`.`handler_id`=`th`.`id` WHERE 1 ', 'bx_notifications_settings', 'id', 'order', 'active', '', 100, NULL, 'start', '', '', 'ts`.`title', 'auto', '', 192, 'BxNtfsGridSettingsAdministration', 'modules/boonex/notifications/classes/BxNtfsGridSettingsAdministration.php'),
('bx_notifications_settings_common', 'Sql', 'SELECT `tsu`.`id` AS `id`, `ts`.`group` AS `group`, `ts`.`id` AS `setting_id`, `ts`.`type` AS `type`, `ts`.`delivery` AS `delivery`, `ts`.`title` AS `title`, `tsu`.`active` AS `active`, `ts`.`order` AS `order`, `th`.`alert_unit` AS `unit`, `th`.`alert_action` AS `action` FROM `bx_notifications_settings` AS `ts` LEFT JOIN `bx_notifications_handlers` AS `th` ON `ts`.`handler_id`=`th`.`id` LEFT JOIN `bx_notifications_settings2users` AS `tsu` ON `ts`.`id`=`tsu`.`setting_id` WHERE `ts`.`active`=''1'' ', 'bx_notifications_settings2users', 'id', 'order', 'active', '', 100, NULL, 'start', '', '', 'ts`.`title', 'auto', '', 2147483647, 'BxNtfsGridSettingsCommon', 'modules/boonex/notifications/classes/BxNtfsGridSettingsCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_notifications_settings_administration', 'checkbox', '', '1%', 0, '', '', 1),
('bx_notifications_settings_administration', 'switcher', '_bx_ntfs_grid_column_title_active', '10%', 0, '', '', 2),
('bx_notifications_settings_administration', 'title', '_bx_ntfs_grid_column_title_title', '79%', 1, '', '', 10),
('bx_notifications_settings_administration', 'value', '_bx_ntfs_grid_column_title_value', '10%', 0, '', '', 20),

('bx_notifications_settings_common', 'checkbox', '', '1%', 0, '', '', 1),
('bx_notifications_settings_common', 'switcher', '', '10%', 0, '', '', 2),
('bx_notifications_settings_common', 'title', '_bx_ntfs_grid_column_title_title', '89%', 1, '', '', 10);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_notifications_settings_administration', 'bulk', 'activate', '_bx_ntfs_grid_action_title_activate', '', 1, 1),
('bx_notifications_settings_administration', 'bulk', 'deactivate', '_bx_ntfs_grid_action_title_deactivate', '', 1, 2),

('bx_notifications_settings_common', 'bulk', 'activate', '_bx_ntfs_grid_action_title_activate', '', 1, 1),
('bx_notifications_settings_common', 'bulk', 'deactivate', '_bx_ntfs_grid_action_title_deactivate', '', 1, 2);

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_notifications_etemplates', 'Sql', 'SELECT * FROM `bx_notifications_etemplates` WHERE 1 ', 'bx_notifications_etemplates', 'id', '', 'active', '', 100, NULL, 'start', '', '', 'type,action,subject,content', 'auto', '', 2147483647, 'BxNtfsGridEtemplates', 'modules/boonex/notifications/classes/BxNtfsGridEtemplates.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_notifications_etemplates', 'switcher', '_bx_ntfs_grid_column_title_ett_active', '10%', 0, '', '', 10),
('bx_notifications_etemplates', 'type', '_bx_ntfs_grid_column_title_ett_type', '15%', 0, '', '', 20),
('bx_notifications_etemplates', 'action', '_bx_ntfs_grid_column_title_ett_action', '15%', 0, '', '', 30),
('bx_notifications_etemplates', 'subject', '_bx_ntfs_grid_column_title_ett_subject', '40%', 0, '', '', 40),
('bx_notifications_etemplates', 'actions', '', '20%', 0, '', '', 50);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_notifications_etemplates', 'independent', 'add', '_bx_ntfs_grid_action_title_ett_add', '', 0, 0, 1),
('bx_notifications_etemplates', 'single', 'preview', '_bx_ntfs_grid_action_title_ett_preview', 'eye', 1, 0, 1),
('bx_notifications_etemplates', 'single', 'edit', '_bx_ntfs_grid_action_title_ett_edit', 'pencil-alt', 1, 0, 2),
('bx_notifications_etemplates', 'single', 'delete', '_bx_ntfs_grid_action_title_ett_delete', 'remove', 1, 1, 3);


-- CRON
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_notifications_queue', '* * * * *', 'BxNtfsCronQueue', 'modules/boonex/notifications/classes/BxNtfsCronQueue.php', ''),
('bx_notifications_notify', '* * * * *', 'BxNtfsCronNotify', 'modules/boonex/notifications/classes/BxNtfsCronNotify.php', ''),
('bx_notifications_clean', '0 0 * * *', 'BxNtfsCronClean', 'modules/boonex/notifications/classes/BxNtfsCronClean.php', '');

SET @sName = 'bx_messenger';

-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', @sName, '_bx_messenger', 'bx_messenger@modules/boonex/messenger/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, @sName, '_bx_messenger', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_messenger_max_symbols_number', 64000, @iCategId, '_bx_messenger_symbols_num_option', 'digit', '', '', '', 1),
('bx_messenger_max_symbols_brief_jot', 145, @iCategId, '_bx_messenger_symbols_num_brief_jot', 'digit', '', '', '', 2),
('bx_messenger_max_jot_number_default', 20, @iCategId, '_bx_messenger_jot_number_default', 'digit', '', '', '', 3),
('bx_messenger_max_jot_number_in_history', 30, @iCategId, '_bx_messenger_max_jot_number_in_history', 'digit', '', '', '', 4),
('bx_messenger_max_lots_number', 15, @iCategId, '_bx_messenger_max_max_lots_number', 'digit', '', '', '', 5),
('bx_messenger_server_url', '', @iCategId, '_bx_messenger_server_url', 'digit', '', '', '', 6),
('bx_messenger_max_files_send', 5, @iCategId, '_bx_messenger_max_files_upload', 'digit', '', '', '', 7),
('bx_messenger_max_video_length_minutes', 5, @iCategId, '_bx_messenger_max_video_file_size', 'digit', '', '', '', 8),
('bx_messenger_max_ntfs_number', 5, @iCategId, '_bx_messenger_max_ntfs_number', 'digit', '', '', '', 9),
('bx_messenger_max_parts_views', 10, @iCategId, '_bx_messenger_max_parts_views', 'digit', '', '', '', 10),
('bx_messenger_max_drop_down_select', 5, @iCategId, '_bx_messenger_max_drop_down_select', 'digit', '', '', '', 11),
('bx_messenger_allow_to_remove_messages', 'on', @iCategId, '_bx_messenger_allow_to_remove_messages', 'checkbox', '', '', '', 12),
('bx_messenger_allow_to_moderate_messages', 'on', @iCategId, '_bx_messenger_allow_to_moderate_messages', 'checkbox', '', '', '', 13),
('bx_messenger_enable_joined_organizations', '', @iCategId, '_bx_messenger_enable_joined_organizations', 'checkbox', '', '', '', 14),
('bx_messenger_show_friends', 'on', @iCategId, '_bx_messenger_show_friends', 'checkbox', '', '', '', 15),
('bx_messenger_remove_messages_immediately', '', @iCategId, '_bx_messenger_remove_messages_immediately', 'checkbox', '', '', '', 16),
('bx_messenger_use_embedly', 'on', @iCategId, '_bx_messenger_use_embedly', 'checkbox', '', '', '', 17),
('bx_messenger_giphy_key', '', @iCategId, '_bx_messenger_giphy_api_key', 'digit', '', '', '', 18),
('bx_messenger_giphy_type', 'gifs', @iCategId, '_bx_messenger_giphy_type', 'select', '', '', 'gifs,stickers', 19),
('bx_messenger_giphy_content_rating', 'g', @iCategId, '_bx_messenger_giphy_content_rating', 'select', '', '', 'g,pg,pg-13,r', 20),
('bx_messenger_giphy_limit', 15, @iCategId, '_bx_messenger_giphy_limit', 'digit', '', '', '', 21),
('bx_messenger_emoji_set', 'native', @iCategId, '_bx_messenger_emoji_set', 'select', '', '', 'native,apple,google,twitter,emojione,facebook,messenger', 22),
('bx_messenger_reactions_size', 16, @iCategId, '_bx_messenger_reactions_size', 'select', '', '', '16,20,24,32', 23),
('bx_messenger_show_emoji_preview', '', @iCategId, '_bx_messenger_show_emoji_preview', 'checkbox', '', '', '', 24),
('bx_messenger_jitsi_enable', 'on', @iCategId, '_bx_messenger_allow_to_use_jitsi', 'checkbox', '', '', '', 25),
('bx_messenger_jitsi_server', 'meet.jit.si', @iCategId, '_bx_messenger_jitsi_server', 'digit', '', '', '', 26),
('bx_messenger_jitsi_chat', '', @iCategId, '_bx_messenger_jitsi_chat_enable', 'checkbox', '', '', '', 27),
('bx_messenger_jitsi_sync', '', @iCategId, '_bx_messenger_jitsi_chat_sync', 'checkbox', '', '', '', 28),
('bx_messenger_jitsi_hide_info', '', @iCategId, '_bx_messenger_jitsi_hide_info', 'checkbox', '', '', '', 29),
('bx_messenger_jitsi_enable_watermark', '', @iCategId, '_bx_messenger_jitsi_watermark', 'checkbox', '', '', '', 30),
('bx_messenger_jitsi_watermark_link', '', @iCategId, '_bx_messenger_jitsi_watermark_link', 'digit', '', '', '', 31),
('bx_messenger_jitsi_only_for_private', 'on', @iCategId, '_bx_messenger_jitsi_enable_only_for_private', 'checkbox', '', '', '', 32),
('bx_messenger_jitsi_support_url', 'https://community.jitsi.org/', @iCategId, '_bx_messenger_jitsi_support_url', 'digit', '', '', '', 33),
('bx_messenger_disable_contact_privacy', '', @iCategId, '_bx_messenger_disable_contact_privacy', 'checkbox', '', '', '', 34),
('bx_messenger_enable_mentions', 'on', @iCategId, '_bx_messenger_use_mentions', 'checkbox', '', '', '', 35),
('bx_messenger_jwt_app_id', '', @iCategId, '_bx_messenger_jwt_app_id', 'digit', '', '', '', 36),
('bx_messenger_jwt_app_secret', '', @iCategId, '_bx_messenger_jwt_app_secret', 'digit', '', '', '', 37),
('bx_messenger_check_toxic', '', @iCategId, '_bx_messenger_check_toxic', 'checkbox', '', '', '', 38),
('bx_messenger_jot_server_jwt', '', @iCategId, '_bx_messenger_jot_server_jwt', 'digit', '', '', '', 39),
('bx_messenger_search_criteria', 'titles,participants,content', @iCategId, '_bx_messenger_search_criteria_list', 'list', '', '', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:18:"get_search_options";}', 40),
('bx_messenger_connect_friends_only', '', @iCategId, '_bx_messenger_connect_friends_only', 'checkbox', '', '', '', 41),
('bx_messenger_time_in_history', '', @iCategId, '_bx_messenger_time_in_history', 'checkbox', '', '', '', 42),
('bx_messenger_dont_show_search_desc', '', @iCategId, '_bx_messenger_dont_show_search_desc', 'checkbox', '', '', '', 43),
('bx_messenger_use_unique_mode', '', @iCategId, '_bx_messenger_use_unique_mode', 'checkbox', '', '', '', 44),
('bx_messenger_dont_update_title', '', @iCategId, '_bx_messenger_dont_update_title', 'checkbox', '', '', '', 45),
('bx_messenger_broadcast_fields', 'membership,gender,countries,birthday', @iCategId, '_bx_messenger_broadcast_fields', 'list', '', '', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:20:"get_broadcast_fields";}', 46);

-- MENU: notifications
SET @iMIOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_toolbar_member' AND `order` < 9999);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`, `visibility_custom`, `hidden_on`) VALUES
('sys_toolbar_member', @sName, 'notifications-messenger', '_bx_messenger_menu_notifications_item_sys_title', '', 'page.php?i=messenger', '', '', 'far comments col-green1', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:20:"get_updated_lots_num";}', '', 2147483646, 1, 1, @iMIOrder + 1, '', 9),
('trigger_profile_view_actions', @sName, 'messenger', '_bx_messenger_menu_new_chat_sys_title', '_bx_messenger_menu_new_chat_action_title', 'page.php?i=messenger&profile_id={profile_id}', '', '', 'far comments', '', '', 2147483646, 1, 0, 0, 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:18:"is_contact_allowed";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', ''),
('trigger_profile_view_actions', @sName, 'public-vc-messenger', '_bx_messenger_menu_video_conference_sys_title', '_bx_messenger_menu_video_conference_action_title', 'javascript:void(0)', 'javascript:oMUtils.showConferenceWindow(''modules/?r=messenger/get_video_conference_form/{profile_id}'')', '', 'video', '', '', 2147483646, 1, 0, 0, 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:27:"is_video_conference_allowed";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', '');

SET @iMIOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_account_notifications' AND `order` < 9999);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`, `visibility_custom`, `hidden_on`) VALUES
('sys_account_notifications', @sName, 'notifications-messenger', '_bx_messenger_menu_notifications_item_sys_title', '_bx_messenger_menu_notifications_item_title', 'page.php?i=messenger', '', '', 'far comments col-green1', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:20:"get_updated_lots_num";}', '', 2147483646, 1, 1, @iMIOrder + 2, '', 6);

-- PAGE: module home
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`, `cover`) VALUES 
('bx_messenger_main', '_bx_messenger_page_title_sys_main', '_bx_messenger_page_title_main', @sName, 5, 2147483647, 1, 'messenger', 'page.php?i=messenger', '', '', '', 0, 1, 0, 'BxMessengerPageMain', 'modules/boonex/messenger/classes/BxMessengerPageMain.php', 0);

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_messenger_main', 1, @sName, '_bx_messenger_page_main_messenger_block', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:23:"get_main_messenger_page";}', 0, 0, 0);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 2;
SET @iPBCellGroup = 4;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `tabs`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, @sName, '_bx_messenger_page_block_title_messenger', 11, 1, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:19:"get_block_messenger";s:6:"params";a:1:{i:0;s:6:"{type}";}}', 0, 0, 0, 0),
('trigger_page_group_view_entry', @iPBCellGroup, @sName, '_bx_messenger_page_block_title_messenger', 11, 1, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:19:"get_block_messenger";s:6:"params";a:1:{i:0;s:6:"{type}";}}', 0, 0, 0, 0);

-- PAGE: service blocks
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `tabs`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
('', 0, @sName, '_bx_messenger_page_block_title_messenger', 11, 1, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:19:"get_block_messenger";s:6:"params";a:1:{i:0;s:6:"{type}";}}', 1, 1, 0, 0);

-- PAGE: service my contacts block
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `tabs`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
('', 0, @sName, '_bx_messenger_page_block_contacts_title', 11, 1, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:28:"get_block_contacts_messenger";}}', 1, 1, 0, 0);

-- PAGES: add page block on home
SET @iPBCellHome = 1;
SET @iPBOrderHome = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = @iPBCellHome ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `tabs`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
('sys_home', @iPBCellHome, @sName, '_bx_messenger_home_page_all_members_block', 11, 1, 2147483647, 'service', 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:19:"get_block_messenger";s:6:"params";a:1:{i:0;s:7:"members";}}', 0, 0, @iPBOrderHome + 1, 0);

-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_messenger', '', '', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:24:"delete_history_by_author";}');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('profile', 'delete', @iHandler);

-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES
('bx_messenger_actions', '', '', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:8:"response";}');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('bx_groups', 'fan_added', @iHandler),
('bx_events', 'fan_added', @iHandler),
('bx_organizations', 'fan_added', @iHandler),
('bx_spaces', 'fan_added', @iHandler),
('bx_events_fans','connection_removed', @iHandler),
('bx_groups_fans','connection_removed', @iHandler),
('bx_organizations_fans','connection_removed', @iHandler),
('bx_spaces_fans','connection_removed', @iHandler);

-- LIVE UPDATES
INSERT INTO `sys_objects_live_updates`(`name`, `frequency`, `service_call`, `active`) VALUES
('bx_messenger_new_messages', 1, 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:16:"get_live_updates";s:6:"params";a:3:{i:0;a:0:{}i:1;a:2:{s:11:"menu_object";s:18:"sys_toolbar_member";s:9:"menu_item";s:23:"notifications-messenger";}i:2;s:7:"{count}";}}', 1);

INSERT INTO `sys_objects_live_updates`(`name`, `frequency`, `service_call`, `active`) VALUES
('bx_messenger_public_video_conference', 1, 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:19:"get_live_vc_updates";s:6:"params";a:1:{i:1;s:7:"{count}";}}', 1);

REPLACE INTO `sys_storage_mime_types` (`ext`, `mime_type`, `icon`, `icon_font`) VALUES
('x-matroska', 'video/x-matroska', '', '');

-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'video conference', NULL, '_bx_messenger_acl_action_video_conference', '', 1, 0);
SET @iIdActionEntryIMCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'create talks', NULL, '_bx_messenger_acl_action_create_talks', '', 1, 0);
SET @iIdActionEntryTalkCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'send messages', NULL, '_bx_messenger_acl_action_send_messages', '', 1, 0);
SET @iIdActionSendMessage = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'edit messages', NULL, '_bx_messenger_acl_action_edit_messages', '', 1, 0);
SET @iIdActionEditMessages = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'delete messages', NULL, '_bx_messenger_acl_action_delete_messages', '', 1, 0);
SET @iIdActionDeleteMessages = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'administrate talks', NULL, '_bx_messenger_acl_action_administrate_talks', '', 1, 0);
SET @iIdActionAdminTalks = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'create broadcasts', NULL, '_bx_messenger_acl_action_create_broadcast', '', 1, 0);
SET @iIdActionBroadcastTalks = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'create vc', NULL, '_bx_messenger_acl_action_create_vc', '', 1, 0);
SET @iIdActionVCCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'video recorder', NULL, '_bx_messenger_acl_action_video_recorder', '', 1, 0);
SET @iIdActionVRecorder = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'join vc', NULL, '_bx_messenger_acl_action_join_vc', '', 1, 0);
SET @iIdActionVCJoin = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'join personal vc', NULL, '_bx_messenger_acl_action_join_personal_vc', '', 1, 0);
SET @iIdActionVCPJoin = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'send files', NULL, '_bx_messenger_acl_action_send_files', '', 1, 0);
SET @iIdActionSendFiles = LAST_INSERT_ID();

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
-- IM video conference
(@iStandard, @iIdActionEntryIMCreate),
(@iModerator, @iIdActionEntryIMCreate),
(@iAdministrator, @iIdActionEntryIMCreate),
(@iPremium, @iIdActionEntryIMCreate),
-- JOIN talks' video conference
(@iStandard, @iIdActionVCJoin),
(@iModerator, @iIdActionVCJoin),
(@iAdministrator, @iIdActionVCJoin),
(@iPremium, @iIdActionVCJoin),
-- JOIN personal video conference
(@iStandard, @iIdActionVCPJoin),
(@iModerator, @iIdActionVCPJoin),
(@iAdministrator, @iIdActionVCPJoin),
(@iPremium, @iIdActionVCPJoin),
-- video conference
(@iStandard, @iIdActionVCCreate),
(@iModerator, @iIdActionVCCreate),
(@iAdministrator, @iIdActionVCCreate),
(@iPremium, @iIdActionVCCreate),
-- video recorder
(@iStandard, @iIdActionVRecorder),
(@iModerator, @iIdActionVRecorder),
(@iAdministrator, @iIdActionVRecorder),
(@iPremium, @iIdActionVRecorder),
-- create talk
(@iStandard, @iIdActionEntryTalkCreate),
(@iModerator, @iIdActionEntryTalkCreate),
(@iAdministrator, @iIdActionEntryTalkCreate),
(@iPremium, @iIdActionEntryTalkCreate),
-- send messages
(@iStandard, @iIdActionSendMessage),
(@iModerator, @iIdActionSendMessage),
(@iAdministrator, @iIdActionSendMessage),
(@iPremium, @iIdActionSendMessage),
-- administration messages edit/delete
(@iModerator, @iIdActionEditMessages),
(@iAdministrator, @iIdActionEditMessages),
(@iModerator, @iIdActionDeleteMessages),
(@iAdministrator, @iIdActionDeleteMessages),
-- administration talks
(@iModerator, @iIdActionAdminTalks),
(@iAdministrator, @iIdActionAdminTalks),
-- create broadcast talks
(@iModerator, @iIdActionBroadcastTalks),
(@iAdministrator, @iIdActionBroadcastTalks),
-- send files
(@iStandard, @iIdActionSendFiles),
(@iModerator, @iIdActionSendFiles),
(@iAdministrator, @iIdActionSendFiles),
(@iPremium, @iIdActionSendFiles);

-- MENU: Talk Menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_lot_menu'), '_bx_messenger_menu_title_view', CONCAT(@sName, '_lot_menu'), @sName, 22, 0, 1, 'BxMessengerLotMenu', 'modules/boonex/messenger/classes/BxMessengerLotMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_lot_menu'), @sName, '_bx_messenger_menu_set_title_talk_menu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`, `visibility_custom`) VALUES
(CONCAT(@sName, '_lot_menu'), @sName, 'parent', '_bx_messenger_menu_item_title_parent_lot', '_bx_messenger_menu_item_title_parent_lot', 'javascript:void(0);', 'oMessenger.loadThreadsParent({id},''{type}'',{jot});', '_self', 'reply-all', '', 2147483647, 1, 0, 0, ''),
(CONCAT(@sName, '_lot_menu'), @sName, 'list', '_bx_messenger_menu_item_title_group_list', '_bx_messenger_menu_item_title_group_list', 'javascript:void(0);', 'oMessenger.onSelectItem(this, {id});', '_self', 'bars', '', 2147483647, 1, 0, 1, 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:16:"is_block_version";s:6:"params";a:1:{i:0;s:2:"{}";}}'),
(CONCAT(@sName, '_lot_menu'), @sName, 'video_call', '_bx_messenger_menu_item_title_video_call', '_bx_messenger_menu_item_title_video_call', 'javascript:void(0);', 'oMessenger.onStartVideoCall(this, {id}, ''{room}'');', '_self', 'video', '', 2147483647, 1, 0, 1, ''),
(CONCAT(@sName, '_lot_menu'), @sName, 'star', '_bx_messenger_menu_item_title_star', '_bx_messenger_menu_item_title_star', 'javascript:void(0);', 'oMessenger.onStarLot(this, {id});', '_self', 'star', '', 2147483647, 1, 0, 2, ''),
(CONCAT(@sName, '_lot_menu'), @sName, 'mute', '_bx_messenger_menu_item_title_mute', '_bx_messenger_menu_item_title_mute', 'javascript:void(0);', 'oMessenger.onMuteLot(this, {id});', '_self', 'bell', '', 2147483647, 1, 0, 3, ''),
(CONCAT(@sName, '_lot_menu'), @sName, 'settings', '_bx_messenger_lots_menu_settings_title', '_bx_messenger_lots_menu_settings_title', 'javascript:void(0)', 'oMessenger.showInfoMenu(this, ''{lot_menu_id}'')', '_self', 'info-circle', '', 2147483647, 1, 0, 4, '');

-- MENU: NAV MENU
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_nav_menu'), '_bx_messenger_nav_menu_title_view', CONCAT(@sName, '_nav_menu'), @sName, 21, 0, 1, 'BxMessengerMainMenu', 'modules/boonex/messenger/classes/BxMessengerMainMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_nav_menu'), @sName, '_bx_messenger_nav_menu_title_view', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
(CONCAT(@sName, '_nav_menu'), @sName, 'inbox', '_bx_messenger_nav_menu_item_title_inbox', '_bx_messenger_nav_menu_item_title_inbox', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''inbox''})', '_self', 'inbox col-red3', '', 2147483647, 1, 0, 0),
(CONCAT(@sName, '_nav_menu'), @sName, 'direct', '_bx_messenger_nav_menu_item_title_direct', '_bx_messenger_nav_menu_item_title_direct', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''direct''})', '_self', 'comment col-blue1', '', 2147483647, 1, 0, 1),
(CONCAT(@sName, '_nav_menu'), @sName, 'threads', '_bx_messenger_nav_menu_item_title_threads', '_bx_messenger_nav_menu_item_title_threads', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''threads''});', '_self', 'comments col-blue2', '', 2147483647, 1, 0, 2),
(CONCAT(@sName, '_nav_menu'), @sName, 'reply', '_bx_messenger_nav_menu_item_title_replies', '_bx_messenger_nav_menu_item_title_replies', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''replies''});', '_self', 'reply', '', 2147483647, 1, 0, 3),
(CONCAT(@sName, '_nav_menu'), @sName, 'mentions_reactions', '_bx_messenger_nav_menu_item_title_mr', '_bx_messenger_nav_menu_item_title_mr', 'javascript:void(0)', 'oMessenger.loadTalksList(this, {group : ''mr''});', '_self', 'at col-green2', '', 2147483647, 1, 0, 4),
(CONCAT(@sName, '_nav_menu'), @sName, 'saved', '_bx_messenger_nav_menu_item_title_saved', '_bx_messenger_nav_menu_item_title_saved', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''saved''});', '_self', 'bookmark col-red1', '', 2147483647, 1, 0, 5);

-- MENU: Groups Menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_groups_menu'), '_bx_messenger_groups_menu_title_view', CONCAT(@sName, '_groups_menu'), @sName, 27, 0, 1, 'BxMessengerNavGroupsMenu', 'modules/boonex/messenger/classes/BxMessengerNavGroupsMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_groups_menu'), @sName, '_bx_messenger_groups_menu_title_view', 0);

-- MENU: Talk Info Menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_lot_info_menu'), '_bx_messenger_menu_lot_info_title', CONCAT(@sName, '_lot_info_menu'), @sName, 6, 0, 1, 'BxMessengerLotInfoMenu', 'modules/boonex/messenger/classes/BxMessengerLotInfoMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_lot_info_menu'), @sName, '_bx_messenger_menu_set_title_talk_info_menu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`, `visibility_custom`) VALUES
(CONCAT(@sName, '_lot_info_menu'), @sName, 'add_participants', '_bx_messenger_lots_menu_add_part', '_bx_messenger_lots_menu_add_part', 'javascript:void(0);', 'oMessenger.createList(''edit'');', '_self', 'plus-circle', '', 2147483647, 1, 0, 0, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'delete', '_bx_messenger_lots_menu_delete', '_bx_messenger_lots_menu_delete', 'javascript:void(0);', 'oMessenger.onDeleteLot({id});', '_self', 'backspace', '', 2147483647, 1, 0, 1, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'leave', '_bx_messenger_lots_menu_leave', '_bx_messenger_lots_menu_leave', 'javascript:void(0);', 'oMessenger.onLeaveLot({id});', '_self', 'sign-out-alt', '', 2147483647, 1, 0, 2, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'media', '_bx_messenger_lots_menu_media', '_bx_messenger_lots_menu_media', 'javascript:void(0);', 'oMessenger.onMedia({id});', '_self', 'photo-video', '', 2147483647, 1, 0, 3, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'clear', '_bx_messenger_lots_menu_clear', '_bx_messenger_lots_menu_clear', 'javascript:void(0);', 'oMessenger.onClearLot({id});', '_self', 'trash', '', 2147483647, 1, 0, 4, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'settings', '_bx_messenger_lots_menu_settings', '_bx_messenger_lots_menu_settings', 'javascript:void(0)', 'oMessenger.onLotSettings(this, ''{lot_menu_id}'')', '_self', 'cogs', '', 2147483647, 1, 0, 5, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'info', '_bx_messenger_lots_menu_info', '_bx_messenger_lots_menu_info', 'javascript:void(0)', 'oMessenger.onLotInfo(this, ''{lot_menu_id}'')', '_self', 'info-circle', '', 2147483647, 1, 0, 6, '');

-- MENU: Message menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_jot_menu'), '_bx_messenger_menu_jot_title', CONCAT(@sName, '_jot_menu'), @sName, 20, 0, 1, 'BxMessengerJotMenu', 'modules/boonex/messenger/classes/BxMessengerJotMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_jot_menu'), @sName, '_bx_messenger_menu_set_title_jot_menu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`, `visibility_custom`) VALUES
(CONCAT(@sName, '_jot_menu'), @sName, 'reaction', '_bx_messenger_jot_menu_reaction', '_bx_messenger_jot_menu_reaction', 'javascript:void(0);', 'oMessenger.onAddReaction(this);', '_self', 'smile', '', 2147483647, 1, 0, 0, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'reply', '_bx_messenger_jot_menu_reply', '_bx_messenger_jot_menu_reply', 'javascript:void(0);', 'oMessenger.onReplyJot(this);', '_self', 'reply', '', 2147483647, 1, 0, 1, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'share', '_bx_messenger_jot_menu_share', '_bx_messenger_jot_menu_share', 'javascript:void(0);', 'oMessenger.onCopyJotLink(this);', '_self', 'share', '', 2147483647, 1, 0, 2, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'edit', '_bx_messenger_jot_menu_edit', '_bx_messenger_jot_menu_edit', 'javascript:void(0);', 'oMessenger.onEditJot(this);', '_self', 'edit', '', 2147483647, 1, 0, 3, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'remove', '_bx_messenger_jot_menu_remove', '_bx_messenger_jot_menu_remove', 'javascript:void(0);', 'oMessenger.onDeleteJot(this);', '_self', 'backspace', '', 2147483647, 1, 0, 4, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'thread', '_bx_messenger_jot_menu_thread', '_bx_messenger_jot_menu_thread', 'javascript:void(0);', 'oMessenger.onReplyInThread(this);', '_self', 'comment-dots', '', 2147483647, 1, 0, 5, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'save', '_bx_messenger_jot_menu_save', '_bx_messenger_jot_menu_save', 'javascript:void(0);', 'oMessenger.onSaveJotItem(this);', '_self', 'bookmark', '', 2147483647, 1, 0, 6, '');

-- MENU: CREATE CONVO
INSERT INTO `sys_menu_templates` (`id`, `template`, `title`, `visible`) VALUES
(ROUND(RAND()*(9999 - 1000) + 1000), 'menu-create-convo.html', '_bx_messenger_create_convo_template_title', 1);
SET @iTemplId = (SELECT `id` FROM `sys_menu_templates` WHERE `template`='menu-create-convo.html' AND `title`='_bx_messenger_create_convo_template_title' LIMIT 1);

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_create_convo_menu'), '_bx_messenger_create_convo_menu_title', CONCAT(@sName, '_create_convo_menu'), @sName, @iTemplId, 0, 1, 'BxMessengerCreateConvoMenu', 'modules/boonex/messenger/classes/BxMessengerCreateConvoMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_create_convo_menu'), @sName, '_bx_messenger_create_convo_menu_set_title', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
(CONCAT(@sName, '_create_convo_menu'), @sName, 'standard', '_bx_messenger_create_convo_menu_standard_system', '_bx_messenger_create_convo_menu_standard', 'javascript:void(0);', '{js_object}.onSelectConvoFilter();', '_self', 'users', '', 2147483647, 1, 0, 0),
(CONCAT(@sName, '_create_convo_menu'), @sName, 'followers', '_bx_messenger_create_convo_menu_followers_system', '_bx_messenger_create_convo_menu_followers_system', 'javascript:void(0);', '{js_object}.onSelectConvoFilter(''followers'');', '_self', 'group', '', 2147483647, 1, 0, 1),
(CONCAT(@sName, '_create_convo_menu'), @sName, 'friends', '_bx_messenger_create_convo_menu_friends_system', '_bx_messenger_create_convo_menu_friends_system', 'javascript:void(0);', '{js_object}.onSelectConvoFilter(''friends'');', '_self', 'user-friends', '', 2147483647, 1, 0, 1),
(CONCAT(@sName, '_create_convo_menu'), @sName, 'broadcast', '_bx_messenger_create_convo_menu_broadcast_system', '_bx_messenger_create_convo_menu_broadcast_system', 'javascript:void(0);', '{js_object}.onSelectConvoFilter(''broadcast'');', '_self', 'bullhorn', '', 2147483647, 1, 0, 2);

--- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_messenger_html5', 1, 'BxMessengerUploaderHTML5', 'modules/boonex/messenger/classes/BxMessengerUploaderHTML5.php');

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_messenger_profile_snippet_meta', '_bx_messenger_profile_title_snippet_meta', 'bx_messenger_profile_snippet_meta', @sName, 15, 0, 1, 'BxMessengerProfileMenuSnippetMeta', 'modules/boonex/messenger/classes/BxMessengerProfileMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
('bx_messenger_profile_snippet_meta', @sName, '_bx_messenger_set_title_profile_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('bx_messenger_profile_snippet_meta', @sName, 'message', '_bx_messenger_item_title_sm_message', '_bx_messenger_item_title_sm_message', 'page.php?i=messenger', '', '', 'comments', '', 2147483647, 0, 0, 1, 1);

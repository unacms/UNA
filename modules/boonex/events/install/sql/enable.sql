
-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_events', '_bx_events', 'bx_events@modules/boonex/events/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_events', '_bx_events', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `info`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_events_enable_auto_approve', 'on', @iCategId, '_bx_events_option_enable_auto_approve', '', 'checkbox', '', '', '', 0),
('bx_events_use_cover_as_thumb', 'on', @iCategId, '_bx_events_option_use_cover_as_thumb', '_bx_events_option_use_cover_as_thumb_inf', 'checkbox', '', '', '', 5),
('bx_events_num_connections_quick', '6', @iCategId, '_bx_events_option_num_connections_quick', '', 'digit', '', '', '', 10),
('bx_events_per_page_browse', '24', @iCategId, '_bx_events_option_per_page_browse', '', 'digit', '', '', '', 11),
('bx_events_num_rss', '10', @iCategId, '_bx_events_option_num_rss', '', 'digit', '', '', '', 12),
('bx_events_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', '', 'digit', '', '', '', 15),
('bx_events_per_page_browse_recommended', '10', @iCategId, '_sys_option_per_page_browse_recommended', '', 'digit', '', '', '', 16),
('bx_events_per_page_for_favorites_lists', '5', @iCategId, '_bx_events_option_per_page_for_favorites_lists', '', 'digit', '', '', '', 17),
('bx_events_time_format', 'H:i', @iCategId, '_bx_events_option_time_format', '', 'digit', '', '', '', 20),
('bx_events_short_date_format', 'j/n/Y', @iCategId, '_bx_events_option_short_date_format', '', 'digit', '', '', '', 22),
('bx_events_datetime_format', 'j/n/Y H:i', @iCategId, '_bx_events_option_datetime_format', '', 'digit', '', '', '', 23),
('bx_events_summary_chars', '700', @iCategId, '_bx_events_option_summary_chars', '', 'digit', '', '', '', 25),
('bx_events_searchable_fields', 'event_name,event_desc', @iCategId, '_bx_events_option_searchable_fields', '', 'list', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:21:"get_searchable_fields";}', '', '', 30),
('bx_events_members_mode', '', @iCategId, '_bx_events_option_members_mode', '', 'select', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:24:"get_options_members_mode";}', '', '', 40),
('bx_events_public_subscribed_me', 'on', @iCategId, '_bx_events_option_public_subscribed_me', '', 'checkbox', '', '', '', 50),
('bx_events_enable_subscribe_wo_join', '', @iCategId, '_bx_events_option_enable_subscribe_wo_join', '', 'checkbox', '', '', '', 55),
('bx_events_enable_subscribe_for_past_events', 'on', @iCategId, '_bx_events_option_enable_subscribe_for_past_events', '', 'checkbox', '', '', '', 57),
('bx_events_internal_notifications', '', @iCategId, '_bx_events_option_internal_notifications', '', 'checkbox', '', '', '', 60),
('bx_events_reminder_interval', '24', @iCategId, '_bx_events_option_reminder_interval', '', 'select', '24,48', '', '', 70),
('bx_events_rm_from_timeline_after', '0', @iCategId, '_bx_events_option_rm_from_timeline_after', '', 'digit', '', '', '', 80);

-- PAGES

-- PAGE: create profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_create_profile', 'create-event-profile', '_bx_events_page_title_sys_create_profile', '_bx_events_page_title_create_profile', 'bx_events', 5, 2147483647, 1, 'page.php?i=create-event-profile', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_create_profile', 1, 'bx_events', '_bx_events_page_block_title_create_profile', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:13:\"entity_create\";}', 0, 1, 1);

-- PAGE: view profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_view_profile', 'view-event-profile', '_bx_events_page_title_sys_view_profile', '_bx_events_page_title_view_profile', 'bx_events', 10, 2147483647, 1, 'page.php?i=view-event-profile', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `hidden_on`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_events_view_profile', 4, 'bx_events', '', '_bx_events_page_block_title_profile_comments', 11, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 0, 0),
('bx_events_view_profile', 4, 'bx_events', '', '_bx_events_page_block_title_profile_description', 13, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:17:\"entity_text_block\";}', 0, 0, 1, 0),
('bx_events_view_profile', 2, 'bx_events', '', '_bx_events_page_block_title_profile_info', 11, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:11:\"entity_info\";}', 0, 0, 1, 0),
('bx_events_view_profile', 1, 'bx_events', '', '_bx_events_page_block_title_entry_social_sharing', 13, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:21:\"entity_social_sharing\";}', 0, 0, 0, 0),
('bx_events_view_profile', 1, 'bx_events', '', '_bx_events_page_block_title_entry_all_actions', 13, '', 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:18:"entity_all_actions";}', 0, 0, 0, 0),
('bx_events_view_profile', 3, 'bx_events', '', '_bx_events_page_block_title_profile_calendar', 11, '', 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:8:\"calendar\";s:6:\"params\";a:2:{i:0;a:1:{s:5:\"event\";s:12:\"{content_id}\";}i:1;s:21:\"calendar_compact.html\";}}', 0, 0, 1, 0),
('bx_events_view_profile', 3, 'bx_events', '', '_bx_events_page_block_title_profile_sessions', 11, '', 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:8:"sessions";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 0, 0, 1, 1),
('bx_events_view_profile', 3, 'bx_events', '_bx_events_page_block_title_sys_entry_context', '_bx_events_page_block_title_entry_context', 13, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:14:\"entity_context\";}', 0, 0, 1, 2),
('bx_events_view_profile', 4, 'bx_events', '', '_bx_events_page_block_title_fans', 11, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:4:\"fans\";}', 0, 0, 1, 1),
('bx_events_view_profile', 4, 'bx_events', '', '_bx_events_page_block_title_admins', 11, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:6:\"admins\";}', 0, 0, 1, 2),
('bx_events_view_profile', 2, 'bx_events', '', '_bx_events_page_block_title_entry_location', 11, '', 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:13:\"locations_map\";s:6:\"params\";a:2:{i:0;s:9:\"bx_events\";i:1;s:12:\"{content_id}\";}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', 0, 0, 1, 1),
('bx_events_view_profile', 2, 'bx_events', '', '_bx_events_page_block_title_entry_reports', 11, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"events\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);
-- PAGE: view closed profile 

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_view_profile_closed', 'view-event-profile-closed', '_bx_events_page_title_sys_view_profile_closed', '_bx_events_page_title_view_profile', 'bx_events', 10, 2147483647, 1, 'page.php?i=view-event-profile', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_events_view_profile_closed', 2, 'bx_events', '', '_bx_events_page_block_title_profile_info', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:11:\"entity_info\";}', 0, 0, 1, 0),
('bx_events_view_profile_closed', 3, 'bx_events', '', '_bx_events_page_block_title_fans', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:4:\"fans\";}', 0, 0, 1, 0);

-- PAGE: edit profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_edit_profile', 'edit-event-profile', '_bx_events_page_title_sys_edit_profile', '_bx_events_page_title_edit_profile', 'bx_events', 5, 2147483647, 1, 'page.php?i=edit-event-profile', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_edit_profile', 1, 'bx_events', '_bx_events_page_block_title_edit_profile', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:11:\"entity_edit\";}', 0, 0, 0);

-- PAGE: questionnaire (join)

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_questionnaire', 'event-questionnaire', '_bx_events_page_title_sys_questionnaire', '_bx_events_page_title_questionnaire', 'bx_events', 5, 2147483647, 1, 'page.php?i=event-questionnaire', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_questionnaire', 1, 'bx_events', '_bx_events_page_block_title_edit_questionnaire', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:25:"entity_edit_questionnaire";}', 0, 0, 0);


-- PAGE: invite members

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_invite', 'invite-to-event', '_bx_events_page_title_sys_invite_to_group', '_bx_events_page_title_invite_to_group', 'bx_events', 5, 2147483647, 1, 'page.php?i=invite-to-event', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_invite', 1, 'bx_events', '_bx_events_page_block_title_invite_to_group', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:13:\"entity_invite\";}', 0, 0, 0);

-- PAGE: delete profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_delete_profile', 'delete-event-profile', '_bx_events_page_title_sys_delete_profile', '_bx_events_page_title_delete_profile', 'bx_events', 5, 2147483647, 1, 'page.php?i=delete-event-profile', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_delete_profile', 1, 'bx_events', '_bx_events_page_block_title_delete_profile', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:13:\"entity_delete\";}', 0, 0, 0);

-- PAGE: join profile
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_join_profile', 'join-event-profile', '_bx_events_page_title_sys_join_profile', '_bx_events_page_title_join_profile', 'bx_events', 5, 2147483647, 1, 'page.php?i=join-event-profile', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_join_profile', 1, 'bx_events', '_bx_events_page_block_title_join_profile', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:11:"entity_join";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 0);

-- PAGE: profile info
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_profile_info', 'event-profile-info', '_bx_events_page_title_sys_profile_info', '_bx_events_page_title_profile_info', 'bx_events', 5, 2147483647, 1, 'page.php?i=event-profile-info', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `hidden_on`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_events_profile_info', 1, 'bx_events', '', '_bx_events_page_block_title_profile_description', 13, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:17:\"entity_text_block\";}', 0, 0, 1, 0),
('bx_events_profile_info', 2, 'bx_events', '_bx_events_page_block_title_system_profile_info', '_bx_events_page_block_title_profile_info_link', 11, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:16:\"entity_info_full\";}', 0, 0, 1, 0),
('bx_events_profile_info', 3, 'bx_events', '', '_bx_events_page_block_title_profile_calendar', 11, '', 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:8:\"calendar\";s:6:\"params\";a:2:{i:0;a:1:{s:5:\"event\";s:12:\"{content_id}\";}i:1;s:21:\"calendar_compact.html\";}}', 0, 0, 1, 0),
('bx_events_profile_info', 2, 'bx_events', '', '_bx_events_page_block_title_entry_location', 11, '', 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:13:\"locations_map\";s:6:\"params\";a:2:{i:0;s:9:\"bx_events\";i:1;s:12:\"{content_id}\";}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', 0, 0, 1, 1);

-- PAGE: manage profile sessions
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_profile_sessions', 'event-sessions', '_bx_events_page_title_sys_profile_sessions', '_bx_events_page_title_profile_sessions', 'bx_events', 5, 2147483647, 1, 'page.php?i=event-sessions', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_events_profile_sessions', 1, 'bx_events', '', '_bx_events_page_block_title_profile_sessions', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:15:"entity_sessions";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1);

-- PAGE: manage profile pricing
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_profile_pricing', 'event-pricing', '_bx_events_page_title_sys_profile_pricing', '_bx_events_page_title_profile_pricing', 'bx_events', 5, 2147483647, 1, 'page.php?i=event-pricing', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_events_profile_pricing', 1, 'bx_events', '', '_bx_events_page_block_title_profile_pricing', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:14:"entity_pricing";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1);

-- PAGE: event fans
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_fans', 'event-fans', '_bx_events_page_title_sys_group_fans', '_bx_events_page_title_group_fans', 'bx_events', 5, 2147483647, 1, 'page.php?i=event-fans', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_events_fans', 1, 'bx_events', '_bx_events_page_block_title_system_fans', '_bx_events_page_block_title_fans_link', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:14:"browse_members";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:2:{s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}}', 0, 0, 1, 1);


-- PAGE: event manage
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_manage_item', 'event-manage', '_bx_events_page_title_sys_manage_profile', '_bx_events_page_title_manage_profile', 'bx_events', 5, 2147483647, 1, 'page.php?i=event-manage', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_events_manage_item', 1, 'bx_events', '_bx_events_page_block_title_system_fans_manage', '_bx_events_page_block_title_fans_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:10:"fans_table";}', 0, 0, 1, 1),
('bx_events_manage_item', 1, 'bx_events', '_bx_events_page_block_title_system_subscribers_manage', '_bx_events_page_block_title_subscribers_link', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:19:"subscribed_me_table";s:5:"class";s:23:"TemplServiceConnections";}', 0, 0, 1, 2),
('bx_events_manage_item', 1, 'bx_events', '_bx_events_page_block_title_system_invites_manage', '_bx_events_page_block_title_invites', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:13:"invites_table";}', 0, 0, 1, 3);

-- PAGE: view entry comments

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_profile_comments', '_bx_events_page_title_sys_profile_comments', '_bx_events_page_title_profile_comments', 'bx_events', 5, 2147483647, 1, 'event-profile-comments', '', '', '', '', 0, 1, 0, 'BxEventsPageEntry', 'modules/boonex/events/classes/BxEventsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_events_profile_comments', 1, 'bx_events', '_bx_events_page_block_title_profile_comments', '_bx_events_page_block_title_profile_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 0, 1);

-- PAGE: module home

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_home', '_bx_events_page_title_sys_recent', '_bx_events_page_title_recent', 'bx_events', 5, 2147483647, 1, 'events-home', 'page.php?i=events-home', '', '', '', 0, 1, 0, 'BxEventsPageBrowse', 'modules/boonex/events/classes/BxEventsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_events_home', 1, 'bx_events', '_bx_events_page_block_title_featured_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:7:"gallery";}}', 0, 1, 0),
('bx_events_home', 1, 'bx_events', '_bx_events_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:22:\"browse_recent_profiles\";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 1),
('bx_events_home', 1, 'bx_events', '_bx_events_page_block_title_past_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:20:"browse_past_profiles";s:6:"params";a:1:{i:0;b:0;}}', 0, 1, 2);

-- PAGE: top profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_top', '_bx_events_page_title_sys_top', '_bx_events_page_title_top', 'bx_events', 5, 2147483647, 1, 'events-top', 'page.php?i=events-top', '', '', '', 0, 1, 0, 'BxEventsPageBrowse', 'modules/boonex/events/classes/BxEventsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_top', 1, 'bx_events', '_bx_events_page_block_title_top_profiles', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:19:\"browse_top_profiles\";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 0);

-- PAGE: entries in context

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_context', 'events-context', '_bx_events_page_title_sys_entries_in_context', '_bx_events_page_title_entries_in_context', 'bx_events', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxEventsPageEntriesInContext', 'modules/boonex/events/classes/BxEventsPageEntriesInContext.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_events_context', 1, 'bx_events', '_bx_events_page_block_title_sys_entries_in_context', '_bx_events_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:14:\"browse_context\";}', 0, 0, 1, 1),
('bx_events_context', 1, 'bx_events', '_bx_events_page_block_title_sys_calendar_in_context', '_bx_events_page_block_title_calendar_in_context', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:9:"bx_events";s:6:"method";s:8:"calendar";s:12:"ignore_cache";b:1;s:6:"params";a:1:{i:0;a:1:{s:10:"context_id";s:12:"{profile_id}";}}}', 0, 0, 1, 2);

-- PAGE: upcoming profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_upcoming', '_bx_events_page_title_sys_upcoming', '_bx_events_page_title_upcoming', 'bx_events', 5, 2147483647, 1, 'events-upcoming', 'page.php?i=events-upcoming', '', '', '', 0, 1, 0, 'BxEventsPageBrowse', 'modules/boonex/events/classes/BxEventsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_upcoming', 1, 'bx_events', '_bx_events_page_block_title_upcoming_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:24:"browse_upcoming_profiles";s:6:"params";a:1:{i:0;a:1:{s:13:"empty_message";b:1;}}}', 0, 1, 0);

-- PAGE: past profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_past', '_bx_events_page_title_sys_past', '_bx_events_page_title_past', 'bx_events', 5, 2147483647, 1, 'events-past', 'page.php?i=events-past', '', '', '', 0, 1, 0, 'BxEventsPageBrowse', 'modules/boonex/events/classes/BxEventsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_past', 1, 'bx_events', '_bx_events_page_block_title_past_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:20:"browse_past_profiles";s:6:"params";a:1:{i:0;b:1;}}', 0, 0, 0);

-- PAGE: calendar

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_calendar', '_bx_events_page_title_sys_calendar', '_bx_events_page_title_calendar', 'bx_events', 5, 2147483647, 1, 'events-calendar', 'page.php?i=events-calendar', '', '', '', 0, 1, 0, 'BxEventsPageCalendar', 'modules/boonex/events/classes/BxEventsPageCalendar.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_calendar', 1, 'bx_events', '_bx_events_page_block_title_calendar', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:8:"calendar";s:12:"ignore_cache";b:1;}', 0, 1, 0);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_search', '_bx_events_page_title_sys_entries_search', '_bx_events_page_title_entries_search', 'bx_events', 5, 2147483647, 1, 'events-search', 'page.php?i=events-search', '', '', '', 0, 1, 0, 'BxEventsPageBrowse', 'modules/boonex/events/classes/BxEventsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_events_search', 1, 'bx_events', '_bx_events_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:9:"bx_events";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_events_search', 1, 'bx_events', '_bx_events_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:9:"bx_events";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 2),
('bx_events_search', 1, 'bx_events', '_bx_events_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:14:"bx_events_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_events_search', 1, 'bx_events', '_bx_events_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:14:"bx_events_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: joined profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_joined_events', '_bx_events_page_title_sys_joined', '_bx_events_page_title_joined', 'bx_events', 5, 2147483647, 1, 'events-joined', 'page.php?i=events-joined', '', '', '', 0, 1, 0, 'BxEventsPageBrowse', 'modules/boonex/events/classes/BxEventsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_joined_events', 1, 'bx_events', '_bx_events_page_block_title_joined_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:21:"browse_joined_entries";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;b:1;}}', 0, 1, 0);

-- PAGE: followed profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_followed_events', '_bx_events_page_title_sys_followed', '_bx_events_page_title_followed', 'bx_events', 5, 2147483647, 1, 'events-followed', 'page.php?i=events-followed', '', '', '', 0, 1, 0, 'BxEventsPageBrowse', 'modules/boonex/events/classes/BxEventsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_followed_events', 1, 'bx_events', '_bx_events_page_block_title_followed_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:23:"browse_followed_entries";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;b:1;}}', 0, 1, 0);

-- PAGE: module manage own
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_manage', '_bx_events_page_title_sys_manage', '_bx_events_page_title_manage', 'bx_events', 5, 2147483647, 1, 'events-manage', 'page.php?i=events-manage', '', '', '', 0, 1, 0, 'BxEventsPageBrowse', 'modules/boonex/events/classes/BxEventsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_manage', 1, 'bx_events', '_bx_events_page_block_title_system_manage', '_bx_events_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:12:\"manage_tools\";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_administration', '_bx_events_page_title_sys_manage_administration', '_bx_events_page_title_manage', 'bx_events', 5, 192, 1, 'events-administration', 'page.php?i=events-administration', '', '', '', 0, 1, 0, 'BxEventsPageBrowse', 'modules/boonex/events/classes/BxEventsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_administration', 1, 'bx_events', '_bx_events_page_block_title_system_manage_administration', '_bx_events_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:12:\"manage_tools\";s:6:\"params\";a:1:{i:0;s:14:\"administration\";}}', 0, 1, 0);

-- PAGE: user's events
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_joined', 'joined-events', '_bx_events_page_title_sys_joined_entries', '_bx_events_page_title_joined_entries', 'bx_events', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxEventsPageJoinedEntries', 'modules/boonex/events/classes/BxEventsPageJoinedEntries.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_events_joined', 1, 'bx_events', '_bx_events_page_block_title_sys_entries_actions', '_bx_events_page_block_title_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:18:"my_entries_actions";}', 0, 0, 1, 1),
('bx_events_joined', 1, 'bx_events', '_bx_events_page_block_title_sys_entries_of_author', '_bx_events_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:22:"browse_created_entries";}', 0, 0, 0, 2),
('bx_events_joined', 1, 'bx_events', '_bx_events_page_block_title_sys_favorites_of_author', '_bx_events_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:21:"browse_favorite_lists";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1, 2),
('bx_events_joined', 1, 'bx_events', '_bx_events_page_block_title_sys_joined_entries', '_bx_events_page_block_title_joined_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:21:"browse_joined_entries";s:6:"params";a:2:{i:0;i:0;i:1;b:1;}}', 0, 0, 1, 4),
('bx_events_joined', 1, 'bx_events', '_bx_events_page_block_title_sys_joined_calendar', '_bx_events_page_block_title_joined_calendar', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:8:"calendar";s:6:"params";a:1:{i:0;a:1:{s:10:"profile_id";s:12:"{profile_id}";}}}', 0, 0, 1, 5);


-- PAGE: favorites by list
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_favorites', '_bx_events_page_title_sys_entries_favorites', '_bx_events_page_title_entries_favorites', 'bx_events', 12, 2147483647, 1, 'events-favorites', 'page.php?i=events-favorites', '', '', '', 0, 1, 0, 'BxEventsPageListEntry', 'modules/boonex/events/classes/BxEventsPageListEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_events_favorites', 2, 'bx_events', '_bx_events_page_block_title_sys_favorites_entries', '_bx_events_page_block_title_favorites_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:15:"browse_favorite";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1),
('bx_events_favorites', 3, 'bx_events', '', '_bx_events_page_block_title_favorites_entries_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:19:"favorites_list_info";}', 0, 0, 0),
('bx_events_favorites', 3, 'bx_events', '', '_bx_events_page_block_title_favorites_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:22:"favorites_list_actions";}', 0, 0, 1);


-- PAGE: add block to homepage
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_home', 1, 'bx_events', '', '_bx_events_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:22:"browse_recent_profiles";}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1),
('sys_home', 1, 'bx_events', '_bx_events_page_block_title_sys_recommended_entries_view_showcase', '_bx_events_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:18:"browse_recommended";}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 2);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('', 0, 'bx_events', '', '_bx_events_page_block_title_categories', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"categories_list";s:6:"params";a:2:{i:0;s:14:"bx_events_cats";i:1;a:2:{s:10:\"show_empty\";b:1;s:21:\"show_empty_categories\";b:1;}}s:5:"class";s:20:"TemplServiceCategory";}', 1, 1, IFNULL(@iBlockOrder, 0) + 1),
('', 0, 'bx_events', '_bx_events_page_block_title_sys_featured_entries_view_showcase', '_bx_events_page_block_title_featured_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:15:\"browse_featured\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, 'bx_events', '_bx_events_page_block_title_sys_recommended_entries_view_showcase', '_bx_events_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:18:\"browse_recommended\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0,  1, IFNULL(@iBlockOrder, 0) + 3),
('', 0, 'bx_events', '_bx_events_page_block_title_sys_cover_block', '_bx_events_page_block_title_cover_block', 3, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_events\";s:6:\"method\";s:12:\"entity_cover\";}', 0, 1, IFNULL(@iBlockOrder, 0) + 4);
 
 -- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
('trigger_page_group_view_entry', 2, 'bx_events', '_bx_events_page_block_title_calendar_for_context', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:9:"bx_events";s:6:"method";s:8:"calendar";s:12:"ignore_cache";b:1;s:6:"params";a:1:{i:0;a:1:{s:10:"context_id";s:12:"{profile_id}";}}}', 0, 0, 0, 0),
('trigger_page_group_view_entry', 4, 'bx_events', '_bx_events_page_block_title_browse_for_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:14:"browse_context";s:6:"params";a:1:{s:10:"context_id";s:12:"{profile_id}";}}', 0, 0, 1, 0);


-- MENU

-- MENU: add to site menu

SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_events', 'events-home', '_bx_events_menu_item_title_system_entries_home', '_bx_events_menu_item_title_entries_home', 'page.php?i=events-home', '', '', 'calendar', 'bx_events_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu

SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_events', 'events-home', '_bx_events_menu_item_title_system_entries_home', '_bx_events_menu_item_title_entries_home', 'page.php?i=events-home', '', '', 'calendar', 'bx_events_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: add to "add content" menu

SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_events', 'create-event-profile', '_bx_events_menu_item_title_system_create_profile', '_bx_events_menu_item_title_create_profile', 'page.php?i=create-event-profile', '', '', 'calendar', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: view actions

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_view_actions', '_bx_events_menu_title_view_profile_actions', 'bx_events_view_actions', 'bx_events', 9, 0, 1, 'BxEventsMenuViewActions', 'modules/boonex/events/classes/BxEventsMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_events_view_actions', 'bx_events', '_bx_events_menu_set_title_view_profile_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_events_view_actions', 'bx_events', 'join-event-profile', '_bx_events_menu_item_title_system_pay_and_join', '{title_pay_and_join}', 'page.php?i=join-event-profile&profile_id={profile_id}', '', '', 'sign-in-alt', '', 0, 2147483647, 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:22:"is_paid_join_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0, 5),
('bx_events_view_actions', 'bx_events', 'profile-fan-add', '_bx_events_menu_item_title_system_become_fan', '{title_add_fan}', 'javascript:void(0)', '{onclick_add_fan}', '', 'sign-in-alt', '', 0, 2147483647, 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:22:"is_free_join_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0, 5),
('bx_events_view_actions', 'bx_events', 'profile-fan-remove', '_bx_events_menu_item_title_system_leave_group', '{title_remove_fan}', 'javascript:void(0)', 'bx_conn_action(this, \'bx_events_fans\', \'remove\', \'{profile_id}\')', '', 'sign-out-alt', '', 0, 2147483647, '', 1, 0, 1, 6),
('bx_events_view_actions', 'bx_events', 'profile-subscribe-add', '_bx_events_menu_item_title_system_subscribe', '_bx_events_menu_item_title_subscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'add\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, '', 1, 0, 1, 20),
('bx_events_view_actions', 'bx_events', 'profile-subscribe-remove', '_bx_events_menu_item_title_system_unsubscribe', '_bx_events_menu_item_title_unsubscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'remove\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, '', 1, 0, 1, 21),
('bx_events_view_actions', 'bx_events', 'profile-check-in', '_bx_events_menu_item_title_system_check_in', '_bx_events_menu_item_title_check_in', 'javascript:void(0)', 'javascript:{js_object_entry}.checkIn(this, {content_id});', '', 'check', '', 0, 2147483647, '', 1, 0, 1, 25),
('bx_events_view_actions', 'bx_events', 'profile-set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_events'', content_id: {content_id}});', '', 'check-circle', '', 0, 192, 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 1, 30),
('bx_events_view_actions', 'bx_events', 'ical-export', '', '_bx_events_menu_item_title_ical_export', 'modules/?r=events/calendar_sync/{content_id}', '', '', 'calendar-plus', '', 0, 2147483647, 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:24:"is_ical_export_avaliable";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 1, 0, 1, 40),
('bx_events_view_actions', 'bx_events', 'profile-actions-more', '_bx_events_menu_item_title_system_more_actions', '_bx_events_menu_item_title_more_actions', 'javascript:void(0)', 'bx_menu_popup(''bx_events_view_actions_more'', this, {}, {profile_id:{profile_id}});', '', 'cog', 'bx_events_view_actions_more', 1, 2147483647, '', 1, 0, 1, 9999);

-- MENU: view actions more

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_view_actions_more', '_bx_events_menu_title_view_profile_actions_more', 'bx_events_view_actions_more', 'bx_events', 6, 0, 1, 'BxEventsMenuViewActions', 'modules/boonex/events/classes/BxEventsMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_events_view_actions_more', 'bx_events', '_bx_events_menu_set_title_view_profile_actions_more', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_events_view_actions_more', 'bx_events', 'add-event-content', '_bx_events_menu_item_title_system_add_content', '_bx_events_menu_item_title_add_content', 'javascript:void(0)', 'bx_menu_popup(''bx_events_add_content'', this, {}, {profile_id:{profile_id}});', '', 'plus', 'bx_events_add_content', 2147483647, '', 1, 0, 5),
('bx_events_view_actions_more', 'bx_events', 'event-manage', '_bx_events_menu_item_title_system_view_manage', '_bx_events_menu_item_title_view_manage', 'page.php?i=event-manage&profile_id={profile_id}', '', '', 'users', '', 2147483647, '', 1, 0, 10),
('bx_events_view_actions_more', 'bx_events', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', 192, '', 1, 0, 20),
('bx_events_view_actions_more', 'bx_events', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_events&content_id={content_id}', '', '', 'history', '', 192, '', 1, 0, 30),
('bx_events_view_actions_more', 'bx_events', 'edit-event-profile', '_bx_events_menu_item_title_system_edit_profile', '_bx_events_menu_item_title_edit_profile', 'page.php?i=edit-event-profile&id={content_id}', '', '', 'pencil-alt', '', 2147483647, '', 1, 0, 40),
('bx_events_view_actions_more', 'bx_events', 'event-questionnaire', '_bx_events_menu_item_title_system_edit_questionnaire', '_bx_events_menu_item_title_edit_questionnaire', 'page.php?i=event-questionnaire&profile_id={profile_id}', '', '', 'check-double', '', 2147483647, '', 1, 0, 41),
('bx_events_view_actions_more', 'bx_events', 'event-sessions', '_bx_events_menu_item_title_system_edit_sessions', '_bx_events_menu_item_title_edit_sessions', 'page.php?i=event-sessions&profile_id={profile_id}', '', '', 'calendar-day', '', 2147483647, '', 1, 0, 42),
('bx_events_view_actions_more', 'bx_events', 'event-pricing', '_bx_events_menu_item_title_system_edit_pricing', '_bx_events_menu_item_title_edit_pricing', 'page.php?i=event-pricing&profile_id={profile_id}', '', '', 'money-check-alt', '', 2147483647, 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:20:"is_pricing_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 43),
('bx_events_view_actions_more', 'bx_events', 'invite-to-event', '_bx_events_menu_item_title_system_invite', '_bx_events_menu_item_title_invite', 'page.php?i=invite-to-event&id={content_id}', '', '', 'user-friends', '', 2147483647, '', 1, 0, 44),
('bx_events_view_actions_more', 'bx_events', 'delete-event-profile', '_bx_events_menu_item_title_system_delete_profile', '_bx_events_menu_item_title_delete_profile', 'page.php?i=delete-event-profile&id={content_id}', '', '', 'remove', '', 2147483647, '', 1, 0, 50),
('bx_events_view_actions_more', 'bx_events', 'approve-event-profile', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 2147483647, '', 1, 0, 60);

-- MENU: all actions menu for view entry 

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `persistent`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_view_actions_all', '_sys_menu_title_view_actions', 'bx_events_view_actions_all', 'bx_events', 15, 1, 0, 1, 'BxEventsMenuViewActionsAll', 'modules/boonex/events/classes/BxEventsMenuViewActionsAll.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_events_view_actions_all', 'bx_events', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_events_view_actions_all', 'bx_events', 'join-event-profile', '_bx_events_menu_item_title_system_pay_and_join', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 5),
('bx_events_view_actions_all', 'bx_events', 'profile-fans', '_bx_events_menu_item_title_system_fans', '', '', '', '', '', '', '', 0, 2147483647, 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:22:"is_free_join_avaliable";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 10),
('bx_events_view_actions_all', 'bx_events', 'profile-fan-add', '_bx_events_menu_item_title_system_become_fan', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 12),
('bx_events_view_actions_all', 'bx_events', 'profile-fan-remove', '_bx_events_menu_item_title_system_leave_group', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 14),
('bx_events_view_actions_all', 'bx_events', 'profile-subscriptions', '_bx_events_menu_item_title_system_subscriptions', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_events_view_actions_all', 'bx_events', 'profile-subscribe-add', '_bx_events_menu_item_title_system_subscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 32),
('bx_events_view_actions_all', 'bx_events', 'profile-subscribe-remove', '_bx_events_menu_item_title_system_unsubscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 34),
('bx_events_view_actions_all', 'bx_events', 'profile-check-in', '_bx_events_menu_item_title_system_check_in', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 45),
('bx_events_view_actions_all', 'bx_events', 'profile-set-badges', '_sys_menu_item_title_system_set_badges', '', '', '', '', '', '', '', 0, 192, 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 50),
('bx_events_view_actions_all', 'bx_events', 'ical-export', '', '_bx_events_menu_item_title_ical_export', 'modules/?r=events/calendar_sync/{content_id}', '', '', 'calendar-plus', '', '', 0, 2147483647, 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:24:"is_ical_export_avaliable";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 1, 0, 60),
('bx_events_view_actions_all', 'bx_events', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_events_view_actions_all', 'bx_events', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_events_view_actions_all', 'bx_events', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 220),
('bx_events_view_actions_all', 'bx_events', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 225),
('bx_events_view_actions_all', 'bx_events', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 230),
('bx_events_view_actions_all', 'bx_events', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 240),
('bx_events_view_actions_all', 'bx_events', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 250),
('bx_events_view_actions_all', 'bx_events', 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 260),
('bx_events_view_actions_all', 'bx_events', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_events_view_actions_all', 'bx_events', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_events_view_actions_all', 'bx_events', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);

-- MENU: add content menu for view entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_add_content', '_bx_events_menu_title_add_content', 'sys_add_content_links', 'bx_events', 6, 0, 1, 'BxEventsMenuAddContent', 'modules/boonex/events/classes/BxEventsMenuAddContent.php');

-- MENU: meta (counters) menu for view entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_view_meta', '_bx_events_menu_title_view_profile_meta', 'bx_events_view_meta', 'bx_events', 15, 0, 1, 'BxEventsMenuViewMeta', 'modules/boonex/events/classes/BxEventsMenuViewMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_events_view_meta', 'bx_events', '_bx_events_menu_set_title_view_profile_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_events_view_meta', 'bx_events', 'members', '_sys_menu_item_title_system_sm_members', '_bx_events_menu_item_title_sm_members', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_events_view_meta', 'bx_events', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_bx_events_menu_item_title_sm_subscribers', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_events_view_meta', 'bx_events', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_events_view_meta', 'bx_events', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_events_view_meta', 'bx_events', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 0, 2147483647, '', 0, 0, 43),
('bx_events_view_meta', 'bx_events', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 0, 2147483647, '', 0, 0, 46),
('bx_events_view_meta', 'bx_events', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 0, 2147483647, '', 1, 0, 50);

-- MENU: actions menu for my entries

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_my', '_bx_events_menu_title_entries_my', 'bx_events_my', 'bx_events', 9, 0, 1, 'BxEventsMenu', 'modules/boonex/events/classes/BxEventsMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_events_my', 'bx_events', '_bx_events_menu_set_title_entries_my', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_events_my', 'bx_events', 'create-event-profile', '_bx_events_menu_item_title_system_create_profile', '_bx_events_menu_item_title_create_profile', 'page.php?i=create-event-profile', '', '', 'plus', '', 2147483647, 1, 0, 0);

-- MENU: module sub-menu

INSERT INTO `sys_objects_menu`(`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_submenu', '_bx_events_menu_title_submenu', '_bx_events_menu_title_public_submenu', 'bx_events_submenu', 'bx_events', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_events_submenu', 'bx_events', '_bx_events_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_events_submenu', 'bx_events', 'events-home', '_bx_events_menu_item_title_system_entries_recent', '_bx_events_menu_item_title_entries_recent', 'page.php?i=events-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_events_submenu', 'bx_events', 'events-top', '_bx_events_menu_item_title_system_entries_top', '_bx_events_menu_item_title_entries_top', 'page.php?i=events-top', '', '', '', '', 2147483647, 1, 1, 2),
('bx_events_submenu', 'bx_events', 'events-upcoming', '_bx_events_menu_item_title_system_entries_upcoming', '_bx_events_menu_item_title_entries_upcoming', 'page.php?i=events-upcoming', '', '', '', '', 2147483647, 1, 1, 3),
('bx_events_submenu', 'bx_events', 'events-past', '_bx_events_menu_item_title_system_entries_past', '_bx_events_menu_item_title_entries_past', 'page.php?i=events-past', '', '', '', '', 2147483647, 1, 1, 4),
('bx_events_submenu', 'bx_events', 'events-calendar', '_bx_events_menu_item_title_system_calendar', '_bx_events_menu_item_title_calendar', 'page.php?i=events-calendar', '', '', '', '', 2147483647, 1, 1, 5),
('bx_events_submenu', 'bx_events', 'events-search', '_bx_events_menu_item_title_system_entries_search', '_bx_events_menu_item_title_entries_search', 'page.php?i=events-search', '', '', '', '', 2147483647, 1, 1, 6),
('bx_events_submenu', 'bx_events', 'events-joined', '_bx_events_menu_item_title_system_entries_joined', '_bx_events_menu_item_title_entries_joined', 'page.php?i=events-joined', '', '', '', '', 2147483647, 1, 1, 7),
('bx_events_submenu', 'bx_events', 'events-followed', '_bx_events_menu_item_title_system_entries_followed', '_bx_events_menu_item_title_entries_followed', 'page.php?i=events-followed', '', '', '', '', 2147483647, 1, 1, 8),
('bx_events_submenu', 'bx_events', 'events-manage', '_bx_events_menu_item_title_system_entries_manage', '_bx_events_menu_item_title_entries_manage', 'page.php?i=events-manage', '', '', '', '', 2147483646, 1, 1, 9);

-- MENU: view submenu

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_view_submenu', '_bx_events_menu_title_view_profile_submenu', 'bx_events_view_submenu', 'bx_events', 18, 0, 1, 'BxEventsMenuView', 'modules/boonex/events/classes/BxEventsMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_events_view_submenu', 'bx_events', '_bx_events_menu_set_title_view_profile_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_events_view_submenu', 'bx_events', 'view-event-profile', '_bx_events_menu_item_title_system_view_profile_view', '_bx_events_menu_item_title_view_profile_view', 'page.php?i=view-event-profile&id={content_id}', '', '', 'calendar', '', '', 0, 2147483647, 1, 0, 1),
('bx_events_view_submenu', 'bx_events', 'event-profile-info', '_bx_events_menu_item_title_system_view_profile_info', '_bx_events_menu_item_title_view_profile_info', 'page.php?i=event-profile-info&id={content_id}', '', '', 'info-circle col-gray', '', '', 0, 2147483647, 1, 0, 2),
('bx_events_view_submenu', 'bx_events', 'event-profile-comments', '_bx_events_menu_item_title_system_view_profile_comments', '_bx_events_menu_item_title_view_profile_comments', 'page.php?i=event-profile-comments&id={content_id}', '', '', '', '', '', 0, 2147483647, 0, 0, 3),
('bx_events_view_submenu', 'bx_events', 'event-fans', '_bx_events_menu_item_title_system_view_fans', '_bx_events_menu_item_title_view_fans', 'page.php?i=event-fans&profile_id={profile_id}', '', '', 'calendar col-blue3', '', '', 0, 2147483647, 1, 0, 4),
('bx_events_view_submenu', 'bx_events', 'more-auto', '_bx_events_menu_item_title_system_view_profile_more_auto', '_bx_events_menu_item_title_view_profile_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, 1, 0, 9999);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_events_snippet_meta', 'bx_events', 15, 0, 1, 'BxEventsMenuSnippetMeta', 'modules/boonex/events/classes/BxEventsMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_events_snippet_meta', 'bx_events', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES
('bx_events_snippet_meta', 'bx_events', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, '', 0, 0, 1, 1),
('bx_events_snippet_meta', 'bx_events', 'date-start', '_bx_events_menu_item_title_system_sm_date_start', '_bx_events_menu_item_title_sm_date_start', '', '', '', '', '', 2147483647, '', 0, 0, 1, 2),
('bx_events_snippet_meta', 'bx_events', 'date-end', '_bx_events_menu_item_title_system_sm_date_end', '_bx_events_menu_item_title_sm_date_end', '', '', '', '', '', 2147483647, '', 0, 0, 1, 3),
('bx_events_snippet_meta', 'bx_events', 'category', '_sys_menu_item_title_system_sm_category', '_sys_menu_item_title_sm_category', '', '', '', '', '', 2147483647, '', 0, 0, 1, 5),
('bx_events_snippet_meta', 'bx_events', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, '', 0, 0, 1, 10),
('bx_events_snippet_meta', 'bx_events', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, '', 0, 0, 1, 15),
('bx_events_snippet_meta', 'bx_events', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 2147483647, '', 0, 0, 1, 16),
('bx_events_snippet_meta', 'bx_events', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 2147483647, '', 0, 0, 1, 17),
('bx_events_snippet_meta', 'bx_events', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 2147483647, '', 0, 0, 1, 18),
('bx_events_snippet_meta', 'bx_events', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, '', 0, 0, 1, 20),
('bx_events_snippet_meta', 'bx_events', 'members', '_sys_menu_item_title_system_sm_members', '_sys_menu_item_title_sm_members', '', '', '', '', '', 2147483647, '', 1, 0, 1, 25),
('bx_events_snippet_meta', 'bx_events', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_sys_menu_item_title_sm_subscribers', '', '', '', '', '', 2147483647, '', 0, 0, 1, 30),
('bx_events_snippet_meta', 'bx_events', 'country', '_sys_menu_item_title_system_sm_country', '_sys_menu_item_title_sm_country', '', '', '', '', '', 2147483647, '', 0, 0, 1, 35),
('bx_events_snippet_meta', 'bx_events', 'country-city', '_sys_menu_item_title_system_sm_country_city', '_sys_menu_item_title_sm_country_city', '', '', '', '', '', 2147483647, '', 0, 0, 1, 40),
('bx_events_snippet_meta', 'bx_events', 'nl', '_sys_menu_item_title_system_sm_nl', '_sys_menu_item_title_sm_nl', '', '', '', '', '', 2147483647, '', 1, 0, 1, 45),
('bx_events_snippet_meta', 'bx_events', 'join-paid', '_sys_menu_item_title_system_sm_join_paid', '_sys_menu_item_title_sm_join_paid', '', '', '', '', '', 2147483647, 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:33:"is_paid_join_avaliable_by_content";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 1, 0, 1, 50),
('bx_events_snippet_meta', 'bx_events', 'join', '_sys_menu_item_title_system_sm_join', '_sys_menu_item_title_sm_join', '', '', '', '', '', 2147483647, 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:33:"is_free_join_avaliable_by_content";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 1, 0, 1, 55),
('bx_events_snippet_meta', 'bx_events', 'leave', '_sys_menu_item_title_system_sm_leave', '_sys_menu_item_title_sm_leave', '', '', '', '', '', 2147483647, '', 0, 0, 1, 60),
('bx_events_snippet_meta', 'bx_events', 'subscribe', '_sys_menu_item_title_system_sm_subscribe', '_sys_menu_item_title_sm_subscribe', '', '', '', '', '', 2147483647, '', 0, 0, 1, 65),
('bx_events_snippet_meta', 'bx_events', 'unsubscribe', '_sys_menu_item_title_system_sm_unsubscribe', '_sys_menu_item_title_sm_unsubscribe', '', '', '', '', '', 2147483647, '', 0, 0, 1, 70);

-- MENU: profile stats
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_events', 'profile-stats-my-events', '_bx_events_menu_item_title_system_manage_my_groups', '_bx_events_menu_item_title_manage_my_groups', 'page.php?i=joined-events&profile_id={member_id}', '', '_self', 'calendar', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:41:"get_menu_addon_manage_tools_profile_stats";}', '', 2147483646, 1, 0, @iNotifMenuOrder + 2);

-- MENU: profile followings
SET @iFollowingsMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_profile_followings' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `collapsed`, `active`, `copyable`, `order`) VALUES 
('sys_profile_followings', 'bx_events', 'events', '_bx_events_menu_item_title_system_followings', '_bx_events_menu_item_title_followings', 'javascript:void(0)', '', '_self', 'calendar', '', '', 2147483647, 0, 1, 0, @iFollowingsMenuOrder + 1);

-- MENU: profile memberships (the contexts one belongs to)
SET @iMembershipsMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_profile_memberships' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `collapsed`, `active`, `copyable`, `order`) VALUES 
('sys_profile_memberships', 'bx_events', 'events', '_bx_events_menu_item_title_system_memberships', '_bx_events_menu_item_title_memberships', 'javascript:void(0)', '', '_self', 'calendar', '', '', 2147483646, 0, 1, 0, @iMembershipsMenuOrder + 1);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_menu_manage_tools', '_bx_events_menu_title_manage_tools', 'bx_events_menu_manage_tools', 'bx_events', 6, 0, 1, 'BxEventsMenuManageTools', 'modules/boonex/events/classes/BxEventsMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_events_menu_manage_tools', 'bx_events', '_bx_events_menu_set_title_manage_tools', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_events_menu_manage_tools', 'bx_events', 'clear-reports', '_bx_events_menu_item_title_system_clear_reports', '_bx_events_menu_item_title_clear_reports', 'javascript:void(0)', 'javascript:{js_object}.onClickClearReports({content_id});', '_self', 'eraser', '', 2147483647, 1, 0, 1),
('bx_events_menu_manage_tools', 'bx_events', 'delete', '_bx_events_menu_item_title_system_delete', '_bx_events_menu_item_title_delete', 'javascript:void(0)', 'javascript:{js_object}.onClickDelete({content_id});', '_self', 'far trash-alt', '', 2147483647, 1, 0, 2),
('bx_events_menu_manage_tools', 'bx_events', 'delete-with-content', '_bx_events_menu_item_title_system_delete_with_content', '_bx_events_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 2147483647, 0, 0, 3);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_events', 'events-administration', '_bx_events_menu_item_title_system_admt_groups', '_bx_events_menu_item_title_admt_groups', 'page.php?i=events-administration', '', '_self', 'calendar', 'a:2:{s:6:"module";s:9:"bx_events";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_events', 'joined-events', '_bx_events_menu_item_title_system_view_joined_groups', '_bx_events_menu_item_title_view_joined_groups', 'page.php?i=joined-events&profile_id={profile_id}', '', '', 'calendar', '', 2147483647, '', 1, 0, 0),
('trigger_group_view_submenu', 'bx_events', 'events-context', '_bx_events_menu_item_title_system_view_entries_in_context', '_bx_events_menu_item_title_view_entries_in_context', 'page.php?i=events-context&profile_id={profile_id}', '', '', 'calendar', '', 2147483647, 'a:3:{s:6:"module";s:9:"bx_events";s:6:"method";s:21:"is_enable_for_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 1, 0, 0);


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_events', 'create entry', NULL, '_bx_events_acl_action_create_profile', '', 1, 1);
SET @iIdActionProfileCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_events', 'use paid join', NULL, '_bx_events_acl_action_use_paid_join', '', 1, 1);
SET @iIdActionUsePaidJoin = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_events', 'delete entry', NULL, '_bx_events_acl_action_delete_profile', '', 1, 1);
SET @iIdActionProfileDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_events', 'view entry', NULL, '_bx_events_acl_action_view_profile', '', 1, 0);
SET @iIdActionProfileView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_events', 'edit any entry', NULL, '_bx_events_acl_action_edit_any_profile', '', 1, 3);
SET @iIdActionProfileEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_events', 'delete any entry', NULL, '_bx_events_acl_action_delete_any_profile', '', 1, 3);
SET @iIdActionProfileDeleteAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_events', 'delete invites', NULL, '_bx_events_acl_action_delete_invites', '', 1, 3);
SET @iIdActionProfileDeleteInvites = LAST_INSERT_ID();

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

-- profile create
(@iAccount, @iIdActionProfileCreate),
(@iStandard, @iIdActionProfileCreate),
(@iUnconfirmed, @iIdActionProfileCreate),
(@iPending, @iIdActionProfileCreate),
(@iModerator, @iIdActionProfileCreate),
(@iAdministrator, @iIdActionProfileCreate),
(@iPremium, @iIdActionProfileCreate),

-- use paid join
(@iStandard, @iIdActionUsePaidJoin),
(@iModerator, @iIdActionUsePaidJoin),
(@iAdministrator, @iIdActionUsePaidJoin),
(@iPremium, @iIdActionUsePaidJoin),

-- profile delete
(@iAccount, @iIdActionProfileDelete),
(@iStandard, @iIdActionProfileDelete),
(@iUnconfirmed, @iIdActionProfileDelete),
(@iPending, @iIdActionProfileDelete),
(@iModerator, @iIdActionProfileDelete),
(@iAdministrator, @iIdActionProfileDelete),
(@iPremium, @iIdActionProfileDelete),

-- profile view
(@iUnauthenticated, @iIdActionProfileView),
(@iAccount, @iIdActionProfileView),
(@iStandard, @iIdActionProfileView),
(@iUnconfirmed, @iIdActionProfileView),
(@iPending, @iIdActionProfileView),
(@iModerator, @iIdActionProfileView),
(@iAdministrator, @iIdActionProfileView),
(@iPremium, @iIdActionProfileView),

-- any profile edit
(@iModerator, @iIdActionProfileEditAny),
(@iAdministrator, @iIdActionProfileEditAny),

-- any profile delete
(@iAdministrator, @iIdActionProfileDeleteAny),

-- any invites edit
(@iModerator, @iIdActionProfileDeleteInvites),
(@iAdministrator, @iIdActionProfileDeleteInvites);

-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('bx_events', 'bx_events', 'bx_events_meta_keywords', 'bx_events_meta_locations', 'bx_events_meta_mentions', '', '');

-- CATEGORY
INSERT INTO `sys_objects_category` (`object`, `module`, `search_object`, `form_object`, `list_name`, `table`, `field`, `join`, `where`, `override_class_name`, `override_class_file`) VALUES
('bx_events_cats', 'bx_events', 'bx_events', 'bx_event', 'bx_events_cats', 'bx_events_data', 'event_cat', 'INNER JOIN `sys_profiles` ON (`sys_profiles`.`content_id` = `bx_events_data`.`id` AND `sys_profiles`.`type` = ''bx_events'')', 'AND `sys_profiles`.`status` = ''active''', '', '');

-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_events', '_bx_events', @iSearchOrder + 1, 'BxEventsSearchResult', 'modules/boonex/events/classes/BxEventsSearchResult.php');

-- CONNECTIONS
INSERT INTO `sys_objects_connection` (`object`, `table`, `profile_initiator`, `profile_content`, `type`, `tt_content`, `tf_id_content`, `tf_count_content`, `override_class_name`, `override_class_file`) VALUES
('bx_events_fans', 'bx_events_fans', 1, 1, 'mutual', 'bx_events_data', 'id', 'members', 'BxEventsConnectionFans', 'modules/boonex/events/classes/BxEventsConnectionFans.php');

-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_events', 'bx_events', '_bx_events', 'page.php?i=events-home', 'calendar', 'SELECT COUNT(*) FROM `bx_events_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_events'' WHERE 1 AND `tp`.`status`=''active''', @iMaxOrderStats + 1);

-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_events_growth', '_bx_events_chart_growth', 'bx_events_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_events'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_events_growth_speed', '_bx_events_chart_growth_speed', 'bx_events_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_events'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

-- GRID: connections
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('bx_events_fans', 'Sql', 'SELECT `p`.`id`, `c`.`added`, `c`.`mutual` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxEventsGridConnections', 'modules/boonex/events/classes/BxEventsGridConnections.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_events_fans', 'name', '_sys_name', '40%', '', 10),
('bx_events_fans', 'role', '_bx_events_txt_role', '10%', '', 15),
('bx_events_fans', 'role_added', '_bx_events_txt_role_added', '10%', '', 16),
('bx_events_fans', 'role_expired', '_bx_events_txt_role_expired', '10%', '', 17),
('bx_events_fans', 'actions', '', '30%', '', 20);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_events_fans', 'single', 'questionnaire', '_bx_events_txt_view_answers', 'check-double', 1, 0, 5),
('bx_events_fans', 'single', 'accept', '_sys_accept', '', 0, 0, 10),
('bx_events_fans', 'single', 'set_role', '_bx_events_txt_set_role', '', 0, 0, 20),
('bx_events_fans', 'single', 'set_role_submit', '', '', 0, 0, 21),
('bx_events_fans', 'single', 'delete', '', 'remove', 0, 1, 40);

-- GRID: invites
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('bx_events_invites', 'Sql', 'SELECT `bx_events_invites`.`id`, `bx_events_invites`.`invited_profile_id`, `bx_events_invites`.`added`, `bx_events_invites`.`author_profile_id` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) INNER JOIN `bx_events_invites` ON `bx_events_invites`.`invited_profile_id` = `p`.`id` ', 'bx_events_invites', 'id', 'bx_events_invites`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxEventsGridInvites', 'modules/boonex/events/classes/BxEventsGridInvites.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_events_invites', 'name', '_sys_name', '33%', '', 10),
('bx_events_invites', 'added', '_sys_added', '33%', '', 20),
('bx_events_invites', 'actions', '', '34%', '', 30);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_events_invites', 'single', 'delete', '', 'remove', 1, 10);

-- GRIDS: administration
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_events_administration', 'Sql', 'SELECT `td`.*, `td`.`event_name` AS `name`, `ta`.`email` AS `account`, `td`.`added` AS `added_ts`, `tp`.`status` AS `status_profile` FROM `bx_events_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_events'' LEFT JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` WHERE 1 ', 'bx_events_data', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'event_name', '', 'like', 'reports', '', 192, 'BxEventsGridAdministration', 'modules/boonex/events/classes/BxEventsGridAdministration.php'),
('bx_events_common', 'Sql', 'SELECT `td`.*, `td`.`event_name` AS `name`, `ta`.`email` AS `account`, `td`.`added` AS `added_ts`, `tp`.`status` AS `status_profile` FROM `bx_events_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_events'' LEFT JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` WHERE 1 ', 'bx_events_data', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'event_name', '', 'like', '', '', 2147483647, 'BxEventsGridCommon', 'modules/boonex/events/classes/BxEventsGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_events_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_events_administration', 'switcher', '_bx_events_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_events_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_events_administration', 'name', '_bx_events_grid_column_title_adm_name', '25%', 0, '', '', 4),
('bx_events_administration', 'added_ts', '_bx_events_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_events_administration', 'account', '_bx_events_grid_column_title_adm_account', '20%', 0, '25', '', 6),
('bx_events_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_events_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_events_common', 'switcher', '_bx_events_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_events_common', 'name', '_bx_events_grid_column_title_adm_name', '40%', 0, '', '', 3),
('bx_events_common', 'added_ts', '_bx_events_grid_column_title_adm_added', '30%', 1, '25', '', 4),
('bx_events_common', 'actions', '', '20%', 0, '', '', 5);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('bx_events_administration', 'bulk', 'clear_reports', '_bx_events_grid_action_title_adm_clear_reports', '', 0, 1, 1, 1),
('bx_events_administration', 'bulk', 'delete', '_bx_events_grid_action_title_adm_delete', '', 0, 1, 1, 2),
('bx_events_administration', 'bulk', 'delete_with_content', '_bx_events_grid_action_title_adm_delete_with_content', '', 0, 1, 0, 3),
('bx_events_administration', 'single', 'settings', '_bx_events_grid_action_title_adm_more_actions', 'cog', 1, 0, 1, 2),
('bx_events_administration', 'single', 'audit_content', '_bx_events_grid_action_title_adm_audit_content', 'search', 1, 0, 1, 3),
('bx_events_administration', 'single', 'audit_context', '_bx_events_grid_action_title_adm_audit_context', 'search-location', 1, 0, 1, 4),

('bx_events_common', 'bulk', 'delete', '_bx_events_grid_action_title_adm_delete', '', 0, 1, 1, 1),
('bx_events_common', 'bulk', 'delete_with_content', '_bx_events_grid_action_title_adm_delete_with_content', '', 0, 1, 0, 2),
('bx_events_common', 'single', 'settings', '_bx_events_grid_action_title_adm_more_actions', 'cog', 1, 0, 1, 1);

-- GRIDS: questionnaire
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_events_questions_manage', 'Sql', 'SELECT * FROM `bx_events_qnr_questions` WHERE 1 ', 'bx_events_qnr_questions', 'id', 'order', '', '', 100, NULL, 'start', '', 'question', '', 'like', '', '', 2147483647, 'BxEventsGridQuestionsManage', 'modules/boonex/events/classes/BxEventsGridQuestionsManage.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_events_questions_manage', 'checkbox', '_sys_select', '1%', 0, '', '', 1),
('bx_events_questions_manage', 'order', '', '1%', 0, '', '', 2),
('bx_events_questions_manage', 'question', '_bx_events_grid_column_title_qn_question', '78%', 0, 64, '', 3),
('bx_events_questions_manage', 'actions', '', '20%', 0, '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_events_questions_manage', 'independent', 'add', '_bx_events_grid_action_title_qn_add', '', 0, 0, 1),
('bx_events_questions_manage', 'single', 'edit', '_bx_events_grid_action_title_qn_edit', 'pencil-alt', 1, 0, 1),
('bx_events_questions_manage', 'single', 'delete', '_bx_events_grid_action_title_qn_delete', 'remove', 1, 1, 2),
('bx_events_questions_manage', 'bulk', 'delete', '_bx_events_grid_action_title_qn_delete', '', 0, 1, 1);

-- GRIDS: Sessions
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_events_sessions_manage', 'Sql', 'SELECT * FROM `bx_events_sessions` WHERE 1 ', 'bx_events_sessions', 'id', 'order', '', '', 100, NULL, 'start', '', 'title,description', '', 'like', '', '', 2147483647, 'BxEventsGridSessionsManage', 'modules/boonex/events/classes/BxEventsGridSessionsManage.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_events_sessions_manage', 'checkbox', '_sys_select', '1%', 0, '', '', 1),
('bx_events_sessions_manage', 'order', '', '1%', 0, '', '', 2),
('bx_events_sessions_manage', 'title', '_bx_events_grid_column_title_sn_title', '28%', 0, 16, '', 3),
('bx_events_sessions_manage', 'description', '_bx_events_grid_column_title_sn_description', '30%', 0, 32, '', 4),
('bx_events_sessions_manage', 'date_start', '_bx_events_grid_column_title_sn_date_start', '10%', 0, 0, '', 5),
('bx_events_sessions_manage', 'date_end', '_bx_events_grid_column_title_sn_date_end', '10%', 0, 0, '', 6),
('bx_events_sessions_manage', 'actions', '', '20%', 0, '', '', 7);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_events_sessions_manage', 'independent', 'add', '_bx_events_grid_action_title_sn_add', '', 0, 0, 1),
('bx_events_sessions_manage', 'single', 'edit', '_bx_events_grid_action_title_sn_edit', 'pencil-alt', 1, 0, 1),
('bx_events_sessions_manage', 'single', 'delete', '_bx_events_grid_action_title_sn_delete', 'remove', 1, 1, 2),
('bx_events_sessions_manage', 'bulk', 'delete', '_bx_events_grid_action_title_sn_delete', '', 0, 1, 1);

-- GRIDS: Pricing
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_events_prices_manage', 'Sql', 'SELECT *, `default` AS `default_price` FROM `bx_events_prices` WHERE 1 ', 'bx_events_prices', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'period,period_unit,price', '', 'like', '', '', 2147483647, 'BxEventsGridPricesManage', 'modules/boonex/events/classes/BxEventsGridPricesManage.php'),
('bx_events_prices_view', 'Sql', 'SELECT * FROM `bx_events_prices` WHERE `active`<>''0'' ', 'bx_events_prices', 'id', 'order', '', '', 100, NULL, 'start', '', 'period,period_unit,price', '', 'like', '', '', 2147483647, 'BxEventsGridPricesView', 'modules/boonex/events/classes/BxEventsGridPricesView.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_events_prices_manage', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_events_prices_manage', 'order', '', '2%', 0, 0, '', 2),
('bx_events_prices_manage', 'switcher', '', '6%', 0, 0, '', 3),
('bx_events_prices_manage', 'name', '_bx_events_grid_column_title_name', '15%', 0, 16, '', 4),
('bx_events_prices_manage', 'caption', '_bx_events_grid_column_title_caption', '20%', 0, 32, '', 5),
('bx_events_prices_manage', 'price', '_bx_events_grid_column_title_price', '15%', 0, 16, '', 6),
('bx_events_prices_manage', 'period', '_bx_events_grid_column_title_period', '15%', 0, 16, '', 7),
('bx_events_prices_manage', 'default_price', '_bx_events_grid_column_title_default_price', '5%', 0, 0, '', 8),
('bx_events_prices_manage', 'actions', '', '20%', 0, 0, '', 9),

('bx_events_prices_view', 'role_id', '_bx_events_grid_column_title_role_id', '40%', 0, 32, '', 1),
('bx_events_prices_view', 'price', '_bx_events_grid_column_title_price', '20%', 0, 16, '', 2),
('bx_events_prices_view', 'period', '_bx_events_grid_column_title_period', '20%', 0, 16, '', 3),
('bx_events_prices_view', 'actions', '', '20%', 0, '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_events_prices_manage', 'independent', 'add', '_bx_events_grid_action_title_add', '', 0, 0, 1),
('bx_events_prices_manage', 'single', 'edit', '_bx_events_grid_action_title_edit', 'pencil-alt', 1, 0, 1),
('bx_events_prices_manage', 'single', 'delete', '_bx_events_grid_action_title_delete', 'remove', 1, 1, 2),
('bx_events_prices_manage', 'bulk', 'delete', '_bx_events_grid_action_title_delete', '', 0, 1, 1),

('bx_events_prices_view', 'single', 'buy', '_bx_events_grid_action_title_buy', 'cart-plus', 0, 0, 1),
('bx_events_prices_view', 'single', 'subscribe', '_bx_events_grid_action_title_subscribe', 'credit-card', 0, 0, 2),
('bx_events_prices_view', 'single', 'choose', '_bx_events_grid_action_title_choose', 'far check-square', 0, 0, 3);


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_events', 'BxEventsAlertsResponse', 'modules/boonex/events/classes/BxEventsAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('system', 'check_allowed_fan_add', @iHandler),
('bx_timeline', 'post_common', @iHandler),
('bx_events_pics', 'file_deleted', @iHandler),
('bx_events_fans', 'connection_added', @iHandler),
('bx_events_fans', 'connection_removed', @iHandler),
('profile', 'delete', @iHandler),
('bx_events', 'fan_added', @iHandler),
('bx_events', 'join_invitation', @iHandler),
('bx_events', 'join_request', @iHandler),
('bx_events', 'join_request_accepted', @iHandler),
('bx_events', 'timeline_view', @iHandler),
('bx_events', 'timeline_post', @iHandler),
('bx_events', 'timeline_delete', @iHandler),
('bx_events', 'timeline_comment', @iHandler),
('bx_events', 'timeline_vote', @iHandler),
('bx_events', 'timeline_score', @iHandler),
('bx_events', 'timeline_report', @iHandler),
('bx_events', 'timeline_repost', @iHandler),
('bx_events', 'timeline_pin', @iHandler),
('bx_events', 'timeline_promote', @iHandler);

-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `spaces`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_events_allow_view_to', 'bx_events', 'view', '_bx_events_form_profile_input_allow_view_to', '3', 'bx_groups,bx_spaces', 'bx_events_data', 'id', 'author', 'BxEventsPrivacy', 'modules/boonex/events/classes/BxEventsPrivacy.php'),
('bx_events_allow_view_notification_to', 'bx_events', 'view_event', '_bx_events_form_profile_input_allow_view_notification_to', '3', '', 'bx_notifications_events', 'id', 'object_owner_id', 'BxEventsPrivacyNotifications', 'modules/boonex/events/classes/BxEventsPrivacyNotifications.php'),
('bx_events_allow_post_to', 'bx_events', 'post', '_bx_events_form_profile_input_allow_post_to', 'p', '', 'bx_events_data', 'id', 'author', 'BxEventsPrivacyPost', 'modules/boonex/events/classes/BxEventsPrivacyPost.php'),
('bx_events_allow_view_favorite_list', 'bx_events', 'view_favorite_list', '_bx_events_form_profile_input_allow_view_favorite_list', '3', '', 'bx_events_favorites_lists', 'id', 'author_id', 'BxEventsPrivacy', 'modules/boonex/events/classes/BxEventsPrivacy.php');


-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_events', '_bx_events_email_join_request', 'bx_events_join_request', '_bx_events_email_join_request_subject', '_bx_events_email_join_request_body'),
('bx_events', '_bx_events_email_join_reject', 'bx_events_join_reject', '_bx_events_email_join_reject_subject', '_bx_events_email_join_reject_body'),
('bx_events', '_bx_events_email_join_confirm', 'bx_events_join_confirm', '_bx_events_email_join_confirm_subject', '_bx_events_email_join_confirm_body'),
('bx_events', '_bx_events_email_fan_remove', 'bx_events_fan_remove', '_bx_events_email_fan_remove_subject', '_bx_events_email_fan_remove_body'),
('bx_events', '_bx_events_email_fan_become_admin', 'bx_events_fan_become_admin', '_bx_events_email_fan_become_admin_subject', '_bx_events_email_fan_become_admin_body'),
('bx_events', '_bx_events_email_admin_become_fan', 'bx_events_admin_become_fan', '_bx_events_email_admin_become_fan_subject', '_bx_events_email_admin_become_fan_body'),
('bx_events', '_bx_events_email_set_role', 'bx_events_set_role', '_bx_events_email_set_role_subject', '_bx_events_email_set_role_body'),
('bx_events', '_bx_events_email_invitation', 'bx_events_invitation', '_bx_events_email_invitation_subject', '_bx_events_email_invitation_body'),
('bx_events', '_bx_events_email_reminder', 'bx_events_reminder', '_bx_events_email_reminder_subject', '_bx_events_email_reminder_body');

-- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_events_cover_crop', 1, 'BxEventsUploaderCoverCrop', 'modules/boonex/events/classes/BxEventsUploaderCoverCrop.php'),
('bx_events_picture_crop', 1, 'BxEventsUploaderPictureCrop', 'modules/boonex/events/classes/BxEventsUploaderPictureCrop.php');

-- CRON
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_events_process_reminders', '55 * * * *', 'BxEventsCronProcessReminders', 'modules/boonex/events/classes/BxEventsCronProcessReminders.php', ''),
('bx_events_pruning', '0 0 * * *', 'BxEventsCronPruning', 'modules/boonex/events/classes/BxEventsCronPruning.php', ''),
('bx_events_publishing', '* * * * *', 'BxEventsCronPublishing', 'modules/boonex/events/classes/BxEventsCronPublishing.php', '');

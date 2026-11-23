
-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_channels', '_bx_channels', 'bx_channels@modules/boonex/channels/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_channels', '_bx_channels', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `info`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
('bx_channels_default_author', '', @iCategId, '_bx_channels_option_default_author', '', 'select', 'a:2:{s:6:"module";s:11:"bx_channels";s:6:"method";s:26:"get_options_default_author";}', '', '', '', 1),
('bx_channels_use_cover_as_thumb', 'on', @iCategId, '_bx_channels_option_use_cover_as_thumb', '_bx_channels_option_use_cover_as_thumb_inf', 'checkbox', '', '', '', '', 5),
('bx_channels_num_connections_quick', '6', @iCategId, '_bx_channels_option_num_connections_quick', '', 'digit', '', '', '', '', 10),
('bx_channels_per_page_browse', '24', @iCategId, '_bx_channels_option_per_page_browse', '', 'digit', '', '', '', '', 11),
('bx_channels_num_rss', '10', @iCategId, '_bx_channels_option_num_rss', '', 'digit', '', '', '', '', 12),
('bx_channels_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', '', 'digit', '', '', '', '', 15),
('bx_channels_per_page_browse_recommended', '10', @iCategId, '_sys_option_per_page_browse_recommended', '', 'digit', '', '', '', '', 16),
('bx_channels_browse_active_n_posts', '1', @iCategId, '_bx_channels_option_browse_active_n_posts', '', 'digit', '', '', '', '', 20),
('bx_channels_browse_active_x_hours', '24', @iCategId, '_bx_channels_option_browse_active_x_hours', '', 'digit', '', '', '', '', 21),
('bx_channels_browse_trending_x_hours', '24', @iCategId, '_bx_channels_option_browse_trending_x_hours', '', 'digit', '', '', '', '', 23),
('bx_channels_searchable_fields', 'channel_name', @iCategId, '_bx_channels_option_searchable_fields', '', 'list', 'a:2:{s:6:"module";s:11:"bx_channels";s:6:"method";s:21:"get_searchable_fields";}', '', '', '', 30),
('bx_channels_labels_autofollow', 'on', @iCategId, '_bx_channels_option_labels_autofollow', '', 'checkbox', '', '', '', '', 40);


-- PAGES

-- PAGE: view profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_view_profile', 'view-channel-profile', '_bx_channels_page_title_sys_view_profile', '_bx_channels_page_title_view_profile', 'bx_channels', 10, 2147483647, 1, 'page.php?i=view-channel-profile', '', '', '', 0, 1, 0, 'BxCnlPageEntry', 'modules/boonex/channels/classes/BxCnlPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_channels_view_profile', 1, 'bx_channels', '', '_bx_channels_page_block_title_entry_social_sharing', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:21:\"entity_social_sharing\";}', 0, 0, 0, 0),
('bx_channels_view_profile', 1, 'bx_channels', '', '_bx_channels_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:18:\"entity_all_actions\";}', 0, 0, 0, 0),
('bx_channels_view_profile', 1, 'bx_channels', '', '_bx_channels_page_block_title_entry_breadcrumb', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_channels";s:6:"method";s:17:"entity_breadcrumb";}', 0, 0, 1, 1),
('bx_channels_view_profile', 2, 'bx_channels', '', '_bx_channels_page_block_title_entry_parent', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_channels";s:6:"method";s:13:"entity_parent";}', 0, 0, 1, 1),
('bx_channels_view_profile', 3, 'bx_channels', '', '_bx_channels_page_block_title_entry_childs', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_channels";s:6:"method";s:13:"entity_childs";}', 0, 0, 1, 1),
('bx_channels_view_profile', 4, 'bx_channels', '', '_bx_channels_page_block_title_search_results_by_hashtag', 0, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:24:\"search_result_by_hashtag\";}', 0, 0, 0, 0),
('bx_channels_view_profile', 4, 'bx_channels', '', '_bx_channels_page_block_title_profile_comments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 0, 1),
('bx_channels_view_profile', 4, 'bx_channels', '', '_bx_channels_page_block_title_profile_subscribed_me', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:21:\"profile_subscribed_me\";}', 0, 1, 1, 0),
('bx_channels_view_profile', 4, 'bx_channels', '', '_bx_channels_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);

-- PAGE: view closed profile 

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_view_profile_closed', 'view-channel-profile-closed', '_bx_channels_page_title_sys_view_profile_closed', '_bx_channels_page_title_view_profile', 'bx_channels', 10, 2147483647, 1, 'page.php?i=view-channel-profile', '', '', '', 0, 1, 0, 'BxCnlPageEntry', 'modules/boonex/channels/classes/BxCnlPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_channels_view_profile_closed', 2, 'bx_channels', '', '_bx_channels_page_block_title_profile_info', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:11:\"entity_info\";}', 0, 0, 1, 0);

-- PAGE: edit profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_edit_profile', 'edit-channel-profile', '_bx_channels_page_title_sys_edit_profile', '_bx_channels_page_title_edit_profile', 'bx_channels', 5, 2147483647, 1, 'page.php?i=edit-channel-profile', '', '', '', 0, 1, 0, 'BxCnlPageEntry', 'modules/boonex/channels/classes/BxCnlPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_channels_edit_profile', 1, 'bx_channels', '_bx_channels_page_block_title_edit_profile', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:11:\"entity_edit\";}', 0, 0, 0);


-- PAGE: delete profile

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_delete_profile', 'delete-channel-profile', '_bx_channels_page_title_sys_delete_profile', '_bx_channels_page_title_delete_profile', 'bx_channels', 5, 2147483647, 1, 'page.php?i=delete-channel-profile', '', '', '', 0, 1, 0, 'BxCnlPageEntry', 'modules/boonex/channels/classes/BxCnlPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_channels_delete_profile', 1, 'bx_channels', '_bx_channels_page_block_title_delete_profile', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:13:\"entity_delete\";}', 0, 0, 0);

-- PAGE: view entry comments
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_profile_comments', '_bx_channels_page_title_sys_profile_comments', '_bx_channels_page_title_profile_comments', 'bx_channels', 5, 2147483647, 1, 'channel-profile-comments', '', '', '', '', 0, 1, 0, 'BxCnlPageEntry', 'modules/boonex/channels/classes/BxCnlPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_channels_profile_comments', 1, 'bx_channels', '_bx_channels_page_block_title_profile_comments', '_bx_channels_page_block_title_profile_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 0, 1);

-- PAGE: entries of author

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_author', 'channels-author', '_bx_channels_page_title_sys_entries_of_author', '_bx_channels_page_title_entries_of_author', 'bx_channels', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxCnlPageAuthor', 'modules/boonex/channels/classes/BxCnlPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_channels_author', 1, 'bx_channels', '_bx_channels_page_block_title_sys_favorites_of_author', '_bx_channels_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_channels";s:6:"method";s:15:"browse_favorite";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 1, 1, 1),
('bx_channels_author', 1, 'bx_channels', '_bx_channels_page_block_title_sys_entries_of_author', '_bx_channels_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_channels";s:6:"method";s:13:"browse_author";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:1;}}}}', 0, 0, 1, 2);

-- PAGE: module home

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_home', '_bx_channels_page_title_sys_recent', '_bx_channels_page_title_recent', 'bx_channels', 5, 2147483647, 1, 'channels-home', 'page.php?i=channels-home', '', '', '', 0, 1, 0, 'BxCnlPageBrowse', 'modules/boonex/channels/classes/BxCnlPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_channels_home', 1, 'bx_channels', '_bx_channels_page_block_title_featured_profiles', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_channels";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:7:"gallery";}}', 0, 1, 1, 0),
('bx_channels_home', 1, 'bx_channels', '_bx_channels_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:22:\"browse_recent_profiles\";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 1, 1),
('bx_channels_home', 1, 'bx_channels', '_bx_channels_page_block_title_entries_my', 11, 2147483646, 'service', 'a:2:{s:6:"module";s:11:"bx_channels";s:6:"method";s:13:"browse_author";}',  0, 1, 0, 0);

-- PAGE: top profiles

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_top', '_bx_channels_page_title_sys_top', '_bx_channels_page_title_top', 'bx_channels', 5, 2147483647, 1, 'channels-top', 'page.php?i=channels-top', '', '', '', 0, 1, 0, 'BxCnlPageBrowse', 'modules/boonex/channels/classes/BxCnlPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_channels_top', 1, 'bx_channels', '_bx_channels_page_block_title_top_profiles', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:19:\"browse_top_profiles\";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 0);

-- PAGE: top level entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_toplevel', '_bx_channels_page_title_sys_entries_toplevel', '_bx_channels_page_title_entries_toplevel', 'bx_channels', 5, 2147483647, 1, 'channels-toplevel', 'page.php?i=toplevel', '', '', '', 0, 1, 0, 'BxCnlPageBrowse', 'modules/boonex/channels/classes/BxCnlPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_channels_toplevel', 1, 'bx_channels', '_bx_channels_page_block_title_toplevel', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:15:\"browse_by_level\";s:6:"params";a:2:{i:0;i:0;i:1;b:1;}}', 0, 1, 1, 1);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_search', '_bx_channels_page_title_sys_entries_search', '_bx_channels_page_title_entries_search', 'bx_channels', 1, 2147483647, 1, 'channels-search', 'page.php?i=channels-search', '', '', '', 0, 1, 0, 'BxCnlPageBrowse', 'modules/boonex/channels/classes/BxCnlPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_channels_search', 1, 'bx_channels', '_bx_channels_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:11:"bx_channels";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_channels_search', 2, 'bx_channels', '_bx_channels_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:11:"bx_channels";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 2),
('bx_channels_search', 1, 'bx_channels', '_bx_channels_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:16:"bx_channels_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_channels_search', 2, 'bx_channels', '_bx_channels_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:16:"bx_channels_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_administration', '_bx_channels_page_title_sys_manage_administration', '_bx_channels_page_title_manage', 'bx_channels', 5, 128, 1, 'channels-administration', 'page.php?i=channels-administration', '', '', '', 0, 1, 0, 'BxCnlPageBrowse', 'modules/boonex/channels/classes/BxCnlPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_channels_administration', 1, 'bx_channels', '_bx_channels_page_block_title_system_manage_administration', '_bx_channels_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:12:\"manage_tools\";s:6:\"params\";a:1:{i:0;s:14:\"administration\";}}', 0, 1, 0);

-- PAGE: add block to homepage
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_home', 1, 'bx_channels', '', '_bx_channels_page_block_title_latest_profiles', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_channels";s:6:"method";s:22:"browse_recent_profiles";}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1),
('sys_home', 1, 'bx_channels', '_bx_channels_page_block_title_sys_recommended_entries_view_showcase', '_bx_channels_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_channels";s:6:"method";s:18:"browse_recommended";}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 2);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('', 0, 'bx_channels', '_bx_channels_page_block_title_sys_featured_entries_view_showcase', '_bx_channels_page_block_title_featured_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:15:\"browse_featured\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 1),
('', 0, 'bx_channels', '_bx_channels_page_block_title_sys_recommended_entries_view_showcase', '_bx_channels_page_block_title_recommended_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:18:\"browse_recommended\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, 'bx_channels', '_bx_channels_page_block_title_sys_active_entries', '_bx_channels_page_block_title_active_entries', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:13:\"browse_active\";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 3),
('', 0, 'bx_channels', '_bx_channels_page_block_title_sys_trending_entries', '_bx_channels_page_block_title_trending_entries', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:15:\"browse_trending\";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 4),
('', 0, 'bx_channels', '_bx_channels_page_block_title_sys_cover_block', '_bx_channels_page_block_title_cover_block', 3, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_channels\";s:6:\"method\";s:12:\"entity_cover\";}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 5);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 3;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_channels', '_bx_channels_page_trigger_block_title_entries_my', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_channels";s:6:"method";s:13:"browse_author";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:0;}}}', 0, 0, 0);


-- MENU

-- MENU: add to site menu

SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_channels', 'channels-home', '_bx_channels_menu_item_title_system_entries_home', '_bx_channels_menu_item_title_entries_home', 'page.php?i=channels-home', '', '', 'hashtag', 'bx_channels_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu

SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_channels', 'channels-home', '_bx_channels_menu_item_title_system_entries_home', '_bx_channels_menu_item_title_entries_home', 'page.php?i=channels-home', '', '', 'hashtag', 'bx_channels_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: view actions

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_view_actions', '_bx_channels_menu_title_view_profile_actions', 'bx_channels_view_actions', 'bx_channels', 9, 0, 1, 'BxCnlMenuViewActions', 'modules/boonex/channels/classes/BxCnlMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_channels_view_actions', 'bx_channels', '_bx_channels_menu_set_title_view_profile_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_channels_view_actions', 'bx_channels', 'profile-subscribe-add', '_bx_channels_menu_item_title_system_subscribe', '_bx_channels_menu_item_title_subscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'add\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, 1, 0, 1, 20),
('bx_channels_view_actions', 'bx_channels', 'profile-subscribe-remove', '_bx_channels_menu_item_title_system_unsubscribe', '_bx_channels_menu_item_title_unsubscribe', 'javascript:void(0)', 'bx_conn_action(this, \'sys_profiles_subscriptions\', \'remove\', \'{profile_id}\')', '', 'check', '', 0, 2147483647, 1, 0, 1, 21),
('bx_channels_view_actions', 'bx_channels', 'profile-actions-more', '_bx_channels_menu_item_title_system_more_actions', '_bx_channels_menu_item_title_more_actions', 'javascript:void(0)', 'bx_menu_popup(''bx_channels_view_actions_more'', this, {}, {profile_id:{profile_id}});', '', 'cog', 'bx_channels_view_actions_more', 1, 2147483647, 1, 0, 1, 9999);

-- MENU: view actions more

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_view_actions_more', '_bx_channels_menu_title_view_profile_actions_more', 'bx_channels_view_actions_more', 'bx_channels', 6, 0, 1, 'BxCnlMenuViewActions', 'modules/boonex/channels/classes/BxCnlMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_channels_view_actions_more', 'bx_channels', '_bx_channels_menu_set_title_view_profile_actions_more', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_channels_view_actions_more', 'bx_channels', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', 192, 1, 0, 20),
('bx_channels_view_actions_more', 'bx_channels', 'edit-channel-profile', '_bx_channels_menu_item_title_system_edit_profile', '_bx_channels_menu_item_title_edit_profile', 'page.php?i=edit-channel-profile&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 0, 0, 40),
('bx_channels_view_actions_more', 'bx_channels', 'delete-channel-profile', '_bx_channels_menu_item_title_system_delete_profile', '_bx_channels_menu_item_title_delete_profile', 'page.php?i=delete-channel-profile&id={content_id}', '', '', 'remove', '', 2147483647, 1, 0, 50);

-- MENU: all actions menu for view entry 

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `persistent`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_view_actions_all', '_sys_menu_title_view_actions', 'bx_channels_view_actions_all', 'bx_channels', 15, 1, 0, 1, 'BxCnlMenuViewActionsAll', 'modules/boonex/channels/classes/BxCnlMenuViewActionsAll.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_channels_view_actions_all', 'bx_channels', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_channels_view_actions_all', 'bx_channels', 'profile-subscriptions', '_bx_channels_menu_item_title_system_subscriptions', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 10),
('bx_channels_view_actions_all', 'bx_channels', 'profile-subscribe-add', '_bx_channels_menu_item_title_system_subscribe', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 12),
('bx_channels_view_actions_all', 'bx_channels', 'profile-subscribe-remove', '_bx_channels_menu_item_title_system_unsubscribe', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 14),
('bx_channels_view_actions_all', 'bx_channels', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 200),
('bx_channels_view_actions_all', 'bx_channels', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 210),
('bx_channels_view_actions_all', 'bx_channels', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 220),
('bx_channels_view_actions_all', 'bx_channels', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 225),
('bx_channels_view_actions_all', 'bx_channels', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 230),
('bx_channels_view_actions_all', 'bx_channels', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 240),
('bx_channels_view_actions_all', 'bx_channels', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 250),
('bx_channels_view_actions_all', 'bx_channels', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 260),
('bx_channels_view_actions_all', 'bx_channels', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, 1, 0, 300),
('bx_channels_view_actions_all', 'bx_channels', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, 1, 0, 9999);

-- MENU: meta (counters) menu for view entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_view_meta', '_bx_channels_menu_title_view_profile_meta', 'bx_channels_view_meta', 'bx_channels', 15, 0, 1, 'BxCnlMenuViewMeta', 'modules/boonex/channels/classes/BxCnlMenuViewMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_channels_view_meta', 'bx_channels', '_bx_channels_menu_set_title_view_profile_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_channels_view_meta', 'bx_channels', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_sys_menu_item_title_sm_subscribers', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_channels_view_meta', 'bx_channels', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_channels_view_meta', 'bx_channels', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_channels_view_meta', 'bx_channels', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 0, 2147483647, '', 0, 0, 43),
('bx_channels_view_meta', 'bx_channels', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 0, 2147483647, '', 0, 0, 46),
('bx_channels_view_meta', 'bx_channels', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 0, 2147483647, '', 1, 0, 50);

-- MENU: actions menu for my entries

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_my', '_bx_channels_menu_title_entries_my', 'bx_channels_my', 'bx_channels', 9, 0, 1, 'BxCnlMenu', 'modules/boonex/channels/classes/BxCnlMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_channels_my', 'bx_channels', '_bx_channels_menu_set_title_entries_my', 0);

-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_submenu', '_bx_channels_menu_title_submenu', '_bx_channels_menu_title_public_submenu', 'bx_channels_submenu', 'bx_channels', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_channels_submenu', 'bx_channels', '_bx_channels_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_channels_submenu', 'bx_channels', 'channels-home', '_bx_channels_menu_item_title_system_entries_recent', '_bx_channels_menu_item_title_entries_recent', 'page.php?i=channels-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_channels_submenu', 'bx_channels', 'channels-top', '_bx_channels_menu_item_title_system_entries_top', '_bx_channels_menu_item_title_entries_top', 'page.php?i=channels-top', '', '', '', '', 2147483647, 1, 1, 2),
('bx_channels_submenu', 'bx_channels', 'channels-toplevel', '_bx_channels_menu_item_title_system_entries_toplevel', '_bx_channels_menu_item_title_entries_toplevel', 'page.php?i=channels-toplevel', '', '', '', '', 2147483647, 1, 1, 3),
('bx_channels_submenu', 'bx_channels', 'channels-search', '_bx_channels_menu_item_title_system_entries_search', '_bx_channels_menu_item_title_entries_search', 'page.php?i=channels-search', '', '', '', '', 2147483647, 1, 1, 4),
('bx_channels_submenu', 'bx_channels', 'channels-administration', '_bx_channels_menu_item_title_system_entries_manage', '_bx_channels_menu_item_title_entries_manage', 'page.php?i=channels-administration', '', '', '', '', 192, 1, 1, 5);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_channels_snippet_meta', 'bx_channels', 15, 0, 1, 'BxCnlMenuSnippetMeta', 'modules/boonex/channels/classes/BxCnlMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_channels_snippet_meta', 'bx_channels', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('bx_channels_snippet_meta', 'bx_channels', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, 0, 0, 1, 1),
('bx_channels_snippet_meta', 'bx_channels', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, 0, 0, 1, 10),
('bx_channels_snippet_meta', 'bx_channels', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, 0, 0, 1, 15),
('bx_channels_snippet_meta', 'bx_channels', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 2147483647, 0, 0, 1, 16),
('bx_channels_snippet_meta', 'bx_channels', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 2147483647, 0, 0, 1, 17),
('bx_channels_snippet_meta', 'bx_channels', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 2147483647, 0, 0, 1, 18),
('bx_channels_snippet_meta', 'bx_channels', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, 0, 0, 1, 20),
('bx_channels_snippet_meta', 'bx_channels', 'members', '_sys_menu_item_title_system_sm_members', '_sys_menu_item_title_sm_members', '', '', '', '', '', 2147483647, 1, 0, 1, 30),
('bx_channels_snippet_meta', 'bx_channels', 'subscribers', '_sys_menu_item_title_system_sm_subscribers', '_sys_menu_item_title_sm_subscribers', '', '', '', '', '', 2147483647, 1, 0, 1, 40),
('bx_channels_snippet_meta', 'bx_channels', 'nl', '_sys_menu_item_title_system_sm_nl', '_sys_menu_item_title_sm_nl', '', '', '', '', '', 2147483647, 1, 0, 1, 45),
('bx_channels_snippet_meta', 'bx_channels', 'subscribe', '_sys_menu_item_title_system_sm_subscribe', '_sys_menu_item_title_sm_subscribe', '', '', '', '', '', 2147483647, 1, 0, 1, 50),
('bx_channels_snippet_meta', 'bx_channels', 'unsubscribe', '_sys_menu_item_title_system_sm_unsubscribe', '_sys_menu_item_title_sm_unsubscribe', '', '', '', '', '', 2147483647, 1, 0, 1, 60);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_channels_menu_manage_tools', '_bx_channels_menu_title_manage_tools', 'bx_channels_menu_manage_tools', 'bx_channels', 6, 0, 1, 'BxCnlMenuManageTools', 'modules/boonex/channels/classes/BxCnlMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_channels_menu_manage_tools', 'bx_channels', '_bx_channels_menu_set_title_manage_tools', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_channels_menu_manage_tools', 'bx_channels', 'delete', '_bx_channels_menu_item_title_system_delete', '_bx_channels_menu_item_title_delete', 'javascript:void(0)', 'javascript:{js_object}.onClickDelete({content_id});', '_self', 'far trash-alt', '', 2147483647, 1, 0, 1),
('bx_channels_menu_manage_tools', 'bx_channels', 'delete-with-content', '_bx_channels_menu_item_title_system_delete_with_content', '_bx_channels_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 2147483647, 0, 0, 2);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_channels', 'channels-administration', '_bx_channels_menu_item_title_system_admt_channels', '_bx_channels_menu_item_title_admt_channels', 'page.php?i=channels-administration', '', '_self', 'hashtag', 'a:2:{s:6:"module";s:11:"bx_channels";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 128, 1, 0, @iManageMenuOrder + 1);

-- MENU: profile followings
SET @iFollowingsMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_profile_followings' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `collapsed`, `active`, `copyable`, `order`) VALUES 
('sys_profile_followings', 'bx_channels', 'channels', '_bx_channels_menu_item_title_system_followings', '_bx_channels_menu_item_title_followings', 'javascript:void(0)', '', '_self', 'hashtag', '', '', 2147483647, 0, 1, 0, @iFollowingsMenuOrder + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_channels', 'channels-author', '_bx_channels_menu_item_title_system_view_entries_author', '_bx_channels_menu_item_title_view_entries_author', 'page.php?i=channels-author&profile_id={profile_id}', '', '', 'hashtag', '', 2147483647, 1, 0, 0);


-- ACL

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_channels', 'delete entry', NULL, '_bx_channels_acl_action_delete_profile', '', 1, 1);
SET @iIdActionProfileDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_channels', 'view entry', NULL, '_bx_channels_acl_action_view_profile', '', 1, 0);
SET @iIdActionProfileView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_channels', 'edit any entry', NULL, '_bx_channels_acl_action_edit_any_profile', '', 1, 3);
SET @iIdActionProfileEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_channels', 'delete any entry', NULL, '_bx_channels_acl_action_delete_any_profile', '', 1, 3);
SET @iIdActionProfileDeleteAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_channels', 'create channel auto', NULL, '_bx_channels_acl_action_create_channel_auto', '_bx_channels_acl_action_create_channel_auto_info', 1, 1);
SET @iIdActionCreateChannelAuto = LAST_INSERT_ID();

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

-- profile delete
(@iAdministrator, @iIdActionProfileDelete),

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

-- create channel auto
(@iAccount, @iIdActionCreateChannelAuto),
(@iStandard, @iIdActionCreateChannelAuto),
(@iUnconfirmed, @iIdActionCreateChannelAuto),
(@iPending, @iIdActionCreateChannelAuto),
(@iModerator, @iIdActionCreateChannelAuto),
(@iAdministrator, @iIdActionCreateChannelAuto),
(@iPremium, @iIdActionCreateChannelAuto);


-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('bx_channels', 'bx_channels', 'bx_cnl_meta_keywords', '', 'bx_cnl_meta_mentions', '', '');

-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_channels', '_bx_channels', @iSearchOrder + 1, 'BxCnlSearchResult', 'modules/boonex/channels/classes/BxCnlSearchResult.php');

-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_channels', 'bx_channels', '_bx_channels', 'page.php?i=channels-home', 'hashtag', 'SELECT COUNT(*) FROM `bx_cnl_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_channels'' WHERE 1 AND `tp`.`status`=''active''', @iMaxOrderStats + 1);

-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_channels_growth', '_bx_channels_chart_growth', 'bx_cnl_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_channels'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_channels_growth_speed', '_bx_channels_chart_growth_speed', 'bx_cnl_data', 'added', '', '', 'SELECT {field_date_formatted} AS `period`, COUNT(*) AS {object} FROM {table} LEFT JOIN `sys_profiles` AS `tp` ON {table}.`id` = `tp`.`content_id` AND `tp`.`type`=''bx_channels'' WHERE 1 AND `tp`.`status`=''active'' {where_inteval} GROUP BY `period` ORDER BY {table}.{field_date} ASC', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

-- GRIDS: administration

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_channels_administration', 'Sql', 'SELECT `td`.*, `td`.`channel_name` AS `name`, `ta`.`email` AS `account`, `td`.`added` AS `added_ts`, `tp`.`status` AS `status_profile` FROM `bx_cnl_data` AS `td` LEFT JOIN `sys_profiles` AS `tp` ON `td`.`id`=`tp`.`content_id` AND `tp`.`type`=''bx_channels'' LEFT JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` WHERE 1 ', 'bx_cnl_data', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'channel_name', '', 'like', 'reports', '', 192, 'BxCnlGridAdministration', 'modules/boonex/channels/classes/BxCnlGridAdministration.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_channels_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_channels_administration', 'switcher', '_bx_channels_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_channels_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_channels_administration', 'name', '_bx_channels_grid_column_title_adm_name', '45%', 0, '', '', 4),
('bx_channels_administration', 'added_ts', '_bx_channels_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_channels_administration', 'actions', '', '20%', 0, '', '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('bx_channels_administration', 'bulk', 'delete', '_bx_channels_grid_action_title_adm_delete', '', 0, 1, 1, 2),
('bx_channels_administration', 'bulk', 'delete_with_content', '_bx_channels_grid_action_title_adm_delete_with_content', '', 0, 1, 0, 3),
('bx_channels_administration', 'single', 'settings', '_bx_channels_grid_action_title_adm_more_actions', 'cog', 1, 0, 1, 2),
('bx_channels_administration', 'single', 'audit_content', '_bx_channels_grid_action_title_adm_audit_content', 'search', 1, 0, 1, 3),
('bx_channels_administration', 'single', 'audit_profile', '_bx_channels_grid_action_title_adm_audit_context', 'search-location', 1, 0, 1, 4);


-- ALERTS

INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_channels', 'BxCnlAlertsResponse', 'modules/boonex/channels/classes/BxCnlAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('bx_timeline', 'post_common', @iHandler),
('bx_channels_pics', 'file_deleted', @iHandler),
('profile', 'delete', @iHandler),
('bx_channels', 'timeline_view', @iHandler),
('bx_channels', 'timeline_post', @iHandler),
('bx_channels', 'timeline_delete', @iHandler),
('bx_channels', 'timeline_comment', @iHandler),
('bx_channels', 'timeline_vote', @iHandler),
('bx_channels', 'timeline_score', @iHandler),
('bx_channels', 'timeline_report', @iHandler),
('bx_channels', 'timeline_repost', @iHandler),
('bx_channels', 'timeline_pin', @iHandler),
('bx_channels', 'timeline_promote', @iHandler),
('bx_persons', 'added', @iHandler),
('bx_persons', 'edited', @iHandler),
('bx_organizations', 'added', @iHandler),
('bx_organizations', 'edited', @iHandler),
('meta_keyword', 'added', @iHandler),
('meta_keyword', 'url', @iHandler),
('meta_keyword', 'deleted', @iHandler);


-- PRIVACY 

INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `spaces`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_channels_allow_view_to', 'bx_channels', 'view', '_bx_channels_form_profile_input_allow_view_to', '3', '', 'bx_cnl_data', 'id', 'author', 'BxCnlPrivacy', 'modules/boonex/channels/classes/BxCnlPrivacy.php'),
('bx_channels_allow_view_notification_to', 'bx_channels', 'view_event', '_bx_channels_form_profile_input_allow_view_notification_to', '3', '', 'bx_notifications_events', 'id', 'object_owner_id', 'BxCnlPrivacyNotifications', 'modules/boonex/channels/classes/BxCnlPrivacyNotifications.php');


-- UPLOADERS

INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_channels_cover_crop', 1, 'BxCnlUploaderCoverCrop', 'modules/boonex/channels/classes/BxCnlUploaderCoverCrop.php'),
('bx_channels_picture_crop', 1, 'BxCnlUploaderPictureCrop', 'modules/boonex/channels/classes/BxCnlUploaderPictureCrop.php');

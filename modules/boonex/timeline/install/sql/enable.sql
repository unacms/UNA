
-- CONTENT PLACEHOLDERS
SET @iCPHOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_content_placeholders` ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_content_placeholders` (`module`, `title`, `template`, `order`) VALUES
('bx_timeline', '_bx_timeline_page_content_ph_timeline', 'block_async_timeline.html', @iCPHOrder + 1),
('bx_timeline', '_bx_timeline_page_content_ph_outline', 'block_async_outline.html', @iCPHOrder + 2);


-- PAGES & BLOCKS
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_view', '_bx_timeline_page_title_sys_view', '_bx_timeline_page_title_view', 'bx_timeline', 5, 2147483647, 1, 'timeline-view', 'page.php?i=timeline-view', '', '', '', 0, 1, 0, 'BxTimelinePageView', 'modules/boonex/timeline/classes/BxTimelinePageView.php'),
('bx_timeline_view_home', '_bx_timeline_page_title_sys_view_home', '_bx_timeline_page_title_view_home', 'bx_timeline', 5, 2147483647, 1, 'timeline-view-home', 'page.php?i=timeline-view-home', '', '', '', 0, 1, 0, '', ''),
('bx_timeline_view_hot', '_bx_timeline_page_title_sys_view_hot', '_bx_timeline_page_title_view_hot', 'bx_timeline', 5, 2147483647, 1, 'timeline-view-hot', 'page.php?i=timeline-view-hot', '', '', '', 0, 1, 0, '', ''),

('bx_timeline_item', '_bx_timeline_page_title_sys_item', '_bx_timeline_page_title_item', 'bx_timeline', 2, 2147483647, 1, 'item', '', '', '', '', 0, 1, 0, 'BxTimelinePageViewItem', 'modules/boonex/timeline/classes/BxTimelinePageViewItem.php'),
('bx_timeline_item_brief', '_bx_timeline_page_title_sys_item_brief', '_bx_timeline_page_title_item_brief', 'bx_timeline', 5, 2147483647, 1, 'item-quick', '', '', '', '', 0, 1, 0, 'BxTimelinePageViewItem', 'modules/boonex/timeline/classes/BxTimelinePageViewItem.php'),

('bx_timeline_manage', '_bx_timeline_page_title_sys_manage', '_bx_timeline_page_title_manage', 'bx_timeline', 5, 2147483647, 1, 'timeline-manage', 'page.php?i=timeline-manage', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_timeline_view', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_post_profile', '_bx_timeline_page_block_title_post_profile', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:14:"get_block_post";}', 0, 0, 1, 1),
('bx_timeline_view', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_view_profile', '_bx_timeline_page_block_title_view_profile', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:14:"get_block_view";}', 0, 0, 1, 2),
('bx_timeline_view', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_view_profile_outline', '_bx_timeline_page_block_title_view_profile_outline', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_view_outline";}', 0, 0, 0, 3),

('bx_timeline_view_home', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_post_home', '_bx_timeline_page_block_title_post_home', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:19:"get_block_post_home";}', 0, 0, 1, 1),
('bx_timeline_view_home', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_view_home', '_bx_timeline_page_block_title_view_home', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:19:"get_block_view_home";}', 0, 0, 0, 2),
('bx_timeline_view_home', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_view_home_outline', '_bx_timeline_page_block_title_view_home_outline', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:27:"get_block_view_home_outline";}', 0, 0, 1, 3),

('bx_timeline_view_hot', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_view_hot', '_bx_timeline_page_block_title_view_hot', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:18:"get_block_view_hot";}', 0, 1, 0, 1),
('bx_timeline_view_hot', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_view_hot_outline', '_bx_timeline_page_block_title_view_hot_outline', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:26:"get_block_view_hot_outline";}', 0, 1, 1, 2),

('bx_timeline_item', 1, 'bx_timeline', '', '_bx_timeline_page_block_title_item', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:14:"get_block_item";}', 0, 0, 1, 1),
('bx_timeline_item', 1, 'bx_timeline', '', '_bx_timeline_page_block_title_item_polls', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:12:"entity_polls";}', 0, 0, 1, 5),
('bx_timeline_item', 1, 'bx_timeline', '', '_bx_timeline_page_block_title_item_comments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:23:"get_block_item_comments";}', 0, 0, 1, 10),
('bx_timeline_item', 2, 'bx_timeline', '', '_bx_timeline_page_block_title_item_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:19:"get_block_item_info";}', 0, 0, 1, 1),
('bx_timeline_item', 1, 'bx_timeline', '', '_bx_timeline_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:14:"entity_reports";}', 0, 0, 1, 15),

('bx_timeline_item_brief', 1, 'bx_timeline', '', '_bx_timeline_page_block_title_item_content', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_item_content";}', 0, 0, 1, 1),
('bx_timeline_item_brief', 0, 'bx_timeline', '', '_bx_timeline_page_block_title_item_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:19:"get_block_item_info";}', 0, 0, 1, 1),
('bx_timeline_item_brief', 0, 'bx_timeline', '', '_bx_timeline_page_block_title_item_comments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:23:"get_block_item_comments";}', 0, 0, 1, 2),

('bx_timeline_manage', 1, 'bx_timeline', '', '_bx_timeline_page_block_title_manage_own', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:12:"manage_tools";}', 0, 0, 1, 1),
('bx_timeline_manage', 1, 'bx_timeline', '', '_bx_timeline_page_block_title_muted', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:15:"get_block_muted";}', 0, 0, 1, 2);


-- PAGES: add page block on dashboard
SET @iPBCellDashboard = 2;
SET @iPBOrderDashboard = 1; --(SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `cell_id` = @iPBCellDashboard LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_dashboard', @iPBCellDashboard, 'bx_timeline', '_bx_timeline_page_block_title_system_post_account', '_bx_timeline_page_block_title_post_account', 11, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_post_account";}', 0, 1, 0, @iPBOrderDashboard),
('sys_dashboard', @iPBCellDashboard, 'bx_timeline', '_bx_timeline_page_block_title_system_views_timeline', '_bx_timeline_page_block_title_views_timeline', 11, 1, 2147483644, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:24:"get_block_views_timeline";s:6:"params";a:1:{i:0;s:4:"feed";}}', 0, 0, 0, @iPBOrderDashboard + 1),
('sys_dashboard', @iPBCellDashboard, 'bx_timeline', '_bx_timeline_page_block_title_system_views_outline', '_bx_timeline_page_block_title_views_outline', 11, 1, 2147483644, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:23:"get_block_views_outline";s:6:"params";a:1:{i:0;s:4:"feed";}}', 0, 0, 0, @iPBOrderDashboard + 1);

-- PAGES: add page block on home
SET @iPBCellHome = 3;
SET @iPBOrderHome = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = @iPBCellHome ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', @iPBCellHome, 'bx_timeline', '_bx_timeline_page_block_title_system_post_home', '_bx_timeline_page_block_title_post_home', 11, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:19:"get_block_post_home";}', 0, 1, 0, @iPBOrderHome + 1),
('sys_home', @iPBCellHome, 'bx_timeline', '_bx_timeline_page_block_title_system_views_timeline', '_bx_timeline_page_block_title_views_timeline', 11, 1, 2147483644, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:24:"get_block_views_timeline";s:6:"params";a:1:{i:0;s:4:"feed";}}', 0, 0, 1, @iPBOrderHome + 2);

-- The public outline on the guests' home page comes inactive: a new site has no posts to show yet. Studio can turn it on.
SET @iPBCellHome = 5;
SET @iPBOrderHome = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = @iPBCellHome ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', @iPBCellHome, 'bx_timeline', '_bx_timeline_page_block_title_system_view_home_outline', '_bx_timeline_page_block_title_view_home_outline', 0, 1, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:27:"get_block_view_home_outline";}', 0, 0, 0, @iPBOrderHome + 1);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 2;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_timeline', '_bx_timeline_page_block_title_system_post_profile', '_bx_timeline_page_block_title_post_profile', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_post_profile";s:6:"params";a:1:{i:0;s:6:"{type}";}}', 0, 0, 1, 0),
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_timeline', '_bx_timeline_page_block_title_system_view_profile', '_bx_timeline_page_block_title_view_profile', 0, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_view_profile";s:6:"params";a:1:{i:0;s:6:"{type}";}}', 0, 0, 1, 0),
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_timeline', '_bx_timeline_page_block_title_system_view_profile_outline', '_bx_timeline_page_block_title_view_profile_outline', 0, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:30:"get_block_view_profile_outline";s:6:"params";a:1:{i:0;s:6:"{type}";}}', 0, 0, 0, 0);

SET @iPBCellGroup = 4;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('trigger_page_group_view_entry', @iPBCellGroup, 'bx_timeline', '_bx_timeline_page_block_title_system_post_profile', '_bx_timeline_page_block_title_post_profile', 11, 0, 0, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_post_profile";s:6:"params";a:1:{i:0;s:6:"{type}";}}', 0, 0, 0, 0),
('trigger_page_group_view_entry', @iPBCellGroup, 'system', '_sys_page_block_title_sys_create_post_context', '_sys_page_block_title_create_post_context', 11, 1, 4, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_create_post_form";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}s:5:"class";s:13:"TemplServices";}', 0, 0, 1, 0),
('trigger_page_group_view_entry', @iPBCellGroup, 'bx_timeline', '_bx_timeline_page_block_title_system_view_profile', '_bx_timeline_page_block_title_view_profile', 0, 0, 0, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_view_profile";s:6:"params";a:1:{i:0;s:6:"{type}";}}', 0, 0, 1, 0),
('trigger_page_group_view_entry', @iPBCellGroup, 'bx_timeline', '_bx_timeline_page_block_title_system_view_profile_outline', '_bx_timeline_page_block_title_view_profile_outline', 0, 0, 0, 2147483647, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:30:"get_block_view_profile_outline";s:6:"params";a:1:{i:0;s:6:"{type}";}}', 0, 0, 0, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_administration', '_bx_timeline_page_title_sys_manage_administration', '_bx_timeline_page_title_manage', 'bx_timeline', 5, 192, 1, 'timeline-administration', 'page.php?i=timeline-administration', '', '', '', 0, 1, 0, 'BxTimelinePageBrowse', 'modules/boonex/timeline/classes/BxTimelinePageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_timeline_administration', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_manage_administration', '_bx_timeline_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);


-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_views_timeline', '_bx_timeline_page_block_title_views_timeline', 11, 1, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:24:"get_block_views_timeline";}', 0, 1, 1, @iPBOrderHome + 1),
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_views_outline', '_bx_timeline_page_block_title_views_outline', 11, 1, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:23:"get_block_views_outline";}', 0, 1, 1, @iPBOrderHome + 2),

('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_home', '_bx_timeline_page_block_title_view_home', 0, 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:19:"get_block_view_home";}', 0, 1, 1, @iBlockOrder + 3),
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_home_outline', '_bx_timeline_page_block_title_view_home_outline', 0, 0, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:27:"get_block_view_home_outline";}', 0, 1, 1, @iBlockOrder + 4),

('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_account', '_bx_timeline_page_block_title_view_account', 0, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_view_account";}', 0, 1, 1, @iBlockOrder + 5),
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_account_outline', '_bx_timeline_page_block_title_view_account_outline', 0, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:30:"get_block_view_account_outline";}', 0, 1, 1, @iBlockOrder + 6),

('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_menu_db', '_bx_timeline_page_block_title_menu_db', 11, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:17:"get_block_menu_db";}', 0, 1, 1, @iBlockOrder + 7),
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_views_db', '_bx_timeline_page_block_title_views_db', 11, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:18:"get_block_views_db";}', 0, 1, 1, @iBlockOrder + 8),

('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_channels', '_bx_timeline_page_block_title_view_channels', 0, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:23:"get_block_view_channels";}', 0, 1, 1, @iBlockOrder + 9),
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_feed_and_hot', '_bx_timeline_page_block_title_view_feed_and_hot', 0, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:27:"get_block_view_feed_and_hot";}', 0, 1, 1, @iBlockOrder + 10),
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_contexts_groups', '_bx_timeline_page_block_title_view_contexts_groups', 0, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:23:"get_block_view_contexts";}', 0, 1, 1, @iBlockOrder + 11),

('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_media_files', '_bx_timeline_page_block_title_view_media_files', 0, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:26:"get_block_view_media_files";}', 0, 1, 1, @iBlockOrder + 12),
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_media_images', '_bx_timeline_page_block_title_view_media_images', 0, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:27:"get_block_view_media_images";}', 0, 1, 1, @iBlockOrder + 13),
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_media_videos', '_bx_timeline_page_block_title_view_media_videos', 0, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:27:"get_block_view_media_videos";}', 0, 1, 1, @iBlockOrder + 14),
('', 0, 'bx_timeline', '_bx_timeline_page_block_title_system_view_media_any', '_bx_timeline_page_block_title_view_media_any', 0, 0, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:20:"get_block_view_media";}', 0, 1, 1, @iBlockOrder + 15);


-- MENU: View
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_menu_view', '_bx_timeline_menu_title_view', 'bx_timeline_menu_view', 'bx_timeline', 15, 0, 1, 'BxTimelineMenuView', 'modules/boonex/timeline/classes/BxTimelineMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_timeline_menu_view', 'bx_timeline', '_bx_timeline_menu_set_title_view', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('bx_timeline_menu_view', 'bx_timeline', 'feed', '_bx_timeline_menu_item_title_system_feed', '_bx_timeline_menu_item_title_feed', 'javascript:void(0)', 'javascript:{js_object_view}.changeView(this, ''feed'')', '_self', '', '', 2147483647, 1, 0, 1),
('bx_timeline_menu_view', 'bx_timeline', 'public', '_bx_timeline_menu_item_title_system_public', '_bx_timeline_menu_item_title_public', 'javascript:void(0)', 'javascript:{js_object_view}.changeView(this, ''public'')', '_self', '', '', 2147483647, 1, 0, 2),
('bx_timeline_menu_view', 'bx_timeline', 'channels', '_bx_timeline_menu_item_title_system_channels', '_bx_timeline_menu_item_title_channels', 'javascript:void(0)', 'javascript:{js_object_view}.changeView(this, ''channels'')', '_self', '', '', 2147483647, 0, 0, 3),
('bx_timeline_menu_view', 'bx_timeline', 'hot', '_bx_timeline_menu_item_title_system_hot', '_bx_timeline_menu_item_title_hot', 'javascript:void(0)', 'javascript:{js_object_view}.changeView(this, ''hot'')', '_self', '', '', 2147483647, 1, 0, 4),
('bx_timeline_menu_view', 'bx_timeline', 'feed_and_hot', '_bx_timeline_menu_item_title_system_feed_and_hot', '_bx_timeline_menu_item_title_feed_and_hot', 'javascript:void(0)', 'javascript:{js_object_view}.changeView(this, ''feed_and_hot'')', '_self', '', '', 2147483647, 0, 0, 5);

-- MENU: Feeds
INSERT INTO `sys_menu_templates` (`id`, `template`, `title`, `visible`) VALUES
(ROUND(RAND()*(9999 - 1000) + 1000), 'menu_feeds.html', '_bx_timeline_menu_template_title_feeds', 1);
SET @iTemplId = (SELECT `id` FROM `sys_menu_templates` WHERE `template`='menu_feeds.html' AND `title`='_bx_timeline_menu_template_title_feeds' LIMIT 1);

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_menu_feeds', '_bx_timeline_menu_title_feeds', 'bx_timeline_menu_feeds', 'bx_timeline', @iTemplId, 0, 1, 'BxTimelineMenuFeeds', 'modules/boonex/timeline/classes/BxTimelineMenuFeeds.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_timeline_menu_feeds', 'bx_timeline', '_bx_timeline_menu_set_title_feeds', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('bx_timeline_menu_feeds', 'bx_timeline', 'feed', '_bx_timeline_menu_item_title_system_feed', '_bx_timeline_menu_item_title_feed', 'javascript:void(0)', 'javascript:{js_object_view}.changeFeed(this, ''feed'')', '_self', '', '', 2147483647, 1, 0, 1),
('bx_timeline_menu_feeds', 'bx_timeline', 'public', '_bx_timeline_menu_item_title_system_public', '_bx_timeline_menu_item_title_public', 'javascript:void(0)', 'javascript:{js_object_view}.changeFeed(this, ''public'')', '_self', '', '', 2147483647, 1, 0, 2),
('bx_timeline_menu_feeds', 'bx_timeline', 'hot', '_bx_timeline_menu_item_title_system_hot', '_bx_timeline_menu_item_title_hot', 'javascript:void(0)', 'javascript:{js_object_view}.changeFeed(this, ''hot'')', '_self', '', '', 2147483647, 1, 0, 3),
('bx_timeline_menu_feeds', 'bx_timeline', 'divider', '_bx_timeline_menu_item_title_system_divider', '', '', '', '', '', '', 2147483647, 1, 1, 4);

-- MENU: Item Share (Repost, Send to Friend, etc)
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_menu_item_share', '_bx_timeline_menu_title_item_share', 'bx_timeline_menu_item_share', 'bx_timeline', 6, 0, 1, 'BxTimelineMenuItemShare', 'modules/boonex/timeline/classes/BxTimelineMenuItemShare.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_timeline_menu_item_share', 'bx_timeline', '_bx_timeline_menu_set_title_item_share', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`) VALUES
('bx_timeline_menu_item_share', 'bx_timeline', 'item-repost', '_bx_timeline_menu_item_title_system_item_repost', '_bx_timeline_menu_item_title_item_repost', 'javascript:void(0)', 'javascript:{repost_onclick}', '_self', 'redo', '', 2147483647, 1, 1, 0, 1),
('bx_timeline_menu_item_share', 'bx_timeline', 'item-repost-with', '_bx_timeline_menu_item_title_system_item_repost_with', '_bx_timeline_menu_item_title_item_repost_with', 'javascript:void(0)', 'javascript:{repost_with_onclick}', '_self', 'redo', '', 2147483647, 1, 0, 0, 2),
('bx_timeline_menu_item_share', 'bx_timeline', 'item-repost-to', '_bx_timeline_menu_item_title_system_item_repost_to', '_bx_timeline_menu_item_title_item_repost_to', 'javascript:void(0)', 'javascript:{repost_to_onclick}', '_self', 'redo', '', 2147483647, 1, 0, 0, 3),
('bx_timeline_menu_item_share', 'bx_timeline', 'item-send', '_bx_timeline_menu_item_title_system_item_send', '_bx_timeline_menu_item_title_item_send', 'page.php?i=start-convo&et={et_send}', '', '_self', 'envelope', '', 2147483647, 1, 0, 0, 4),
('bx_timeline_menu_item_share', 'bx_timeline', 'item-copy', '_bx_timeline_menu_item_title_system_item_copy', '_bx_timeline_menu_item_title_item_copy', 'javascript:void(0)', 'javascript:{view_js_object}.copyToClipboard(this, ''{content_url}'')', '_self', 'copy', '', 2147483647, 1, 1, 0, 5);

-- MENU: Item Manage (Pin, Delete, etc)
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_menu_item_manage', '_bx_timeline_menu_title_item_manage', 'bx_timeline_menu_item_manage', 'bx_timeline', 20, 0, 1, 'BxTimelineMenuItemManage', 'modules/boonex/timeline/classes/BxTimelineMenuItemManage.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_timeline_menu_item_manage', 'bx_timeline', '_bx_timeline_menu_set_title_item_manage', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-pin', '_bx_timeline_menu_item_title_system_item_pin', '_bx_timeline_menu_item_title_item_pin', 'javascript:void(0)', 'javascript:{js_object_view}.pinPost(this, {content_id}, 1)', '_self', 'thumbtack', '', 2147483647, 1, 0, 0),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-unpin', '_bx_timeline_menu_item_title_system_item_unpin', '_bx_timeline_menu_item_title_item_unpin', 'javascript:void(0)', 'javascript:{js_object_view}.pinPost(this, {content_id}, 0)', '_self', 'thumbtack', '', 2147483647, 1, 0, 1),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-stick', '_bx_timeline_menu_item_title_system_item_stick', '_bx_timeline_menu_item_title_item_stick', 'javascript:void(0)', 'javascript:{js_object_view}.stickPost(this, {content_id}, 1)', '_self', 'thumbtack', '', 2147483647, 1, 0, 2),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-unstick', '_bx_timeline_menu_item_title_system_item_unstick', '_bx_timeline_menu_item_title_item_unstick', 'javascript:void(0)', 'javascript:{js_object_view}.stickPost(this, {content_id}, 0)', '_self', 'thumbtack', '', 2147483647, 1, 0, 3),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-promote', '_bx_timeline_menu_item_title_system_item_promote', '_bx_timeline_menu_item_title_item_promote', 'javascript:void(0)', 'javascript:{js_object_view}.promotePost(this, {content_id}, 1)', '_self', 'certificate ', '', 2147483647, 1, 0, 4),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-unpromote', '_bx_timeline_menu_item_title_system_item_unpromote', '_bx_timeline_menu_item_title_item_unpromote', 'javascript:void(0)', 'javascript:{js_object_view}.promotePost(this, {content_id}, 0)', '_self', 'certificate', '', 2147483647, 1, 0, 5),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-report', '_bx_timeline_menu_item_title_system_item_report', '', 'javascript:void(0)', '', '', '', '', 2147483647, 1, 0, 6),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '_self', 'exclamation-triangle', '', 2147483647, 1, 0, 7),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-mute', '_bx_timeline_menu_item_title_system_item_mute', '_bx_timeline_menu_item_title_item_mute', 'javascript:void(0)', 'javascript:{js_object_view}.muteAuthor(this, {content_id})', '_self', 'user-slash', '', 2147483647, 1, 0, 8),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-edit', '_bx_timeline_menu_item_title_system_item_edit', '_bx_timeline_menu_item_title_item_edit', 'javascript:void(0)', 'javascript:{js_object_view}.editPost(this, {content_id})', '_self', 'pencil-alt', '', 2147483647, 1, 0, 9),
('bx_timeline_menu_item_manage', 'bx_timeline', 'item-delete', '_bx_timeline_menu_item_title_system_item_delete', '_bx_timeline_menu_item_title_item_delete', 'javascript:void(0)', 'javascript:{js_object_view}.deletePost(this, {content_id})', '_self', 'remove', '', 2147483647, 1, 0, 10);

-- MENU: Item Actions (Comment, Vote, Share, Report, etc)
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_menu_item_actions', '_bx_timeline_menu_title_item_actions', 'bx_timeline_menu_item_actions', 'bx_timeline', 15, 0, 1, 'BxTimelineMenuItemActions', 'modules/boonex/timeline/classes/BxTimelineMenuItemActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_timeline_menu_item_actions', 'bx_timeline', '_bx_timeline_menu_set_title_item_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('bx_timeline_menu_item_actions', 'bx_timeline', 'item-view', '_bx_timeline_menu_item_title_system_item_view', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 0),
('bx_timeline_menu_item_actions', 'bx_timeline', 'item-comment', '_bx_timeline_menu_item_title_system_item_comment', '_bx_timeline_menu_item_title_item_comment', 'javascript:void(0)', 'javascript:{comment_onclick}', '_self', 'comment', '', '', 0, 2147483647, 1, 0, 1, 10),
('bx_timeline_menu_item_actions', 'bx_timeline', 'item-vote', '_bx_timeline_menu_item_title_system_item_vote', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 20),
('bx_timeline_menu_item_actions', 'bx_timeline', 'item-reaction', '_bx_timeline_menu_item_title_system_item_reaction', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 30),
('bx_timeline_menu_item_actions', 'bx_timeline', 'item-score', '_bx_timeline_menu_item_title_system_item_score', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 40),
('bx_timeline_menu_item_actions', 'bx_timeline', 'item-share', '_bx_timeline_menu_item_title_system_item_share', '_bx_timeline_menu_item_title_item_share', 'javascript:void(0)', 'bx_menu_popup(''bx_timeline_menu_item_share'', this, {''id'':''bx_timeline_menu_item_share_{content_id}''}, {content_id:{content_id}, name:''{name}'', view:''{view}'', type:''{type}''});', '', 'share-alt', '', 'bx_timeline_menu_item_share', 1, 2147483647, 1, 0, 1, 50),
('bx_timeline_menu_item_actions', 'bx_timeline', 'item-repost', '_bx_timeline_menu_item_title_system_item_repost', '_bx_timeline_menu_item_title_item_repost', 'javascript:void(0)', 'javascript:{repost_onclick}', '', 'redo', '', '', 0, 2147483647, 0, 0, 1, 55),
('bx_timeline_menu_item_actions', 'bx_timeline', 'item-report', '_bx_timeline_menu_item_title_system_item_report', '', 'javascript:void(0)', '', '', '', '', '', 1, 2147483647, 0, 0, 1, 57),
('bx_timeline_menu_item_actions', 'bx_timeline', 'item-more', '_bx_timeline_menu_item_title_system_item_more', '_bx_timeline_menu_item_title_item_more', 'javascript:void(0)', 'bx_menu_popup(''bx_timeline_menu_item_manage'', this, {''id'':''bx_timeline_menu_item_manage_{content_id}''}, {content_id:{content_id}, name:''{name}'', view:''{view}'', type:''{type}''});', '', 'ellipsis-v', '', 'bx_timeline_menu_item_manage', 1, 2147483647, 0, 0, 1, 60);

-- MENU: all actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `persistent`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_menu_item_actions_all', '_bx_timeline_menu_title_item_actions_all', 'bx_timeline_menu_item_actions_all', 'bx_timeline', 15, 1, 0, 0, 'BxTimelineMenuItemActionsAll', 'modules/boonex/timeline/classes/BxTimelineMenuItemActionsAll.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_timeline_menu_item_actions_all', 'bx_timeline', '_bx_timeline_menu_set_title_item_actions_all', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-view', '_bx_timeline_menu_item_title_system_item_view', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 0),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-comment', '_bx_timeline_menu_item_title_system_item_comment', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 10),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-vote', '_bx_timeline_menu_item_title_system_item_vote', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 20),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-reaction', '_bx_timeline_menu_item_title_system_item_reaction', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 30),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-score', '_bx_timeline_menu_item_title_system_item_score', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 40),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-share', '_bx_timeline_menu_item_title_system_item_share', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 50),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-repost', '_bx_timeline_menu_item_title_system_item_repost', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 55),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-pin', '_bx_timeline_menu_item_title_system_item_pin', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 100),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-unpin', '_bx_timeline_menu_item_title_system_item_unpin', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 110),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-stick', '_bx_timeline_menu_item_title_system_item_stick', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 120),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-unstick', '_bx_timeline_menu_item_title_system_item_unstick', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 130),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-promote', '_bx_timeline_menu_item_title_system_item_promote', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 140),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-unpromote', '_bx_timeline_menu_item_title_system_item_unpromote', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 150),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-report', '_bx_timeline_menu_item_title_system_item_report', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 160),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-mute', '_bx_timeline_menu_item_title_system_item_mute', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 165),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-edit', '_bx_timeline_menu_item_title_system_item_edit', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 170),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'item-delete', '_bx_timeline_menu_item_title_system_item_delete', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 180),
('bx_timeline_menu_item_actions_all', 'bx_timeline', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, 1, 0, 1, 9999);

-- MENU: Item Counters (Comments, Votes, Reactions, etc)
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_menu_item_counters', '_bx_timeline_menu_title_item_counters', 'bx_timeline_menu_item_counters', 'bx_timeline', 15, 0, 1, 'BxTimelineMenuItemCounters', 'modules/boonex/timeline/classes/BxTimelineMenuItemCounters.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_timeline_menu_item_counters', 'bx_timeline', '_bx_timeline_menu_set_title_item_counters', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('bx_timeline_menu_item_counters', 'bx_timeline', 'item-view', '_bx_timeline_menu_item_title_system_item_view', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 0),
('bx_timeline_menu_item_counters', 'bx_timeline', 'item-vote', '_bx_timeline_menu_item_title_system_item_vote', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 10),
('bx_timeline_menu_item_counters', 'bx_timeline', 'item-reaction', '_bx_timeline_menu_item_title_system_item_reaction', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 20),
('bx_timeline_menu_item_counters', 'bx_timeline', 'item-score', '_bx_timeline_menu_item_title_system_item_score', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 30),
('bx_timeline_menu_item_counters', 'bx_timeline', 'item-comment', '_bx_timeline_menu_item_title_system_item_comment', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 40),
('bx_timeline_menu_item_counters', 'bx_timeline', 'item-repost', '_bx_timeline_menu_item_title_system_item_repost', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 50);

-- MENU: Item Meta Info
INSERT INTO `sys_objects_menu` (`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_timeline_menu_item_meta', '_sys_menu_title_snippet_meta', 'bx_timeline_menu_item_meta', 'bx_timeline', 15, 0, 1, 'BxTimelineMenuSnippetMeta', 'modules/boonex/timeline/classes/BxTimelineMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets` (`set_name`, `module`, `title`, `deletable`) VALUES
('bx_timeline_menu_item_meta', 'bx_timeline', '_sys_menu_set_title_snippet_meta', 0);

-- comment meta info menu
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_timeline_menu_item_meta', 'bx_timeline', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 1),
('bx_timeline_menu_item_meta', 'bx_timeline', 'membership', '_sys_menu_item_title_system_sm_membership', '_sys_menu_item_title_sm_membership', '', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 2);

-- MENU: Post form attachments (Link, Photo, Video)
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_timeline_menu_post_attachments', '_bx_timeline_menu_title_post_attachments', 'bx_timeline_menu_post_attachments', 'bx_timeline', 23, 0, 1, 'BxTimelineMenuPostAttachments', 'modules/boonex/timeline/classes/BxTimelineMenuPostAttachments.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_timeline_menu_post_attachments', 'bx_timeline', '_bx_timeline_menu_set_title_post_attachments', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_timeline_menu_post_attachments', 'bx_timeline', 'add-link', '_bx_timeline_menu_item_title_system_add_link', '_bx_timeline_menu_item_title_add_link', 'javascript:void(0)', 'javascript:{js_object}.showAttachLink(this, {content_id});', '_self', 'link', '', '', 2147483647, 1, 0, 1, 1),
('bx_timeline_menu_post_attachments', 'bx_timeline', 'add-photo-simple', '_bx_timeline_menu_item_title_system_add_photo_simple', '_bx_timeline_menu_item_title_add_photo', 'javascript:void(0)', 'javascript:{js_object_add_photo_simple}.showUploaderForm();', '_self', 'camera', '', '', 2147483647, 0, 0, 1, 2),
('bx_timeline_menu_post_attachments', 'bx_timeline', 'add-photo-html5', '_bx_timeline_menu_item_title_system_add_photo_html5', '_bx_timeline_menu_item_title_add_photo', 'javascript:void(0)', 'javascript:{js_object_add_photo_html5}.showUploaderForm();', '_self', 'camera', '', '', 2147483647, 1, 0, 1, 3),
('bx_timeline_menu_post_attachments', 'bx_timeline', 'add-video-simple', '_bx_timeline_menu_item_title_system_add_video_simple', '_bx_timeline_menu_item_title_add_video', 'javascript:void(0)', 'javascript:{js_object_add_video_simple}.showUploaderForm();', '_self', 'video', '', '', 2147483647, 0, 0, 1, 4),
('bx_timeline_menu_post_attachments', 'bx_timeline', 'add-video-html5', '_bx_timeline_menu_item_title_system_add_video_html5', '_bx_timeline_menu_item_title_add_video', 'javascript:void(0)', 'javascript:{js_object_add_video_html5}.showUploaderForm();', '_self', 'video', '', '', 2147483647, 1, 0, 1, 5),
('bx_timeline_menu_post_attachments', 'bx_timeline', 'add-video-record', '_bx_timeline_menu_item_title_system_add_video_record', '_bx_timeline_menu_item_title_add_video_record', 'javascript:void(0)', 'javascript:{js_object_add_video_record}.showUploaderForm();', '_self', 'fas circle', '', '', 2147483647, 1, 0, 1, 6),
('bx_timeline_menu_post_attachments', 'bx_timeline', 'add-file-simple', '_bx_timeline_menu_item_title_system_add_file_simple', '_bx_timeline_menu_item_title_add_file', 'javascript:void(0)', 'javascript:{js_object_add_file_simple}.showUploaderForm();', '_self', 'file', '', '', 2147483647, 0, 0, 1, 7),
('bx_timeline_menu_post_attachments', 'bx_timeline', 'add-file-html5', '_bx_timeline_menu_item_title_system_add_file_html5', '_bx_timeline_menu_item_title_add_file', 'javascript:void(0)', 'javascript:{js_object_add_file_html5}.showUploaderForm();', '_self', 'file', '', '', 2147483647, 1, 0, 1, 8),
('bx_timeline_menu_post_attachments', 'bx_timeline', 'add-poll', '_bx_timeline_menu_item_title_system_add_poll', '_bx_timeline_menu_item_title_add_poll', 'javascript:void(0)', 'javascript:{js_object_poll}.showPollForm(this);', '_self', 'tasks', '', '', 2147483647, 1, 0, 1, 9);

-- MENU: add to "add content" menu
SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_timeline', 'create-item', '_bx_timeline_menu_item_title_system_create_entry', '_bx_timeline_menu_item_title_create_entry', 'page.php?i=timeline-view', '', '', 'far clock', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: add to "add content" menu
SET @iCreatePostOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_create_post' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_create_post', 'bx_timeline', 'create-item', '_bx_timeline_menu_item_title_system_create_entry', '_bx_timeline_menu_item_title_create_entry', 'page.php?i=timeline-view', '', '', 'far clock', '', 2147483647, 1, 0, IFNULL(@iCreatePostOrder, 0) + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_timeline', 'timeline-view', '_bx_timeline_menu_item_title_system_view_timeline_view', '_bx_timeline_menu_item_title_view_timeline_view', 'page.php?i=timeline-view&profile_id={profile_id}', '', '', 'far clock', '', 2147483647, 1, 0, 0),
('trigger_group_view_submenu', 'bx_timeline', 'timeline-view', '_bx_timeline_menu_item_title_system_view_timeline_view', '_bx_timeline_menu_item_title_view_timeline_view', 'page.php?i=timeline-view&profile_id={profile_id}', '', '', 'far clock', '', 2147483647, 1, 0, 0);

-- MENU: profile stats
SET @iPStatsMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_timeline', 'profile-stats-my-timeline', '_bx_timeline_menu_item_title_system_manage_my_timeline', '_bx_timeline_menu_item_title_manage_my_timeline', 'page.php?i=timeline-manage', '', '_self', 'far clock', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:28:"get_menu_addon_profile_stats";}', '', 2147483646, 1, 0, @iPStatsMenuOrder + 2);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_timeline', 'timeline-administration', '_bx_timeline_menu_item_title_system_admt_timeline', '_bx_timeline_menu_item_title_admt_timeline', 'page.php?i=timeline-administration', '', '_self', 'clock', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_timeline', '_bx_timeline', 'bx_timeline@modules/boonex/timeline/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

-- Category: General
INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_timeline_general', '_bx_timeline_options_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

-- Events hidden by default:
SET @iHdrIdComment = (SELECT `id` FROM `bx_timeline_handlers` WHERE `group`='comment' AND `type`='insert' AND `alert_unit`='comment' AND `alert_action`='added' LIMIT 1);

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_timeline_enable_auto_approve', 'on', @iCategId, '_bx_timeline_option_enable_auto_approve', 'checkbox', '', '', '', '', 0),
('bx_timeline_enable_edit', 'on', @iCategId, '_bx_timeline_option_enable_edit', 'checkbox', '', '', '', '', 1),
('bx_timeline_enable_delete', 'on', @iCategId, '_bx_timeline_option_enable_delete', 'checkbox', '', '', '', '', 2),
('bx_timeline_enable_count_all_views', '', @iCategId, '_bx_timeline_option_enable_count_all_views', 'checkbox', '', '', '', '', 3),
('bx_timeline_enable_content_own_actions', '', @iCategId, '_bx_timeline_option_enable_content_own_actions', 'checkbox', '', '', '', '', 4),
('bx_timeline_enable_repost_own_actions', 'on', @iCategId, '_bx_timeline_option_enable_repost_own_actions', 'checkbox', '', '', '', '', 5),
('bx_timeline_enable_hide_upon_delete', '', @iCategId, '_bx_timeline_option_enable_hide_upon_delete', 'checkbox', '', '', '', '', 6),
('bx_timeline_events_hide', CONCAT_WS(',', @iHdrIdComment), @iCategId, '_bx_timeline_option_events_hide', 'rlist', '', '', '', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:21:"get_actions_checklist";}', 7),
('bx_timeline_searchable_fields', 'title,description', @iCategId, '_bx_timeline_option_searchable_fields', 'list', '', '', '', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:21:"get_searchable_fields";}', 8);

-- Category: Browse
INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_timeline_browse', '_bx_timeline_options_category_browse', 2);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_timeline_enable_show_all', 'on', @iCategId, '_bx_timeline_option_enable_show_all', 'checkbox', '', '', '', '', 1),
('bx_timeline_enable_jump_to_switcher', '', @iCategId, '_bx_timeline_option_enable_jump_to_switcher', 'checkbox', '', '', '', '', 2),
('bx_timeline_enable_sort_by_reaction', '', @iCategId, '_bx_timeline_option_enable_sort_by_reaction', 'checkbox', '', '', '', '', 3),
('bx_timeline_enable_sort_by_unread', '', @iCategId, '_bx_timeline_option_enable_sort_by_unread', 'checkbox', '', '', '', '', 4),

('bx_timeline_events_per_page_profile', '12', @iCategId, '_bx_timeline_option_events_per_page_profile', 'digit', '', '', '', '', 10),
('bx_timeline_events_per_page_account', '12', @iCategId, '_bx_timeline_option_events_per_page_account', 'digit', '', '', '', '', 11),
('bx_timeline_events_per_page_home', '24', @iCategId, '_bx_timeline_option_events_per_page_home', 'digit', '', '', '', '', 12),
('bx_timeline_events_per_page', '24', @iCategId, '_bx_timeline_option_events_per_page', 'digit', '', '', '', '', 13),
('bx_timeline_rss_length', '5', @iCategId, '_bx_timeline_option_rss_length', 'digit', '', '', '', '', 14),
('bx_timeline_live_updates_length', '0', @iCategId, '_bx_timeline_option_live_updates_length', 'digit', '', '', '', '', 15),

('bx_timeline_enable_infinite_scroll', '', @iCategId, '_bx_timeline_option_enable_infinite_scroll', 'checkbox', '', '', '', '', 20),
('bx_timeline_events_per_preload', '5', @iCategId, '_bx_timeline_option_events_per_preload', 'digit', '', '', '', '', 21),
('bx_timeline_auto_preloads', '10', @iCategId, '_bx_timeline_option_auto_preloads', 'digit', '', '', '', '', 22),

('bx_timeline_extenals_every_public', '0', @iCategId, '_bx_timeline_option_extenals_every_public', 'digit', '', '', '', '', 40),
('bx_timeline_extenals_every_owner', '0', @iCategId, '_bx_timeline_option_extenals_every_owner', 'digit', '', '', '', '', 41),
('bx_timeline_extenals_every_feed', '0', @iCategId, '_bx_timeline_option_extenals_every_feed', 'digit', '', '', '', '', 42),
('bx_timeline_extenals_every_hot', '0', @iCategId, '_bx_timeline_option_extenals_every_hot', 'digit', '', '', '', '', 43),
('bx_timeline_extenals_every_feed_and_hot', '0', @iCategId, '_bx_timeline_option_extenals_every_feed_and_hot', 'digit', '', '', '', '', 44),
('bx_timeline_extenals_every_public_preload', '0', @iCategId, '_bx_timeline_option_extenals_every_public_preload', 'digit', '', '', '', '', 45),
('bx_timeline_extenals_every_owner_preload', '0', @iCategId, '_bx_timeline_option_extenals_every_owner_preload', 'digit', '', '', '', '', 46),
('bx_timeline_extenals_every_feed_preload', '0', @iCategId, '_bx_timeline_option_extenals_every_feed_preload', 'digit', '', '', '', '', 47),
('bx_timeline_extenals_every_hot_preload', '0', @iCategId, '_bx_timeline_option_extenals_every_hot_preload', 'digit', '', '', '', '', 48),
('bx_timeline_extenals_every_feed_and_hot_preload', '0', @iCategId, '_bx_timeline_option_extenals_every_feed_and_hot_preload', 'digit', '', '', '', '', 49),

('bx_timeline_filters_style', 'default', @iCategId, '_bx_timeline_option_filters_style', 'select', '', '', '', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:25:"get_options_filters_style";}', 70),
('bx_timeline_filters_contexts_hide', '', @iCategId, '_bx_timeline_option_filters_contexts_hide', 'rlist', '', '', '', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:28:"get_options_filters_contexts";}', 75),
('bx_timeline_filters_media_hide', '', @iCategId, '_bx_timeline_option_filters_media_hide', 'rlist', '', '', '', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:25:"get_options_filters_media";}', 77);


-- Category: Card
INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_timeline_card', '_bx_timeline_options_category_card', 3);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_timeline_enable_brief_cards', '', @iCategId, '_bx_timeline_option_enable_brief_cards', 'checkbox', '', '', '', '', 2),
('bx_timeline_title_chars', '64', @iCategId, '_bx_timeline_option_title_chars', 'digit', '', '', '', '', 5),
('bx_timeline_title_chars_short', '32', @iCategId, '_bx_timeline_option_title_chars_short', 'digit', '', '', '', '', 6),
('bx_timeline_videos_preload', 'auto', @iCategId, '_bx_timeline_option_videos_preload', 'select', '', '', '', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:26:"get_options_videos_preload";}', 10),
('bx_timeline_videos_autoplay', 'off', @iCategId, '_bx_timeline_option_videos_autoplay', 'select', '', '', '', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:27:"get_options_videos_autoplay";}', 11),
('bx_timeline_preload_comments', '0', @iCategId, '_bx_timeline_option_preload_comments', 'digit', '', '', '', '', 20),
('bx_timeline_attachments_layout', 'gallery', @iCategId, '_bx_timeline_option_attachments_layout', 'select', '', '', '', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:30:"get_options_attachments_layout";}', 30);

-- Category: Cache
INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_timeline_cache', '_bx_timeline_options_category_cache', 4);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_timeline_enable_cache_item', 'on', @iCategId, '_bx_timeline_option_enable_cache_item', 'checkbox', '', '', '', '', 1),
('bx_timeline_cache_item_engine', 'File', @iCategId, '_bx_timeline_option_cache_item_engine', 'select', '', '', '', 'FileHtml,Memcache,Memcached,APC,XCache,Redis', 2),
('bx_timeline_cache_item_lifetime', '604800', @iCategId, '_bx_timeline_option_cache_item_lifetime', 'digit', '', '', '', '', 3),
('bx_timeline_enable_cache_table', '', @iCategId, '_bx_timeline_option_enable_cache_table', 'checkbox', '', '', '', '', 10),
('bx_timeline_cache_table_interval', '90', @iCategId, '_bx_timeline_option_cache_table_interval', 'digit', '', '', '', '', 11);

-- Category: Post form
INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_timeline_post', '_bx_timeline_options_category_post', 5);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_timeline_enable_editor_toolbar', '', @iCategId, '_bx_timeline_option_enable_editor_toolbar', 'checkbox', '', '', '', '', 1),
('bx_timeline_editor_auto_attach_insertion', '', @iCategId, '_bx_timeline_option_editor_auto_attach_insertion', 'checkbox', '', '', '', '', 2),
('bx_timeline_enable_media_priority', '', @iCategId, '_bx_timeline_option_enable_media_priority', 'checkbox', '', '', '', '', 3),
('bx_timeline_limit_attach_links', '0', @iCategId, '_bx_timeline_option_limit_attach_links', 'digit', '', '', '', '', 10);

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_timeline_feed_hot', '_bx_timeline_options_category_feed_hot', 6);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_timeline_enable_hot', 'on', @iCategId, '_bx_timeline_option_enable_hot', 'checkbox', '', '', '', '', 1),
('bx_timeline_hot_sources', 'content,comment,vote', @iCategId, '_bx_timeline_option_hot_sources', 'list', '', '', '', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:25:"get_hot_sources_checklist";}', 10),
('bx_timeline_hot_threshold_age', '0', @iCategId, '_bx_timeline_option_hot_threshold_age', 'digit', '', '', '', '', 11),
('bx_timeline_hot_threshold_comment', '1', @iCategId, '_bx_timeline_option_hot_threshold_comment', 'digit', '', '', '', '', 12),
('bx_timeline_hot_threshold_vote', '2', @iCategId, '_bx_timeline_option_hot_threshold_vote', 'digit', '', '', '', '', 13),
('bx_timeline_hot_interval', '48', @iCategId, '_bx_timeline_option_hot_interval', 'digit', '', '', '', '', 20),
('bx_timeline_hot_content_age_mux', '0', @iCategId, '_bx_timeline_option_hot_content_age_mux', 'digit', '', '', '', '', 30);

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_timeline_feed_for_you', '_bx_timeline_options_category_feed_for_you', 7);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_timeline_for_you_sources', 'public,feed,channels,hot,recom_friends,recom_subscriptions', @iCategId, '_bx_timeline_option_for_you_sources', 'list', 'Avail', '', '_bx_timeline_option_for_you_sources_err', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:29:"get_for_you_sources_checklist";}', 1),
('bx_timeline_for_you_threshold_recom_friends', '1', @iCategId, '_bx_timeline_option_for_you_threshold_recom_friends', 'digit', '', '', '', '', 10),
('bx_timeline_for_you_threshold_recom_subscriptions', '1', @iCategId, '_bx_timeline_option_for_you_threshold_recom_subscriptions', 'digit', '', '', '', '', 11);


-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_timeline_privacy_view', 'bx_timeline', 'view', '_bx_timeline_privacy_view', '3', 'bx_timeline_events', 'id', 'owner_id', 'BxTimelinePrivacy', 'modules/boonex/timeline/classes/BxTimelinePrivacy.php');


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'post', NULL, '_bx_timeline_acl_action_post', '', 1, 3);
SET @iIdActionPost = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'edit', NULL, '_bx_timeline_acl_action_edit', '', 1, 3);
SET @iIdActionEdit = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'delete', NULL, '_bx_timeline_acl_action_delete', '', 1, 3);
SET @iIdActionDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'vote', NULL, '_bx_timeline_acl_action_vote', '', 1, 0);
SET @iIdActionVote = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'repost', NULL, '_bx_timeline_acl_action_repost', '', 1, 3);
SET @iIdActionRepost = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'send', NULL, '_bx_timeline_acl_action_send', '', 1, 3);
SET @iIdActionSend = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'mute', NULL, '_bx_timeline_acl_action_mute', '', 1, 3);
SET @iIdActionMute = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'pin', NULL, '_bx_timeline_acl_action_pin', '', 1, 3);
SET @iIdActionPin = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'stick', NULL, '_bx_timeline_acl_action_stick', '', 1, 3);
SET @iIdActionStick = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_timeline', 'promote', NULL, '_bx_timeline_acl_action_promote', '', 1, 3);
SET @iIdActionPromote = LAST_INSERT_ID();

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

-- post
(@iStandard, @iIdActionPost),
(@iModerator, @iIdActionPost),
(@iAdministrator, @iIdActionPost),
(@iPremium, @iIdActionPost),

-- edit any post
(@iModerator, @iIdActionEdit),
(@iAdministrator, @iIdActionEdit),

-- delete any post
(@iModerator, @iIdActionDelete),
(@iAdministrator, @iIdActionDelete),

-- vote
(@iStandard, @iIdActionVote),
(@iModerator, @iIdActionVote),
(@iAdministrator, @iIdActionVote),
(@iPremium, @iIdActionVote),

-- repost
(@iStandard, @iIdActionRepost),
(@iModerator, @iIdActionRepost),
(@iAdministrator, @iIdActionRepost),
(@iPremium, @iIdActionRepost),

-- send
(@iStandard, @iIdActionSend),
(@iModerator, @iIdActionSend),
(@iAdministrator, @iIdActionSend),
(@iPremium, @iIdActionSend),

-- mute
(@iStandard, @iIdActionMute),
(@iModerator, @iIdActionMute),
(@iAdministrator, @iIdActionMute),
(@iPremium, @iIdActionMute),

-- pin any post
(@iModerator, @iIdActionPin),
(@iAdministrator, @iIdActionPin),

-- stick any post
(@iModerator, @iIdActionStick),
(@iAdministrator, @iIdActionStick),

-- promote any post
(@iModerator, @iIdActionPromote),
(@iAdministrator, @iIdActionPromote);


-- ALERTS
INSERT INTO `sys_alerts_handlers`(`name`, `class`, `file`, `service_call`) VALUES 
('bx_timeline', 'BxTimelineResponse', 'modules/boonex/timeline/classes/BxTimelineResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'clear_cache', @iHandler),
('system', 'enable', @iHandler),
('system', 'disable', @iHandler),
('system', 'save_setting', @iHandler),

('account', 'confirm', @iHandler),
('account', 'unconfirm', @iHandler),

('profile', 'approve', @iHandler),
('profile', 'disapprove', @iHandler),
('profile', 'activate', @iHandler),
('profile', 'suspend', @iHandler),
('profile', 'delete', @iHandler),

('comment', 'added', @iHandler),
('comment', 'edited', @iHandler),
('comment', 'deleted', @iHandler),

('bx_timeline_videos_mp4', 'transcoded', @iHandler);


-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_timeline', '_bx_timeline', @iSearchOrder + 1, 'BxTimelineSearchResult', 'modules/boonex/timeline/classes/BxTimelineSearchResult.php'),
('bx_timeline_cmts', '_bx_timeline_cmts', @iSearchOrder + 2, 'BxTimelineCmtsSearchResult', 'modules/boonex/timeline/classes/BxTimelineCmtsSearchResult.php');


-- GRIDS: connection mute
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('bx_timeline_mute', 'Sql', 'SELECT `p`.`id`, `c`.`added`, `c`.`mutual` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxTimelineGridMute', 'modules/boonex/timeline/classes/BxTimelineGridMute.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `hidden_on`, `order`) VALUES
('bx_timeline_mute', 'name', '_sys_name', '60%', '', '', 1),
('bx_timeline_mute', 'info', '', '20%', '', '1', 2),
('bx_timeline_mute', 'actions', '', '20%', '', '', 3);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_timeline_mute', 'single', 'delete', '', 'remove', 0, 1, 2);

-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_timeline_administration', 'Sql', 'SELECT * FROM `bx_timeline_events` WHERE 1 AND `active`=''1'' ', 'bx_timeline_events', 'id', 'date', 'status_admin', '', 20, NULL, 'start', '', 'title,description', '', 'like', 'reports', '', 192, 'BxTimelineGridAdministration', 'modules/boonex/timeline/classes/BxTimelineGridAdministration.php'),
('bx_timeline_common', 'Sql', 'SELECT * FROM `bx_timeline_events` WHERE 1 AND `active`=''1'' ', 'bx_timeline_events', 'id', 'date', 'status', '', 20, NULL, 'start', '', 'title,description', '', 'like', '', '', 2147483647, 'BxTimelineGridCommon', 'modules/boonex/timeline/classes/BxTimelineGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_timeline_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_timeline_administration', 'switcher', '_bx_timeline_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_timeline_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_timeline_administration', 'status', '_bx_timeline_grid_column_title_adm_status', '5%', 1, 0, '', 4),
('bx_timeline_administration', 'description', '_bx_timeline_grid_column_title_adm_description', '25%', 0, '25', '', 5),
('bx_timeline_administration', 'date', '_bx_timeline_grid_column_title_adm_added', '15%', 1, 0, '', 6),
('bx_timeline_administration', 'owner_id', '_bx_timeline_grid_column_title_adm_author', '20%', 0, 0, '', 7),
('bx_timeline_administration', 'actions', '', '20%', 0, '', '', 8),

('bx_timeline_common', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_timeline_common', 'switcher', '_bx_timeline_grid_column_title_adm_active', '8%', 0, 0, '', 2),
('bx_timeline_common', 'description', '_bx_timeline_grid_column_title_adm_description', '30%', 0, 25, '', 3),
('bx_timeline_common', 'date', '_bx_timeline_grid_column_title_adm_added', '20%', 1, 25, '', 4),
('bx_timeline_common', 'status_admin', '_bx_posts_grid_column_title_adm_status_admin', '20%', 0, 16, '', 5),
('bx_timeline_common', 'actions', '', '20%', 0, 0, '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_timeline_administration', 'bulk', 'delete', '_bx_timeline_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_timeline_administration', 'single', 'delete', '_bx_timeline_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_timeline_administration', 'single', 'audit_content', '_bx_timeline_grid_action_title_adm_audit_content', 'search', 1, 0, 4),

('bx_timeline_common', 'bulk', 'delete', '_bx_timeline_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_timeline_common', 'single', 'delete', '_bx_timeline_grid_action_title_adm_delete', 'remove', 1, 1, 2);


-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('bx_timeline', 'bx_timeline', 'bx_timeline_meta_keywords', 'bx_timeline_meta_locations', 'bx_timeline_meta_mentions', '', '');


-- CONNECTIONS
INSERT INTO `sys_objects_connection` (`object`, `table`, `profile_initiator`, `profile_content`, `type`, `override_class_name`, `override_class_file`) VALUES
('bx_timeline_mute', 'bx_timeline_mute', 1, 1, 'one-way', '', '');


-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES 
('bx_timeline', '_bx_timeline_et_txt_name_send', 'bx_timeline_send', '_bx_timeline_et_txt_subject_send', '_bx_timeline_et_txt_body_send');


-- CRON
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_timeline_hot', '0 * * * *', 'BxTimelineCronHot', 'modules/boonex/timeline/classes/BxTimelineCronHot.php', ''),
('bx_timeline_publishing', '* * * * *', 'BxTimelineCronPublishing', 'modules/boonex/timeline/classes/BxTimelineCronPublishing.php', ''),
('bx_timeline_clean', '0 0 * * *', 'BxTimelineCronClean', 'modules/boonex/timeline/classes/BxTimelineCronClean.php', '');

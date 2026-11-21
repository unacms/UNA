-- PAGES: 

-- PAGES: Home
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('sys_home', 3, 'bx_timeline', '_bx_timeline_page_block_title_system_view_home', '_bx_timeline_page_block_title_view_home', 0, '', '', 0, 0, 2147483644, '0', 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:19:"get_block_view_home";}', '', '', 0, '', 0, '', 1, 0, 0, 1, 0),
('sys_home', 3, 'bx_timeline', '_bx_timeline_page_block_title_system_view_account', '_bx_timeline_page_block_title_view_account', 0, '', '', 0, 0, 2147483644, '0', 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_view_account";}', '', '', 0, '', 0, '', 1, 0, 0, 1, 0),
('sys_home', 3, 'bx_timeline', '_bx_timeline_page_block_title_system_view_hot', '_bx_timeline_page_block_title_view_hot', 0, '', '', 0, 0, 2147483644, '0', 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:18:"get_block_view_hot";}', '', '', 0, '', 0, '', 1, 0, 0, 1, 0),
('sys_home', 3, 'bx_timeline', '_bx_timeline_page_block_title_system_view_feed_and_hot', '_bx_timeline_page_block_title_view_feed_and_hot', 0, '', '', 0, 0, 2147483644, '0', 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:27:"get_block_view_feed_and_hot";}', '', '', 0, '', 0, '', 1, 0, 0, 1, 0),
('sys_home', 3, 'bx_timeline', '_bx_timeline_page_block_title_system_view_channels', '_bx_timeline_page_block_title_view_channels', 0, '', '', 0, 0, 2147483644, '0', 'service', 'a:2:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:23:"get_block_view_channels";}', '', '', 0, '', 0, '', 1, 0, 0, 1, 0);

-- PAGES: View person profile
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('bx_persons_view_profile', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_view_profile', '', 0, '', '', 0, 0, 2147483647, '0', 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_view_profile";s:6:"params";a:1:{i:0;s:6:"{type}";}}', '', '', 0, '', 0, '', 1, 0, 0, 1, 0);

-- PAGES: View organization profile
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('bx_organizations_view_profile', 1, 'bx_timeline', '_bx_timeline_page_block_title_system_view_profile', '', 0, '', '', 0, 0, 2147483647, '', 'service', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:22:"get_block_view_profile";s:6:"params";a:1:{i:0;s:6:"{type}";}}', '', '', 0, '', 0, '', 1, 0, 0, 1, 0);

-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'post\',\r\n}' WHERE `object`='bx_timeline_item';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_profile' AND `title`='_bx_timeline_page_block_title_view_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_view' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_post_profile' AND `title`='_bx_timeline_page_block_title_post_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_view_home' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_post_home' AND `title`='_bx_timeline_page_block_title_post_home';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_view_home' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_home_outline' AND `title`='_bx_timeline_page_block_title_view_home_outline';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_view_hot' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_hot_outline' AND `title`='_bx_timeline_page_block_title_view_hot_outline';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_item' AND `module`='bx_timeline' AND `title_system`='' AND `title`='_bx_timeline_page_block_title_item';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_item' AND `module`='bx_timeline' AND `title_system`='' AND `title`='_bx_timeline_page_block_title_item_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_item' AND `module`='bx_timeline' AND `title_system`='' AND `title`='_bx_timeline_page_block_title_item_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_item_brief' AND `module`='bx_timeline' AND `title_system`='' AND `title`='_bx_timeline_page_block_title_item_content';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_manage' AND `module`='bx_timeline' AND `title_system`='' AND `title`='_bx_timeline_page_block_title_manage_own';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_manage' AND `module`='bx_timeline' AND `title_system`='' AND `title`='_bx_timeline_page_block_title_muted';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_timeline_administration' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_manage_administration' AND `title`='_bx_timeline_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_post_profile' AND `title`='_bx_timeline_page_block_title_post_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_profile' AND `title`='_bx_timeline_page_block_title_view_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_groups_view_profile' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_profile' AND `title`='_bx_timeline_page_block_title_view_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_profile' AND `title`='_bx_timeline_page_block_title_view_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_spaces_view_profile' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_profile' AND `title`='_bx_timeline_page_block_title_view_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_home' AND `title`='_bx_timeline_page_block_title_view_home_1680082327';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_content_links' AND `module`='bx_timeline' AND `name`='create-item';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_create_post' AND `module`='bx_timeline' AND `name`='create-item';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_timeline' AND `name`='profile-stats-my-timeline';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_timeline' AND `name`='timeline-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_view' AND `module`='bx_timeline' AND `name`='feed';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_view' AND `module`='bx_timeline' AND `name`='public';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_view' AND `module`='bx_timeline' AND `name`='hot';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_feeds' AND `module`='bx_timeline' AND `name`='feed';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_feeds' AND `module`='bx_timeline' AND `name`='public';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_feeds' AND `module`='bx_timeline' AND `name`='hot';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_feeds' AND `module`='bx_timeline' AND `name`='divider';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_share' AND `module`='bx_timeline' AND `name`='item-repost';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_share' AND `module`='bx_timeline' AND `name`='item-repost-with';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_share' AND `module`='bx_timeline' AND `name`='item-repost-to';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_share' AND `module`='bx_timeline' AND `name`='item-send';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_manage' AND `module`='bx_timeline' AND `name`='item-report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_manage' AND `module`='bx_timeline' AND `name`='item-edit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_manage' AND `module`='bx_timeline' AND `name`='item-delete';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions' AND `module`='bx_timeline' AND `name`='item-comment';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions' AND `module`='bx_timeline' AND `name`='item-reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions' AND `module`='bx_timeline' AND `name`='item-share';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-comment';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-share';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-pin';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-unpin';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-stick';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-unstick';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-promote';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-unpromote';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-mute';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-edit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='item-delete';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_actions_all' AND `module`='bx_timeline' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_counters' AND `module`='bx_timeline' AND `name`='item-view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_counters' AND `module`='bx_timeline' AND `name`='item-reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_counters' AND `module`='bx_timeline' AND `name`='item-comment';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_meta' AND `module`='bx_timeline' AND `name`='date';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_item_share' AND `module`='bx_timeline' AND `name`='item-copy';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_post_attachments' AND `module`='bx_timeline' AND `name`='add-link';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_post_attachments' AND `module`='bx_timeline' AND `name`='add-photo-html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_post_attachments' AND `module`='bx_timeline' AND `name`='add-video-html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_post_attachments' AND `module`='bx_timeline' AND `name`='add-video-record';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_post_attachments' AND `module`='bx_timeline' AND `name`='add-file-html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_timeline_menu_post_attachments' AND `module`='bx_timeline' AND `name`='add-poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_onboarding_operator' AND `module`='bx_timeline' AND `name`='post';

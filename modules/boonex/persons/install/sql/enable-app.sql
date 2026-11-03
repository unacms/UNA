-- PAGES: 
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('bx_persons_view_profile', 1, 'system', '_sys_page_block_title_sys_create_post', '_sys_page_block_title_create_post', 11, '', '', 1, 4, 2147483644, '0', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_create_post_form";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}s:5:"class";s:13:"TemplServices";}', '', '', 0, '', 0, '', 1, 0, 0, 1, 0);

-- PAGES: config_api
UPDATE `sys_pages_blocks` SET `config_api`='{\r\n\"content_type\":\"browse_simple\",\r\n\"header_more_url\":\"/persons-home\",\r\n\"view\":\"row\"\r\n}' WHERE `object`='sys_explore' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_sys_featured_entries_view_showcase' AND `title`='_bx_persons_page_block_title_featured_entries_view_showcase_1759743271';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_create_profile' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_create_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_sys_cover_block' AND `title`='_bx_persons_page_block_title_cover_block';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_profile_description';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_profile_friends';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_profile_relations';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_profile_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_profile_location';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile_closed' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_profile_private';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_edit_profile' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_edit_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_delete_profile' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_delete_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_profile_info' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_system_profile_info' AND `title`='_bx_persons_page_block_title_profile_info_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_profile_info' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_profile_description';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_profile_friends' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_system_profile_friends' AND `title`='_bx_persons_page_block_title_profile_friends_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_friend_requests' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_system_friend_requests' AND `title`='_bx_persons_page_block_title_friend_requests_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_profile_favorites' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_system_profile_favorites' AND `title`='_bx_persons_page_block_title_profile_favorites';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_profile_subscriptions' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_system_profile_subscribed_me' AND `title`='_bx_persons_page_block_title_profile_subscribed_me';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_profile_relations' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_system_profile_relations' AND `title`='_bx_persons_page_block_title_profile_relations';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_profile_relations' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_system_profile_related_me' AND `title`='_bx_persons_page_block_title_profile_related_me';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_home' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_latest_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_active' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_active_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_online' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_online_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_search' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_search' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_manage' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_system_manage' AND `title`='_bx_persons_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_administration' AND `module`='bx_persons' AND `title_system`='_bx_persons_page_block_title_system_manage_administration' AND `title`='_bx_persons_page_block_title_manage';

-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_persons' AND `name`='persons-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_persons' AND `name`='persons-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_profile_links' AND `module`='bx_persons' AND `name`='create-persons-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_persons' AND `name`='profile-stats-friend-requests';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_persons' AND `name`='profile-stats-manage-profiles';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_persons' AND `name`='profile-stats-favorite-persons';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_persons' AND `name`='profile-stats-subscriptions';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_persons' AND `name`='profile-stats-subscribed-me';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_persons' AND `name`='profile-stats-relations';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_persons' AND `name`='profile-stats-related-me';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_followings' AND `module`='bx_persons' AND `name`='persons';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions' AND `module`='bx_persons' AND `name`='profile-friend-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions' AND `module`='bx_persons' AND `name`='profile-subscribe-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions' AND `module`='bx_persons' AND `name`='profile-set-acl-level';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions' AND `module`='bx_persons' AND `name`='profile-set-badges';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions' AND `module`='bx_persons' AND `name`='profile-actions-more';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_more' AND `module`='bx_persons' AND `name`='edit-persons-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_more' AND `module`='bx_persons' AND `name`='edit-persons-badge';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_more' AND `module`='bx_persons' AND `name`='delete-persons-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_more' AND `module`='bx_persons' AND `name`='delete-persons-account';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_all' AND `module`='bx_persons' AND `name`='profile-friend-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_all' AND `module`='bx_persons' AND `name`='profile-friend-remove';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_all' AND `module`='bx_persons' AND `name`='profile-subscribe-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_all' AND `module`='bx_persons' AND `name`='profile-subscribe-remove';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_all' AND `module`='bx_persons' AND `name`='profile-set-acl-level';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_all' AND `module`='bx_persons' AND `name`='profile-set-badges';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_actions_all' AND `module`='bx_persons' AND `name`='feature';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_meta' AND `module`='bx_persons' AND `name`='membership';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_meta' AND `module`='bx_persons' AND `name`='badges';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_meta' AND `module`='bx_persons' AND `name`='friends';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_meta' AND `module`='bx_persons' AND `name`='subscribers';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_meta' AND `module`='bx_persons' AND `name`='views';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_meta' AND `module`='bx_persons' AND `name`='votes';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_meta' AND `module`='bx_persons' AND `name`='comments';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_submenu' AND `module`='bx_persons' AND `name`='persons-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_submenu' AND `module`='bx_persons' AND `name`='persons-active';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_submenu' AND `module`='bx_persons' AND `name`='persons-online';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_submenu' AND `module`='bx_persons' AND `name`='persons-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_submenu' AND `module`='bx_persons' AND `name`='persons-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_submenu' AND `module`='bx_persons' AND `name`='view-persons-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_submenu' AND `module`='bx_persons' AND `name`='persons-profile-info';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_submenu' AND `module`='bx_persons' AND `name`='persons-profile-friends';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_view_submenu' AND `module`='bx_persons' AND `name`='persons-profile-subscriptions';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_snippet_meta' AND `module`='bx_persons' AND `name`='subscribe';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_snippet_meta' AND `module`='bx_persons' AND `name`='ignore-befriend';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_snippet_meta' AND `module`='bx_persons' AND `name`='ignore-subscribe';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_menu_manage_tools' AND `module`='bx_persons' AND `name`='clear-reports';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_menu_manage_tools' AND `module`='bx_persons' AND `name`='manage-cf';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_menu_manage_tools' AND `module`='bx_persons' AND `name`='delete-with-content';

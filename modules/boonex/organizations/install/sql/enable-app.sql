-- PAGES: 
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('bx_organizations_view_profile', 1, 'system', '_sys_page_block_title_sys_create_post_context', '_sys_page_block_title_create_post_context', 11, '', '', 1, 4, 2147483644, '0', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_create_post_form";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}s:5:"class";s:13:"TemplServices";}', '', '', 0, '', 0, '', 1, 0, 0, 1, 0);

-- PAGES: config_api

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_create_profile' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_create_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_profile_description';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_fans';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_profile_friends';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_profile_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_entry_reports';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile_closed' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_profile_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile_closed' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_fans';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_edit_profile' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_edit_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_invite' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_invite_to_organization';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_delete_profile' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_delete_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_join_profile' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_join_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_profile_info' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_profile_info' AND `title`='_bx_orgs_page_block_title_profile_info_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_profile_info' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_profile_description';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_profile_pricing' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_profile_pricing' AND `title`='_bx_orgs_page_block_title_profile_pricing_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_profile_friends' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_profile_friends' AND `title`='_bx_orgs_page_block_title_profile_friends_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_friend_requests' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_friend_requests' AND `title`='_bx_orgs_page_block_title_friend_requests_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_profile_favorites' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_profile_favorites' AND `title`='_bx_orgs_page_block_title_profile_favorites';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_profile_subscriptions' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_profile_subscriptions' AND `title`='_bx_orgs_page_block_title_profile_subscriptions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_profile_subscriptions' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_profile_subscribed_me' AND `title`='_bx_orgs_page_block_title_profile_subscribed_me';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_profile_relations' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_profile_relations' AND `title`='_bx_orgs_page_block_title_profile_relations';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_profile_relations' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_profile_related_me' AND `title`='_bx_orgs_page_block_title_profile_related_me';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_home' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_latest_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_active' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_active_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_online' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_online_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_search' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `config_api`='{"use_as_filter":true}' WHERE `object`='bx_organizations_search' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_search' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_manage' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_manage' AND `title`='_bx_orgs_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_administration' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_system_manage_administration' AND `title`='_bx_orgs_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_joined' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_sys_entries_actions' AND `title`='_bx_orgs_page_block_title_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_joined' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_sys_favorites_of_author' AND `title`='_bx_orgs_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_joined' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_sys_joined_entries' AND `title`='_bx_orgs_page_block_title_joined_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_favorites' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_sys_favorites_entries' AND `title`='_bx_orgs_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_favorites' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_favorites' AND `module`='bx_organizations' AND `title_system`='' AND `title`='_bx_orgs_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_posts' AND `title_system`='_bx_posts_page_block_title_sys_my_entries' AND `title`='_bx_posts_page_block_title_my_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_organizations_view_profile' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_sys_joined_entries' AND `title`='_bx_orgs_page_block_title_joined_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_persons_view_profile' AND `module`='bx_organizations' AND `title_system`='_bx_orgs_page_block_title_sys_joined_entries' AND `title`='_bx_orgs_page_block_title_joined_entries';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_organizations' AND `name`='organizations-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_organizations' AND `name`='organizations-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_profile_links' AND `module`='bx_organizations' AND `name`='create-organization-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_organizations' AND `name`='profile-stats-friend-requests';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_organizations' AND `name`='profile-stats-manage-organizations';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_organizations' AND `name`='profile-stats-favorite-organizations';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_organizations' AND `name`='profile-stats-subscriptions';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_organizations' AND `name`='profile-stats-subscribed-me';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_organizations' AND `name`='profile-stats-relations';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_organizations' AND `name`='profile-stats-related-me';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_followings' AND `module`='bx_organizations' AND `name`='organizations';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_memberships' AND `module`='bx_organizations' AND `name`='organizations';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_organizations' AND `name`='organizations-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions' AND `module`='bx_organizations' AND `name`='join-organization-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions' AND `module`='bx_organizations' AND `name`='profile-fan-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions' AND `module`='bx_organizations' AND `name`='profile-friend-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions' AND `module`='bx_organizations' AND `name`='profile-relation-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions' AND `module`='bx_organizations' AND `name`='profile-subscribe-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions' AND `module`='bx_organizations' AND `name`='profile-set-acl-level';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions' AND `module`='bx_organizations' AND `name`='profile-set-badges';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions' AND `module`='bx_organizations' AND `name`='profile-actions-more';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_more' AND `module`='bx_organizations' AND `name`='edit-organization-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_more' AND `module`='bx_organizations' AND `name`='edit-organization-pricing';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_more' AND `module`='bx_organizations' AND `name`='edit-organization-badge';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_more' AND `module`='bx_organizations' AND `name`='invite-to-organization';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_more' AND `module`='bx_organizations' AND `name`='delete-organization-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_more' AND `module`='bx_organizations' AND `name`='delete-organization-account';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_more' AND `module`='bx_organizations' AND `name`='delete-organization-account-content';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_all' AND `module`='bx_organizations' AND `name`='report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_all' AND `module`='bx_organizations' AND `name`='profile-fans';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_actions_all' AND `module`='bx_organizations' AND `name`='profile-subscriptions';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_meta' AND `module`='bx_organizations' AND `name`='membership';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_meta' AND `module`='bx_organizations' AND `name`='badges';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_meta' AND `module`='bx_organizations' AND `name`='members';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_meta' AND `module`='bx_organizations' AND `name`='subscribers';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_meta' AND `module`='bx_organizations' AND `name`='views';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_meta' AND `module`='bx_organizations' AND `name`='votes';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_meta' AND `module`='bx_organizations' AND `name`='comments';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_my' AND `module`='bx_organizations' AND `name`='create-organization-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_submenu' AND `module`='bx_organizations' AND `name`='organizations-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_submenu' AND `module`='bx_organizations' AND `name`='organizations-active';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_submenu' AND `module`='bx_organizations' AND `name`='organizations-online';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_submenu' AND `module`='bx_organizations' AND `name`='organizations-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_submenu' AND `module`='bx_organizations' AND `name`='organizations-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_submenu' AND `module`='bx_organizations' AND `name`='view-organization-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_submenu' AND `module`='bx_organizations' AND `name`='organization-profile-info';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_view_submenu' AND `module`='bx_organizations' AND `name`='organization-profile-fans';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_snippet_meta' AND `module`='bx_organizations' AND `name`='members';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_snippet_meta' AND `module`='bx_organizations' AND `name`='friends';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_snippet_meta' AND `module`='bx_organizations' AND `name`='nl';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_snippet_meta' AND `module`='bx_organizations' AND `name`='join-paid';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_snippet_meta' AND `module`='bx_organizations' AND `name`='join';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_snippet_meta' AND `module`='bx_organizations' AND `name`='befriend';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_menu_manage_tools' AND `module`='bx_organizations' AND `name`='clear-reports';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_menu_manage_tools' AND `module`='bx_organizations' AND `name`='delete-with-content';

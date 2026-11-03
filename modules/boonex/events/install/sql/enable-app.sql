-- PAGES: config_api
UPDATE `sys_pages_blocks` SET `config_api`='{\r\n\"content_type\":\"browse_simple\",\r\n\"header_more_url\":\"/events-home\",\r\n\"view\":\"row\"\r\n}' WHERE `object`='sys_explore' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_sys_featured_entries_view_showcase';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_create_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_create_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_profile_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_profile_calendar';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_sys_entry_context' AND `title`='_bx_events_page_block_title_entry_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_fans';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_admins';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_entry_location';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_entry_reports';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile_closed' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_profile_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile_closed' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_fans';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_edit_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_edit_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_invite' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_invite_to_group';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_delete_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_delete_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_join_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_join_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_profile_info' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_profile_description';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_profile_info' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_system_profile_info' AND `title`='_bx_events_page_block_title_profile_info_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_profile_info' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_profile_calendar';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_profile_info' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_entry_location';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_profile_pricing' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_profile_pricing';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_home' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_latest_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_top' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_top_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_context' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_sys_entries_in_context' AND `title`='_bx_events_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_context' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_sys_calendar_in_context' AND `title`='_bx_events_page_block_title_calendar_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_past' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_past_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_calendar' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_calendar';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_search' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_search' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_joined_events' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_joined_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_manage' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_system_manage' AND `title`='_bx_events_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_administration' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_system_manage_administration' AND `title`='_bx_events_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_joined' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_sys_entries_actions' AND `title`='_bx_events_page_block_title_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_joined' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_sys_favorites_of_author' AND `title`='_bx_events_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_joined' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_sys_joined_entries' AND `title`='_bx_events_page_block_title_joined_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_favorites' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_sys_favorites_entries' AND `title`='_bx_events_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_favorites' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_favorites' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_create_post_context' AND `title`='_sys_page_block_title_create_post_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_joined' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_sys_joined_calendar' AND `title`='_bx_events_page_block_title_joined_calendar';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_view_profile' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_profile_sessions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_profile_sessions' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_profile_sessions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_questionnaire' AND `module`='bx_events' AND `title_system`='' AND `title`='_bx_events_page_block_title_edit_questionnaire';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_manage_item' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_system_fans' AND `title`='_bx_events_page_block_title_fans_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_manage_item' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_system_invites' AND `title`='_bx_events_page_block_title_fans_invites';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_events_fans' AND `module`='bx_events' AND `title_system`='_bx_events_page_block_title_system_fans' AND `title`='_bx_events_page_block_title_fans_link';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_events' AND `name`='events-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_events' AND `name`='events-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_content_links' AND `module`='bx_events' AND `name`='create-event-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_events' AND `name`='profile-stats-my-events';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_followings' AND `module`='bx_events' AND `name`='events';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_events' AND `name`='events-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions' AND `module`='bx_events' AND `name`='join-event-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions' AND `module`='bx_events' AND `name`='profile-fan-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions' AND `module`='bx_events' AND `name`='profile-subscribe-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions' AND `module`='bx_events' AND `name`='profile-set-badges';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions' AND `module`='bx_events' AND `name`='ical-export';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions' AND `module`='bx_events' AND `name`='profile-actions-more';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions' AND `module`='bx_events' AND `name`='profile-check-in';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_more' AND `module`='bx_events' AND `name`='edit-event-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_more' AND `module`='bx_events' AND `name`='event-pricing';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_more' AND `module`='bx_events' AND `name`='invite-to-event';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_more' AND `module`='bx_events' AND `name`='delete-event-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_more' AND `module`='bx_events' AND `name`='approve-event-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_more' AND `module`='bx_events' AND `name`='event-sessions';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_more' AND `module`='bx_events' AND `name`='event-questionnaire';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_all' AND `module`='bx_events' AND `name`='profile-fan-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_all' AND `module`='bx_events' AND `name`='profile-fan-remove';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_all' AND `module`='bx_events' AND `name`='profile-subscribe-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_all' AND `module`='bx_events' AND `name`='profile-subscribe-remove';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_actions_all' AND `module`='bx_events' AND `name`='profile-check-in';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_meta' AND `module`='bx_events' AND `name`='members';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_meta' AND `module`='bx_events' AND `name`='subscribers';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_meta' AND `module`='bx_events' AND `name`='views';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_meta' AND `module`='bx_events' AND `name`='votes';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_meta' AND `module`='bx_events' AND `name`='comments';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_my' AND `module`='bx_events' AND `name`='create-event-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_submenu' AND `module`='bx_events' AND `name`='events-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_submenu' AND `module`='bx_events' AND `name`='events-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_submenu' AND `module`='bx_events' AND `name`='events-upcoming';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_submenu' AND `module`='bx_events' AND `name`='events-calendar';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_submenu' AND `module`='bx_events' AND `name`='events-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_submenu' AND `module`='bx_events' AND `name`='events-joined';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_submenu' AND `module`='bx_events' AND `name`='events-followed';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_submenu' AND `module`='bx_events' AND `name`='view-event-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_submenu' AND `module`='bx_events' AND `name`='event-profile-info';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_view_submenu' AND `module`='bx_events' AND `name`='event-fans';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_snippet_meta' AND `module`='bx_events' AND `name`='join-paid';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_snippet_meta' AND `module`='bx_events' AND `name`='join';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_snippet_meta' AND `module`='bx_events' AND `name`='leave';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_snippet_meta' AND `module`='bx_events' AND `name`='subscribe';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_snippet_meta' AND `module`='bx_events' AND `name`='unsubscribe';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_menu_manage_tools' AND `module`='bx_events' AND `name`='clear-reports';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_events_menu_manage_tools' AND `module`='bx_events' AND `name`='delete';

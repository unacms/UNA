-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'profile\',\r\n    blocks: {\r\n        col0: {\r\n            name: \'bx_timeline:get_block_post_profile\',\r\n            showTitle: false,\r\n            showBg: false,\r\n        },\r\n        col1: {\r\n            name: \'bx_timeline:get_block_view_profile\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            perLine: 1,\r\n        },\r\n    },\r\n    headerSettings: {\r\n        offset: false,\r\n        header: false,\r\n        cover: \'min\'\r\n    },\r\n}' WHERE `object`='bx_channels_view_profile';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_view_profile' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_entry_breadcrumb';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_view_profile' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_entry_parent';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_view_profile' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_entry_childs';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_view_profile' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_profile_subscribed_me';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_view_profile' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_entry_reports';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_view_profile_closed' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_profile_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_edit_profile' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_edit_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_delete_profile' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_delete_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_author' AND `module`='bx_channels' AND `title_system`='_bx_channels_page_block_title_sys_favorites_of_author' AND `title`='_bx_channels_page_block_title_favorites_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_author' AND `module`='bx_channels' AND `title_system`='_bx_channels_page_block_title_sys_entries_of_author' AND `title`='_bx_channels_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_home' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_latest_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_toplevel' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_toplevel';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_search' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `config_api`='{"use_as_filter":true}' WHERE `object`='bx_channels_search' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_search' AND `module`='bx_channels' AND `title_system`='' AND `title`='_bx_channels_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_administration' AND `module`='bx_channels' AND `title_system`='_bx_channels_page_block_title_system_manage_administration' AND `title`='_bx_channels_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_view_profile' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_post_profile' AND `title`='_bx_timeline_page_block_title_post_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_view_profile' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_create_post_context' AND `title`='_sys_page_block_title_create_post_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_channels_view_profile' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_profile' AND `title`='_bx_timeline_page_block_title_view_profile';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_channels' AND `name`='channels-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_channels' AND `name`='channels-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_channels' AND `name`='channels-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_followings' AND `module`='bx_channels' AND `name`='channels';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_view_actions' AND `module`='bx_channels' AND `name`='profile-subscribe-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_view_actions' AND `module`='bx_channels' AND `name`='profile-actions-more';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_view_actions_more' AND `module`='bx_channels' AND `name`='delete-channel-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_view_actions_all' AND `module`='bx_channels' AND `name`='profile-subscribe-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_view_actions_all' AND `module`='bx_channels' AND `name`='profile-subscribe-remove';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_submenu' AND `module`='bx_channels' AND `name`='channels-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_submenu' AND `module`='bx_channels' AND `name`='channels-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_submenu' AND `module`='bx_channels' AND `name`='channels-toplevel';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_submenu' AND `module`='bx_channels' AND `name`='channels-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_submenu' AND `module`='bx_channels' AND `name`='channels-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_snippet_meta' AND `module`='bx_channels' AND `name`='members';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_snippet_meta' AND `module`='bx_channels' AND `name`='subscribers';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_snippet_meta' AND `module`='bx_channels' AND `name`='nl';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_snippet_meta' AND `module`='bx_channels' AND `name`='subscribe';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_snippet_meta' AND `module`='bx_channels' AND `name`='unsubscribe';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_channels_menu_manage_tools' AND `module`='bx_channels' AND `name`='delete';

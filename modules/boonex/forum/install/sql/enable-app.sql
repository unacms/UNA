-- PAGES: Home
DELETE FROM `sys_pages_blocks` WHERE `object`='bx_forum_home' AND `title`='_bx_forum_page_block_title_latest_entries';
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES 
('bx_forum_home', 3, 'bx_forum', '_bx_forum_page_block_title_latest_entries_view_gallery', '_bx_forum_page_block_title_latest_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:13:"browse_latest";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:1;}}', 0, 1, 0, 1, 0);

-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'post\',\r\n}' WHERE `object`='bx_forum_view_entry';
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'navigator\',\r\n    blocks: {\r\n        browse: {\r\n            name: \'system:categories_list\',\r\n            showTitle: false,\r\n            showBg: false,\r\n        },\r\n        browse_sidebar: {\r\n            name: \'bx_forum:browse_popular\',\r\n            showTitle: true,\r\n            showBg: false,\r\n            sidebar: true,\r\n        },\r\n        categories: {\r\n            name: \'system:categories_list\',\r\n            showTitle: false,\r\n            showBg: true,\r\n            sidebar: false,\r\n            hidden: true,\r\n        },\r\n    },\r\n}' WHERE `object`='bx_forum_categories';
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'navigator\',\r\n    blocks: {\r\n        browse: {\r\n            name: \'bx_forum:browse_category\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            perLine: 1,\r\n            skeleton: \'notifications\',\r\n        },\r\n        browse_sidebar: {\r\n            name: \'bx_forum:browse_popular\',\r\n            showTitle: true,\r\n            showBg: false,\r\n            sidebar: true,\r\n        },\r\n        categories: {\r\n            name: \'system:categories_list\',\r\n            showTitle: false,\r\n            showBg: true,\r\n            sidebar: false,\r\n            hidden: true,\r\n        },\r\n    },\r\n}' WHERE `object`='bx_forum_category';
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'navigator\',\r\n    blocks: {\r\n        browse: {\r\n            name: \'bx_forum:browse_new\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            perLine: 1,\r\n        },\r\n        browse_sidebar: {\r\n            name: \'bx_forum:browse_popular\',\r\n            showTitle: true,\r\n            showBg: false,\r\n            sidebar: true,\r\n            unitType: \'small\',\r\n        },\r\n        categories: {\r\n            name: \'system:categories_list\',\r\n            showTitle: false,\r\n            showBg: true,\r\n            sidebar: false,\r\n            hidden: true,\r\n        },\r\n    },\r\n}' WHERE `object`='bx_forum_home';


-- PAGES: blocks config_api
-- Categories on the forum home: a dropdown next to the tabs while NEO's left panel is off screen.
UPDATE `sys_pages_blocks` SET `config_api`='{"use_as_menu": true}' WHERE `object`='bx_forum_home' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_cats';


-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_create_entry' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_edit_entry' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_delete_entry' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_view_entry' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_view_entry' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_entry_text';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_view_entry' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_view_entry' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_entry_attachments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_view_entry' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_entry_polls';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_view_entry' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_categories' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_entries_categories';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_category' AND `module`='bx_forum' AND `title_system`='_bx_forum_page_block_title_sys_entries_by_category' AND `title`='_bx_forum_page_block_title_entries_by_category';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_category' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_cats';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_keyword' AND `module`='bx_forum' AND `title_system`='_bx_forum_page_block_title_sys_entries_by_keyword' AND `title`='_bx_forum_page_block_title_entries_by_keyword';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_author' AND `module`='bx_forum' AND `title_system`='_bx_forum_page_block_title_sys_entries_of_author' AND `title`='_bx_forum_page_block_title_entries_of_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_favorites' AND `module`='bx_forum' AND `title_system`='_bx_forum_page_block_title_sys_favorites_entries' AND `title`='_bx_forum_page_block_title_favorites_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_favorites' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_favorites_entries_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_favorites' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_favorites_entries_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_context' AND `module`='bx_forum' AND `title_system`='_bx_forum_page_block_title_sys_entries_in_context' AND `title`='_bx_forum_page_block_title_entries_in_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_home' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_cats';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_search' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_entries_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_search' AND `module`='bx_forum' AND `title_system`='' AND `title`='_bx_forum_page_block_title_entries_search_results';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_manage' AND `module`='bx_forum' AND `title_system`='_bx_forum_page_block_title_system_manage' AND `title`='_bx_forum_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_forum_administration' AND `module`='bx_forum' AND `title_system`='_bx_forum_page_block_title_system_manage_administration' AND `title`='_bx_forum_page_block_title_manage';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_forum' AND `name`='discussions-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_forum' AND `name`='discussions-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_add_content_links' AND `module`='bx_forum' AND `name`='create-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_create_post' AND `module`='bx_forum' AND `name`='create-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='bx_forum' AND `name`='profile-stats-my-forum';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_forum' AND `name`='discussions-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_entry_attachments' AND `module`='bx_forum' AND `name`='photo_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_entry_attachments' AND `module`='bx_forum' AND `name`='video_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_entry_attachments' AND `module`='bx_forum' AND `name`='video_record_video';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_entry_attachments' AND `module`='bx_forum' AND `name`='file_html5';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_entry_attachments' AND `module`='bx_forum' AND `name`='poll';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_entry_attachments' AND `module`='bx_forum' AND `name`='add-link';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view' AND `module`='bx_forum' AND `name`='resolve-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view' AND `module`='bx_forum' AND `name`='stick-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view' AND `module`='bx_forum' AND `name`='lock-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view' AND `module`='bx_forum' AND `name`='hide-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view' AND `module`='bx_forum' AND `name`='approve';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view' AND `module`='bx_forum' AND `name`='more';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view_more' AND `module`='bx_forum' AND `name`='unresolve-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view_more' AND `module`='bx_forum' AND `name`='unstick-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view_more' AND `module`='bx_forum' AND `name`='unlock-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view_more' AND `module`='bx_forum' AND `name`='unhide-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view_more' AND `module`='bx_forum' AND `name`='edit-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view_more' AND `module`='bx_forum' AND `name`='delete-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view_actions' AND `module`='bx_forum' AND `name`='edit-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_view_actions' AND `module`='bx_forum' AND `name`='delete-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_my' AND `module`='bx_forum' AND `name`='create-discussion';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_submenu' AND `module`='bx_forum' AND `name`='discussions-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_submenu' AND `module`='bx_forum' AND `name`='discussions-search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_submenu' AND `module`='bx_forum' AND `name`='discussions-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_snippet_meta_main' AND `module`='bx_forum' AND `name`='comments';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_snippet_meta_main' AND `module`='bx_forum' AND `name`='status';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_snippet_meta_counters' AND `module`='bx_forum' AND `name`='views';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_snippet_meta_counters' AND `module`='bx_forum' AND `name`='votes';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_snippet_meta_counters' AND `module`='bx_forum' AND `name`='comments';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_snippet_meta_reply' AND `module`='bx_forum' AND `name`='reply-author';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_snippet_meta_reply' AND `module`='bx_forum' AND `name`='reply-date';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_forum_snippet_meta_reply' AND `module`='bx_forum' AND `name`='reply-text';

-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'profile\', \r\n    blocks: {\r\n        col5: {\r\n            name: \'bx_courses:entity_structure_l1_block\',\r\n            showTitle: false,\r\n            showBg: false,\r\n        },\r\n        col6: {\r\n            name: \'bx_courses:entity_structure_l2_block\',\r\n            showTitle: false,\r\n            showBg: false,\r\n        },\r\n        col1: {\r\n            name: \'bx_timeline:get_block_view_profile\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            perLine: 1,\r\n        },\r\n    },\r\n    headerSettings: {\r\n        offset: false,\r\n        header: false,\r\n        cover: \'profile\',\r\n        hideLeftmenu: true,\r\n        showAltTopMenu: true,\r\n    },\r\n}' WHERE `object`='bx_courses_view_profile';
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'profile\',\r\n    blocks: {\r\n        col1: {\r\n            name: \'bx_courses:entity_info_full\',\r\n            showTitle: false,\r\n            showBg: true,\r\n            showPad: true,\r\n            perLine: 1,\r\n        },\r\n        col2: {\r\n            name: \'bx_courses:entity_text_block\',\r\n            showTitle: false,\r\n            showBg: true,\r\n            sidebar: false,\r\n        },\r\n        col4: {\r\n            name: \'bx_persons:entity_cover\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            sidebar: false,\r\n            leftbar: true,\r\n        },\r\n    },\r\n    headerSettings: {\r\n        offset: false,\r\n        header: false,\r\n        cover: \'profile\',\r\n        hideLeftmenu: true,\r\n        showAltTopMenu: true,\r\n    },\r\n}' WHERE `object`='bx_courses_profile_info';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_create_profile' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_create_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_view_profile' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_profile_description';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_view_profile' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_profile_structure_l1';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_view_profile' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_profile_structure_l2';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_view_profile' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_profile_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_view_profile_node' AND `module`='bx_courses' AND `title_system`='_bx_courses_page_block_title_system_entry_node' AND `title`='_bx_courses_page_block_title_entry_node';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_edit_profile' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_edit_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_join_profile' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_join_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_profile_info' AND `module`='bx_courses' AND `title_system`='_bx_courses_page_block_title_system_profile_info' AND `title`='_bx_courses_page_block_title_profile_info_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_profile_info' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_profile_description';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_profile_content' AND `module`='bx_courses' AND `title_system`='_bx_courses_page_block_title_system_profile_structure' AND `title`='_bx_courses_page_block_title_profile_structure_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_profile_content' AND `module`='bx_courses' AND `title_system`='_bx_courses_page_block_title_system_profile_data' AND `title`='_bx_courses_page_block_title_profile_data_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_fans' AND `module`='bx_courses' AND `title_system`='_bx_courses_page_block_title_system_fans' AND `title`='_bx_courses_page_block_title_fans_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_home' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_latest_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_joined_courses' AND `module`='bx_courses' AND `title_system`='' AND `title`='_bx_courses_page_block_title_joined_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_manage' AND `module`='bx_courses' AND `title_system`='_bx_courses_page_block_title_system_manage' AND `title`='_bx_courses_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_courses_joined' AND `module`='bx_courses' AND `title_system`='_bx_courses_page_block_title_sys_entries_of_author' AND `title`='_bx_courses_page_block_title_entries_of_author';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_courses' AND `name`='courses-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_courses' AND `name`='courses-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_courses' AND `name`='courses-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_actions_more' AND `module`='bx_courses' AND `name`='edit-course-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_actions_more' AND `module`='bx_courses' AND `name`='edit-course-content';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_actions_more' AND `module`='bx_courses' AND `name`='delete-course-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_actions_all' AND `module`='bx_courses' AND `name`='profile-fan-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_actions_all' AND `module`='bx_courses' AND `name`='profile-fan-remove';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_submenu' AND `module`='bx_courses' AND `name`='courses-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_submenu' AND `module`='bx_courses' AND `name`='courses-joined';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_submenu' AND `module`='bx_courses' AND `name`='view-course-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_submenu' AND `module`='bx_courses' AND `name`='course-profile-info';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_submenu' AND `module`='bx_courses' AND `name`='course-fans';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_snippet_meta' AND `module`='bx_courses' AND `name`='comments';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_snippet_meta' AND `module`='bx_courses' AND `name`='join';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_actions' AND `module`='bx_convos' AND `name`='convos-compose';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_snippet_meta' AND `module`='bx_courses' AND `name`='reports';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_snippet_meta' AND `module`='bx_courses' AND `name`='pass';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_actions_more' AND `module`='bx_courses' AND `name`='hide-course-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_courses_view_actions_more' AND `module`='bx_courses' AND `name`='unhide-course-profile';

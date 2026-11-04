-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'profile-alt\',\r\n    blocks: {\r\n        col1: {\r\n            name: \'bx_jobs:entity_invite\',\r\n            showTitle: false,\r\n            showBg: true,\r\n            sidebar: false,\r\n            perLine: 1\r\n        },\r\n        col4: {\r\n            name: \'bx_linguriamods:profile_cover\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            sidebar: false,\r\n            leftbar: true\r\n        },\r\n    },\r\n    headerSettings: {\r\n        offset: false,\r\n        header: false,\r\n        cover: \'profile\',\r\n        hideLeftmenu: true,\r\n        showAltTopMenu: true\r\n    }\r\n}' WHERE `object`='bx_jobs_invite';
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'profile-alt\',\r\n    blocks: {\r\n        col1: {\r\n            name: \'bx_jobs:entity_delete\',\r\n            showTitle: false,\r\n            showBg: true,\r\n            sidebar: false,\r\n            perLine: 1\r\n        },\r\n        col4: {\r\n            name: \'bx_linguriamods:profile_cover\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            sidebar: false,\r\n            leftbar: true\r\n        },\r\n    },\r\n    headerSettings: {\r\n        offset: false,\r\n        header: false,\r\n        cover: \'profile\',\r\n        hideLeftmenu: true,\r\n        showAltTopMenu: true\r\n    }\r\n}' WHERE `object`='bx_jobs_delete_profile';
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'navigator\',\r\n    blocks: {\r\n        browse: {\r\n            name: \'system:get_results\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            perLine: 1\r\n        },\r\n        search: {\r\n            name: \'system:get_form\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            sidebar: false,\r\n            leftbar: true\r\n        },\r\n    },\r\n    headerSettings: {\r\n        hideLeftmenu: true\r\n    },\r\n}' WHERE `object`='bx_jobs_home';
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'profile-alt\',\r\n    blocks: {\r\n        col1: {\r\n            name: \'bx_jobs:fans_table\',\r\n            showTitle: false,\r\n            showBg: true,\r\n            sidebar: false,\r\n            perLine: 1\r\n        },\r\n        col2: {\r\n            name: \'bx_jobs:invites_table\',\r\n            showTitle: false,\r\n            showBg: true,\r\n            sidebar: false,\r\n            perLine: 1\r\n        },\r\n        col4: {\r\n            name: \'bx_linguriamods:profile_cover\',\r\n            showTitle: false,\r\n            showBg: false,\r\n            sidebar: false,\r\n            leftbar: true\r\n        },\r\n    },\r\n    headerSettings: {\r\n        offset: false,\r\n        header: false,\r\n        cover: \'profile\',\r\n        hideLeftmenu: true,\r\n        showAltTopMenu: true\r\n    }\r\n}' WHERE `object`='bx_jobs_manage';

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_create_profile' AND `module`='bx_jobs' AND `title_system`='' AND `title`='_bx_jobs_page_block_title_create_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_view_profile' AND `module`='bx_jobs' AND `title_system`='' AND `title`='_bx_jobs_page_block_title_profile_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_view_profile' AND `module`='bx_jobs' AND `title_system`='' AND `title`='_bx_jobs_page_block_title_profile_description';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_edit_profile' AND `module`='bx_jobs' AND `title_system`='' AND `title`='_bx_jobs_page_block_title_edit_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_questionnaire' AND `module`='bx_jobs' AND `title_system`='' AND `title`='_bx_jobs_page_block_title_edit_questionnaire';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_delete_profile' AND `module`='bx_jobs' AND `title_system`='' AND `title`='_bx_jobs_page_block_title_delete_profile';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_profile_info' AND `module`='bx_jobs' AND `title_system`='_bx_jobs_page_block_title_system_profile_info' AND `title`='_bx_jobs_page_block_title_profile_info_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_profile_info' AND `module`='bx_jobs' AND `title_system`='' AND `title`='_bx_jobs_page_block_title_profile_description';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_fans' AND `module`='bx_jobs' AND `title_system`='_bx_jobs_page_block_title_system_fans' AND `title`='_bx_jobs_page_block_title_fans_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_manage_item' AND `module`='bx_jobs' AND `title_system`='_bx_jobs_page_block_title_system_fans_manage' AND `title`='_bx_jobs_page_block_title_fans_link';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_top' AND `module`='bx_jobs' AND `title_system`='' AND `title`='_bx_jobs_page_block_title_top_profiles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_view_profile' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_create_post_context' AND `title`='_sys_page_block_title_create_post_context';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_jobs_view_profile' AND `module`='bx_timeline' AND `title_system`='_bx_timeline_page_block_title_system_view_profile' AND `title`='_bx_timeline_page_block_title_view_profile';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_jobs' AND `name`='jobs-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_jobs' AND `name`='jobs-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_jobs' AND `name`='jobs-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_actions_more' AND `module`='bx_jobs' AND `name`='job-manage';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_actions_more' AND `module`='bx_jobs' AND `name`='edit-job-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_actions_more' AND `module`='bx_jobs' AND `name`='job-questionnaire';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_actions_more' AND `module`='bx_jobs' AND `name`='invite-to-job';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_actions_more' AND `module`='bx_jobs' AND `name`='delete-job-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_actions_all' AND `module`='bx_jobs' AND `name`='join-job-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_actions_all' AND `module`='bx_jobs' AND `name`='profile-fan-add';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_submenu' AND `module`='bx_jobs' AND `name`='jobs-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_submenu' AND `module`='bx_jobs' AND `name`='jobs-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_submenu' AND `module`='bx_jobs' AND `name`='jobs-joined';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_submenu' AND `module`='bx_jobs' AND `name`='view-job-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_submenu' AND `module`='bx_jobs' AND `name`='job-profile-info';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_jobs_view_submenu' AND `module`='bx_jobs' AND `name`='job-fans';

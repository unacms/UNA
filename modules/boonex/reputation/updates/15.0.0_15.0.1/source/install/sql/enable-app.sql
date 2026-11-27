-- PAGES: config_api


-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_reputation_leaderboard' AND `module`='bx_reputation' AND `title_system`='' AND `title`='_bx_reputation_page_block_title_leaderboard_week';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_reputation_leaderboard' AND `module`='bx_reputation' AND `title_system`='' AND `title`='_bx_reputation_page_block_title_leaderboard_month';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_reputation_leaderboard' AND `module`='bx_reputation' AND `title_system`='' AND `title`='_bx_reputation_page_block_title_leaderboard_all_time';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_reputation_history' AND `module`='bx_reputation' AND `title_system`='' AND `title`='_bx_reputation_page_block_title_summary';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_reputation_history' AND `module`='bx_reputation' AND `title_system`='' AND `title`='_bx_reputation_page_block_title_history';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_reputation_submenu' AND `module`='bx_reputation' AND `name`='leaderboard';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_reputation_submenu' AND `module`='bx_reputation' AND `name`='points-history';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_reputation_submenu' AND `module`='bx_reputation' AND `name`='points-info';

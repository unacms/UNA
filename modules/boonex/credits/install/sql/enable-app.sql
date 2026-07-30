-- PAGES: config_api

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_credits_home' AND `module`='bx_credits' AND `title_system`='_bx_credits_page_block_title_sys_bundles' AND `title`='_bx_credits_page_block_title_bundles';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_credits_checkout' AND `module`='bx_credits' AND `title_system`='_bx_credits_page_block_title_sys_checkout' AND `title`='_bx_credits_page_block_title_checkout';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_credits_orders_common' AND `module`='bx_credits' AND `title_system`='_bx_credits_page_block_title_sys_orders_common_note' AND `title`='_bx_credits_page_block_title_orders_common_note';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_credits_orders_common' AND `module`='bx_credits' AND `title_system`='_bx_credits_page_block_title_sys_orders_common' AND `title`='_bx_credits_page_block_title_orders_common';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_credits_orders_administration' AND `module`='bx_credits' AND `title_system`='_bx_credits_page_block_title_sys_orders_administration' AND `title`='_bx_credits_page_block_title_orders_administration';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_credits_history_common' AND `module`='bx_credits' AND `title_system`='_bx_credits_page_block_title_sys_history_common' AND `title`='_bx_credits_page_block_title_history_common';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_credits_history_administration' AND `module`='bx_credits' AND `title_system`='_bx_credits_page_block_title_sys_history_administration' AND `title`='_bx_credits_page_block_title_history_administration';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_credits_profiles_administration' AND `module`='bx_credits' AND `title_system`='_bx_credits_page_block_title_sys_profiles_administration' AND `title`='_bx_credits_page_block_title_profiles_administration';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_credits_checkout' AND `module`='bx_credits' AND `title_system`='_bx_credits_page_block_title_sys_checkout' AND `title`='_bx_credits_page_block_title_checkout';

-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_credits_manage_submenu' AND `module`='bx_credits' AND `name`='credits-history-common';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_credits_manage_submenu' AND `module`='bx_credits' AND `name`='credits-history-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_credits_manage_submenu' AND `module`='bx_credits' AND `name`='credits-orders-common';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_credits_manage_submenu' AND `module`='bx_credits' AND `name`='credits-orders-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_credits_manage_submenu' AND `module`='bx_credits' AND `name`='credits-profiles-administration';

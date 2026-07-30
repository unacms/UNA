-- PAGES: config_api
UPDATE `sys_objects_page` SET `config_api`='{"layout": "post"}' WHERE `object`='bx_market_view_entry';
UPDATE `sys_pages_blocks` SET `config_api`='{"content_type":"browse_simple"}' WHERE `object`='bx_market_view_entry' AND `title`='_bx_market_page_block_title_entry_author_entries';


-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_create_entry' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_create_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_edit_entry' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_edit_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_delete_entry' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_delete_entry';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_view_entry' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_entry_text';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_view_entry' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_entry_all_actions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_view_entry' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_entry_comments';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_view_entry' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_entry_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_view_entry' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_entry_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_featured' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_featured_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_top' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_top_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_home' AND `module`='bx_market' AND `title_system`='' AND `title`='_bx_market_page_block_title_latest_entries';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_manage' AND `module`='bx_market' AND `title_system`='_bx_market_page_block_title_system_manage' AND `title`='_bx_market_page_block_title_manage';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_market_administration' AND `module`='bx_market' AND `title_system`='_bx_market_page_block_title_system_manage_administration' AND `title`='_bx_market_page_block_title_manage';

-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_market_submenu' AND `module`='bx_market' AND `name`='products-home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_market_submenu' AND `module`='bx_market' AND `name`='products-featured';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_market_submenu' AND `module`='bx_market' AND `name`='products-top';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_market_submenu' AND `module`='bx_market' AND `name`='products-manage';

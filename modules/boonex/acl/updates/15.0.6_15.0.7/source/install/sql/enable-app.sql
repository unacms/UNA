-- PAGES: config_api

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_acl_view' AND `module`='bx_acl' AND `title_system`='_bx_acl_page_block_title_system_view' AND `title`='_bx_acl_page_block_title_view';


-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='bx_acl' AND `name`='acl-view';

-- PAGES: config_api

UPDATE `sys_objects_page` SET `config_api`='{"layout":"messenger"}' WHERE `object`='bx_messenger_main';

-- PAGES: active_api

UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_messenger_main' AND `module`='bx_messenger' AND `title`='_bx_messenger_page_main_messenger_block';

-- MENUS: active_api

UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_messenger_nav_menu' AND `module`='bx_messenger' AND `name`='saved';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_messenger_nav_menu' AND `module`='bx_messenger' AND `name`='reply';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_messenger_nav_menu' AND `module`='bx_messenger' AND `name`='threads';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_messenger_nav_menu' AND `module`='bx_messenger' AND `name`='inbox';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_messenger_nav_menu' AND `module`='bx_messenger' AND `name`='direct';

-- PAGES: config_api

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_notifications_view' AND `module`='bx_notifications' AND `title_system`='' AND `title`='_bx_ntfs_page_block_title_view';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_notifications_settings' AND `module`='bx_notifications' AND `title_system`='' AND `title`='_bx_ntfs_page_block_title_settings';


-- MENUS:

-- MENUS: config_api
UPDATE `sys_menu_items` SET `config_api`='{"badge":"notifications"}' WHERE `set_name`='sys_tabbar' AND `module`='bx_notifications' AND `name`='notifications-view';

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='bx_notifications' AND `name`='notifications-preview';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='bx_notifications' AND `name`='notifications-settings';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_ntfs_submenu' AND `module`='bx_notifications' AND `name`='notifications-view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='bx_notifications' AND `name`='notifications-view';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_notifications_submenu' AND `module`='bx_notifications' AND `name`='notifications-all';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_notifications_preview' AND `module`='bx_notifications' AND `name`='more';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_notifications_settings' AND `module`='bx_notifications' AND `name`='notifications-site';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_notifications_settings' AND `module`='bx_notifications' AND `name`='notifications-email';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_notifications_settings' AND `module`='bx_notifications' AND `name`='notifications-push';

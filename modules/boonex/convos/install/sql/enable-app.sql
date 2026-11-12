-- MENUS: active_api
-- Messages in the apps' menu (sys_apps_menu: the first section of the apps' sidebar, GET /api/v2/navigation)
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_apps_menu' AND `module`='bx_convos' AND `name`='convos-messages';

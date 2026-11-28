-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable.sql of the update pack
-- MENUS
UPDATE `sys_menu_items` SET `icon`='store' WHERE `set_name`='sys_site' AND `module`='bx_market' AND `name`='products-home' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='store' WHERE `set_name`='sys_homepage' AND `module`='bx_market' AND `name`='products-home' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='store' WHERE `set_name`='sys_add_content_links' AND `module`='bx_market' AND `name`='create-product' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='store' WHERE `set_name`='sys_profile_stats' AND `module`='bx_market' AND `name`='profile-stats-my-market' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='store' WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_market' AND `name`='products-administration' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='store' WHERE `set_name`='trigger_profile_view_submenu' AND `module`='bx_market' AND `name`='products-author' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='store' WHERE `set_name`='trigger_group_view_submenu' AND `module`='bx_market' AND `name`='products-context' AND `icon`='shopping-cart';

-- STATS
UPDATE `sys_statistics` SET `icon`='store' WHERE `module`='bx_market' AND `name`='bx_market' AND `icon`='shopping-cart';

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_market' AND `name`='products-home';

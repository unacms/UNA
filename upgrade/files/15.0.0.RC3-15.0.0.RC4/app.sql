--
-- NEO app flags.
-- Difference between the RC3 enable-app snapshots and
-- modules/system/install/sql/enable-app-menus.sql
-- modules/system/install/sql/enable-app-pages.sql
-- Rows these updates target are inserted by sql.sql, which runs first.
--


-- Menus
UPDATE `sys_objects_menu` SET `config_api`='{"icon":"compass"}' WHERE `object`='sys_homepage_submenu';
UPDATE `sys_objects_menu` SET `config_api`='{}' WHERE `object`='sys_ntfs_submenu';
-- Settings: `hub` is the page that lists the section; `group` puts an item under Account or the current profile
UPDATE `sys_objects_menu` SET `config_api`='{"hub":"settings"}' WHERE `object`='sys_account_settings_submenu';
UPDATE `sys_menu_items` SET `config_api`='{"group":"account"}' WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name` IN ('account-profile-switcher', 'account-settings-info', 'account-settings-email', 'account-settings-password');
UPDATE `sys_menu_items` SET `config_api`=IF(`name`='account-settings-delete', '{"group":"danger"}', '{"group":"profile"}') WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name` IN ('profile-settings-cfilter', 'account-settings-delete');
UPDATE `sys_menu_items` SET `config_api`='{"badge":"friends"}' WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='friends';
-- Site menu: Log in and Sign up show as buttons above the other items, in the apps and in UNA's phone sidebar (`primary` picks the prominent one)
UPDATE `sys_menu_items` SET `config_api`='{"button":true}' WHERE `set_name`='sys_site' AND `module`='system' AND `name` IN ('login', 'create-account');

-- UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='home';
-- UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='login';
-- UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='create-account';

-- UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='copyright';
-- UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='switch_language';
-- UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='powered_by';

-- UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_site' AND `module`='system' AND `name`='main-menu';
-- UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='settings';

UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='explore';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='friends';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='about';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='terms';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='privacy';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='dashboard';

-- The main menu item moved from sys_toolbar_member to sys_toolbar_site (the old row is deleted by sql.sql)

-- Pages
UPDATE `sys_pages_blocks` SET `config_api`='{"designbox": {"bg": true, "padding": true, "title": false}}' WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_create_post';
UPDATE `sys_pages_blocks` SET `active_api`=1, `config_api`='{"designbox": {"bg": ["tablet", "desktop"]}}' WHERE `object`='sys_dashboard' AND `module`='system' AND `title_system`='_sys_page_block_title_dash_stats';
UPDATE `sys_pages_blocks` SET `active_api`=1, `config_api`='{\"rounded\": [\"mobile\", \"tablet\", \"desktop\"]}' WHERE `object`='sys_create_account' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_create_account';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_settings' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_settings';

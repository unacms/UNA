-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Site panel menu: three items for the apps' drawer, each another menu: the modules (sys_homepage), the account's own
-- menu (sys_account_notifications) and the footer's links (sys_footer). Off on the site, on in the apps, where
-- `drawer` in the App config keeps them out of the web app's sidebar. sys_menu_items has no unique key on the name,
-- so each is added only while it is missing; an item an operator changed is left as it is. An item's title heads its
-- menu in the apps, so the two member menus that had none get theirs (You, Following).
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `config_api`, `copyable`, `order`)
SELECT 'sys_site_panel', 'system', 'homepage-menu', '_sys_menu_title_homepage', '_apps', '', '', '', '', 'sys_homepage', 2147483647, 0, 1, '{"drawer":true}', 0, 5 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_site_panel' AND `name` = 'homepage-menu');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `config_api`, `copyable`, `order`)
SELECT 'sys_site_panel', 'system', 'account-menu', '_sys_menu_title_account_notifications', '_sys_menu_item_title_account_settings_section_account', '', '', '', '', 'sys_account_notifications', 2147483646, 0, 1, '{"drawer":true}', 0, 6 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_site_panel' AND `name` = 'account-menu');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `config_api`, `copyable`, `order`)
SELECT 'sys_site_panel', 'system', 'footer-menu', '_sys_menu_title_footer', '_sys_menu_item_title_about', '', '', '', '', 'sys_footer', 2147483647, 0, 1, '{"drawer":true}', 0, 7 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_site_panel' AND `name` = 'footer-menu');

UPDATE `sys_menu_items` SET `title` = '_sys_menu_item_title_member_menu' WHERE `set_name` = 'sys_site_panel' AND `module` = 'system' AND `name` = 'member-menu' AND `title` = '';
UPDATE `sys_menu_items` SET `title` = '_sys_menu_item_title_member_followings' WHERE `set_name` = 'sys_site_panel' AND `module` = 'system' AND `name` = 'member-followings' AND `title` = '';

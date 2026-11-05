-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Site menu: Log in and Sign up, for guests on phones, come first and show as buttons, Sign up the primary one.
-- Sites installed before #6200 have no such items, so they get them. Sites that have them get them moved from the end
-- to the top and marked as buttons where the order, the App config and the primary flag are still install SQL's.
-- sys_menu_items has no unique key on the name, so INSERT IGNORE would add them again on every run.
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `hidden_on`, `config_api`, `primary`, `active_api`, `copyable`, `order`)
SELECT 'sys_site', 'system', 'login', '_sys_menu_item_title_system_login', '_sys_menu_item_title_login', 'page.php?i=login', '', '', 'sign-in-alt', '', 1, '6', '{"button":true}', 0, 1, 0, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `module` = 'system' AND `name` = 'login');
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `hidden_on`, `config_api`, `primary`, `active_api`, `copyable`, `order`)
SELECT 'sys_site', 'system', 'create-account', '_sys_menu_item_title_system_join', '_sys_menu_item_title_join', 'page.php?i=create-account', '', '', 'user-plus', '', 1, '6', '{"button":true}', 1, 1, 0, 2 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `module` = 'system' AND `name` = 'create-account');
UPDATE `sys_menu_items` SET `order` = 1 WHERE `set_name` = 'sys_site' AND `module` = 'system' AND `name` = 'login' AND `order` = 10000;
UPDATE `sys_menu_items` SET `order` = 2 WHERE `set_name` = 'sys_site' AND `module` = 'system' AND `name` = 'create-account' AND `order` = 10001;
UPDATE `sys_menu_items` SET `config_api` = '{"button":true}' WHERE `set_name` = 'sys_site' AND `module` = 'system' AND `name` IN ('login', 'create-account') AND `config_api` = '';
UPDATE `sys_menu_items` SET `primary` = 1 WHERE `set_name` = 'sys_site' AND `module` = 'system' AND `name` = 'create-account' AND `primary` = 0 AND `order` = 2;

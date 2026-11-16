-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Guests get Log in and Sign up in the member toolbar (on the site and in the apps), drawn as buttons: the Log in item takes
-- its label, and Sign up is a new item for guests. A site that gave Log in a label of its own keeps it.
UPDATE `sys_menu_items` SET `title`='_sys_menu_item_title_login' WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='login' AND `title`='';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `hidden_on_pt`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_toolbar_member', 'system', 'create-account', '_sys_menu_item_title_system_join', '_sys_menu_item_title_join', 'page.php?i=create-account', '', '', 'user-plus', '', '', 0, 1, 0, 1, 1, 0, 3 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='create-account');

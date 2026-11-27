-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The account menu gets the profile switcher as its item `switch-profile` (link `{switch_profile}`): the apps draw the account's
-- profiles there, the site lists the other profiles in its place (BxBaseMenuAccountNotifications). A menu that already has a
-- `{switch_profile}` item, added in Studio, keeps it and gets no second one.
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_account_notifications', 'system', 'switch-profile', '_sys_menu_item_title_system_switch_profile', '_sys_menu_item_title_switch_profile', '{switch_profile}', '', '', 'users', '', '', 2147483646, 1, 1, 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_account_notifications' AND (`name` = 'switch-profile' OR `link` = '{switch_profile}'));

-- The account popup's own profile list would show the profiles twice on the site: it is off there, the item above takes its place.
UPDATE `sys_menu_items` SET `active` = 0 WHERE `set_name` = 'sys_account_popup' AND `module` = 'system' AND `name` = 'profile-switcher' AND `active` = 1;

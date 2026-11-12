-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- The menu Profile Memberships (sys_profile_memberships) lists the contexts one belongs to, by module: this module's item
-- (Your spaces: the ones one is a member of), in the place of its Profile Following item, on in the apps.
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `collapsed`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_profile_memberships', 'bx_spaces', 'spaces', '_bx_spaces_menu_item_title_system_memberships', '_bx_spaces_menu_item_title_memberships', 'javascript:void(0)', '', '_self', 'object-group', '', '', 2147483646, 0, 1, 1, 0,
    IFNULL((SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_followings' AND `module` = 'bx_spaces' AND `name` = 'spaces' LIMIT 1), 99) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_memberships' AND `module` = 'bx_spaces' AND `name` = 'spaces');

-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Guests don't see the Invitations tab of notifications, whose page is for members.
UPDATE `sys_menu_items` SET `visible_for_levels` = 2147483646 WHERE `set_name` = 'sys_ntfs_submenu' AND `module` = 'system' AND `name` = 'context-invitations' AND `visible_for_levels` = 2147483647;

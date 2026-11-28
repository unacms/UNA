-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Notifications in the apps' menu (sys_apps_menu: the first section of the apps' sidebar, API v2 GET /navigation),
-- between Messages and Connections, with the unread count. The site and API v1 do not read that menu.
-- sys_menu_items has no unique key on the name, so INSERT IGNORE would add it again on every run.
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_menu', 'bx_notifications', 'notifications-view', '_bx_ntfs_menu_item_title_system_notifications', '_bx_ntfs_menu_item_title_notifications', 'page.php?i=notifications-view', '', '', 'bell', 'a:2:{s:6:"module";s:16:"bx_notifications";s:6:"method";s:28:"get_unread_notifications_num";}', '', 2147483646, 1, 1, 1, 5 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_menu' AND `module` = 'bx_notifications' AND `name` = 'notifications-view');

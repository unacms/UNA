-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable.sql of the update pack. The tab is updated, or added when it is missing, instead of deleted and inserted again.
SET @sName = 'bx_notifications';

-- MENUS
UPDATE `sys_menu_items` SET `title_system`='_bx_ntfs_menu_item_title_system_activity', `title`='_bx_ntfs_menu_item_title_activity', `link`='page.php?i=notifications-view', `onclick`='', `target`='', `icon`='bell', `submenu_object`='', `visible_for_levels`=2147483646, `active`=1, `copyable`=1, `order`=4 WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='notifications-view';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) SELECT 'sys_tabbar', @sName, 'notifications-view', '_bx_ntfs_menu_item_title_system_activity', '_bx_ntfs_menu_item_title_activity', 'page.php?i=notifications-view', '', '', 'bell', '', 2147483646, 1, 1, 4
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='notifications-view');

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_menu_items` SET `config_api`='{"badge":"notifications"}' WHERE `set_name`='sys_tabbar' AND `module`='bx_notifications' AND `name`='notifications-view';
UPDATE `sys_menu_items` SET `config_api`='{"group":"profile"}' WHERE `set_name`='sys_account_settings' AND `module`='bx_notifications' AND `name`='notifications-settings';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='bx_notifications' AND `name`='notifications-view';

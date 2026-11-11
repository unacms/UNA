SET @sName = 'bx_notifications';

-- MENUS
DELETE FROM `sys_menu_items` WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='notifications-view';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_tabbar', @sName, 'notifications-view', '_bx_ntfs_menu_item_title_system_activity', '_bx_ntfs_menu_item_title_activity', 'page.php?i=notifications-view', '', '', 'bell', '', 2147483646, 1, 1, 4);

-- MENUS: app settings (enable-app.sql), which an update does not run
UPDATE `sys_menu_items` SET `config_api`='{"badge":"notifications"}', `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='notifications-view';

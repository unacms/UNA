-- Updated, or added when missing, instead of deleted and inserted again: an existing row keeps
-- its app settings (active_api, config_api) and an administrator's choice. An update doesn't run
-- enable-app.sql (#6261), so a row this update adds gets the app settings of enable-app.sql here.
-- One line per statement: executeSQL joins the lines of a statement without a space.
SET @sName = 'bx_notifications';

-- MENUS
SET @bAdded = (SELECT COUNT(*) = 0 FROM `sys_menu_items` WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='notifications-view');
UPDATE `sys_menu_items` SET `title_system`='_bx_ntfs_menu_item_title_system_activity', `title`='_bx_ntfs_menu_item_title_activity', `link`='page.php?i=notifications-view', `onclick`='', `target`='', `icon`='bell', `submenu_object`='', `visible_for_levels`=2147483646, `active`=1, `copyable`=1, `order`=4 WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='notifications-view';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) SELECT 'sys_tabbar', @sName, 'notifications-view', '_bx_ntfs_menu_item_title_system_activity', '_bx_ntfs_menu_item_title_activity', 'page.php?i=notifications-view', '', '', 'bell', '', 2147483646, 1, 1, 4 WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='notifications-view');
UPDATE `sys_menu_items` SET `config_api`='{"badge":"notifications"}', `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='notifications-view' AND @bAdded=1;

SET @sName = 'bx_messenger';

-- MENUS
DELETE FROM `sys_menu_items` WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='messenger';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_tabbar', @sName, 'messenger', '_sys_mobile_mail', '_sys_mobile_mail', 'page.php?i=messenger', '', '', 'message-circle-more', '', 2147483646, 1, 1, 3);

-- MENUS: app settings (enable-app.sql), which an update does not run
UPDATE `sys_menu_items` SET `config_api`='{"badge":"messenger"}', `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='messenger';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`=@sName AND `name`='notifications-messenger';

SET @sName = 'bx_messenger';

-- MENUS
DELETE FROM `sys_menu_items` WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='messenger';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_tabbar', @sName, 'messenger', '_sys_mobile_mail', '_sys_mobile_mail', 'page.php?i=messenger', '', '', 'message-circle-more', '', 2147483646, 1, 1, 3);

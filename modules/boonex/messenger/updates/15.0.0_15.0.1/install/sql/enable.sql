-- Updated, or added when missing, instead of deleted and inserted again: an existing row keeps
-- its app settings (active_api, config_api) and an administrator's choice. An update doesn't run
-- enable-app.sql (#6261), so a row this update adds gets the app settings of enable-app.sql here.
-- One line per statement: executeSQL joins the lines of a statement without a space.
SET @sName = 'bx_messenger';

-- MENUS
SET @bAdded = (SELECT COUNT(*) = 0 FROM `sys_menu_items` WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='messenger');
UPDATE `sys_menu_items` SET `title_system`='_sys_mobile_mail', `title`='_sys_mobile_mail', `link`='page.php?i=messenger', `onclick`='', `target`='', `icon`='message-circle-more', `submenu_object`='', `visible_for_levels`=2147483646, `active`=1, `copyable`=1, `order`=3 WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='messenger';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) SELECT 'sys_tabbar', @sName, 'messenger', '_sys_mobile_mail', '_sys_mobile_mail', 'page.php?i=messenger', '', '', 'message-circle-more', '', 2147483646, 1, 1, 3 WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='messenger');
UPDATE `sys_menu_items` SET `config_api`='{"badge":"messenger"}', `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='messenger' AND @bAdded=1;

-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable.sql of the update pack. The tab is updated, or added when it is missing, instead of deleted and inserted again.
SET @sName = 'bx_messenger';

-- MENUS
UPDATE `sys_menu_items` SET `title_system`='_sys_mobile_mail', `title`='_sys_mobile_mail', `link`='page.php?i=messenger', `onclick`='', `target`='', `icon`='message-circle-more', `submenu_object`='', `visible_for_levels`=2147483646, `active`=1, `copyable`=1, `order`=3 WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='messenger';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) SELECT 'sys_tabbar', @sName, 'messenger', '_sys_mobile_mail', '_sys_mobile_mail', 'page.php?i=messenger', '', '', 'message-circle-more', '', 2147483646, 1, 1, 3
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name`='sys_tabbar' AND `module`=@sName AND `name`='messenger');

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_menu_items` SET `config_api`='{"badge":"messenger"}' WHERE `set_name`='sys_tabbar' AND `module`='bx_messenger' AND `name`='messenger';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='bx_messenger' AND `name`='messenger';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='bx_messenger' AND `name`='notifications-messenger';

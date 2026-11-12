-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Messages in the apps' menu (sys_apps_menu: the first section of the apps' sidebar, API v2 GET /navigation), between
-- Profile and Notifications, with the unread count. The site and API v1 do not read that menu. It steps aside while
-- Messenger is enabled, whose own Messages item takes its place (is_messages_menu_item_shown). sys_menu_items has no
-- unique key on the name, so INSERT IGNORE would add it again on every run.
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_menu', 'bx_convos', 'convos-messages', '_bx_cnv_menu_item_title_system_messages', '_bx_cnv_menu_item_title_messages', 'modules/?r=convos/folder/1', '', '', 'comment', 'a:2:{s:6:"module";s:9:"bx_convos";s:6:"method";s:23:"get_unread_messages_num";}', '', 2147483646, 'a:2:{s:6:"module";s:9:"bx_convos";s:6:"method";s:27:"is_messages_menu_item_shown";}', 1, 1, 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_menu' AND `module` = 'bx_convos' AND `name` = 'convos-messages');

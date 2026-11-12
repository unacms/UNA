-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Messages in the apps' menu (sys_apps_menu: the first section of the apps' sidebar, API v2 GET /navigation), between
-- Profile and Notifications, with the count of updated talks. The site and API v1 do not read that menu.
-- sys_menu_items has no unique key on the name, so INSERT IGNORE would add it again on every run.
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_menu', 'bx_messenger', 'messenger-messages', '_bx_messenger_menu_item_title_system_messages', '_bx_messenger_menu_item_title_messages', 'page.php?i=messenger', '', '', 'message-circle-more', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:20:"get_updated_lots_num";}', '', 2147483646, 1, 1, 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_menu' AND `module` = 'bx_messenger' AND `name` = 'messenger-messages');

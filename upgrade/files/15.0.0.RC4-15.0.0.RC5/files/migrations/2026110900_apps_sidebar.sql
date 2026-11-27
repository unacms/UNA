-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- The apps' sidebar (API v2 GET /navigation) has menus of its own, which the site does not draw and API v1 is not
-- asked for: nothing the site, API v1 or NEO reads is changed. Apps Sidebar (sys_apps_sidebar): each item is a group
-- of the sidebar, its submenu's items under its title. Apps Menu (sys_apps_menu): the first group, one's main places
-- (Home, Explore, Profile, Connections; Conversations, Messenger and Notifications add their items in their own
-- migrations). Public Menu is the site menu as the site has it, headed Browse. Member Menu (the site's Profile Stats)
-- and Member Following are there off, for an owner to turn on. Member Memberships reads Profile Memberships
-- (2026110924_profile_memberships.sql). sys_menu_items has no unique key on the name, so INSERT IGNORE would add a
-- row again on every run.
INSERT INTO `sys_objects_menu` (`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `config_api`, `cache`, `deletable`, `active`, `override_class_name`, `override_class_file`)
SELECT 'sys_apps_sidebar', '_sys_menu_title_apps_sidebar', '', 'sys_apps_sidebar', 'system', 30, '', 'off', 0, 1, 'BxTemplMenuAppsSidebar', '' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_objects_menu` WHERE `object` = 'sys_apps_sidebar');
-- kept per profile: its items have the viewer's own profile link
INSERT INTO `sys_objects_menu` (`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `config_api`, `cache`, `deletable`, `active`, `override_class_name`, `override_class_file`)
SELECT 'sys_apps_menu', '_sys_menu_title_apps_menu', '', 'sys_apps_menu', 'system', 6, '', 'per_user', 0, 1, 'BxTemplMenuAppsMenu', '' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_objects_menu` WHERE `object` = 'sys_apps_menu');

INSERT INTO `sys_menu_sets` (`set_name`, `module`, `title`, `deletable`)
SELECT 'sys_apps_sidebar', 'system', '_sys_menu_set_title_apps_sidebar', 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_sets` WHERE `set_name` = 'sys_apps_sidebar');
INSERT INTO `sys_menu_sets` (`set_name`, `module`, `title`, `deletable`)
SELECT 'sys_apps_menu', 'system', '_sys_menu_set_title_apps_menu', 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_sets` WHERE `set_name` = 'sys_apps_menu');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_sidebar', 'system', 'member-avatar', '_sys_menu_item_title_system_member_avatar', '', '', '', '', '', '', 2147483646, 1, 1, 0, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_sidebar' AND `module` = 'system' AND `name` = 'member-avatar');
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_sidebar', 'system', 'apps-menu', '_sys_menu_item_title_system_apps_menu', '', '', '', '', '', 'sys_apps_menu', 2147483647, 1, 1, 0, 2 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_sidebar' AND `module` = 'system' AND `name` = 'apps-menu');
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_sidebar', 'system', 'public-menu', '_sys_menu_item_title_system_public_menu', '_sys_menu_item_title_public_menu', '', '', '', '', 'sys_site_in_panel', 2147483647, 1, 1, 0, 3 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_sidebar' AND `module` = 'system' AND `name` = 'public-menu');
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_sidebar', 'system', 'member-menu', '_sys_menu_item_title_system_member_menu', '', '', '', '', '', 'sys_profile_stats', 2147483646, 0, 0, 0, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_sidebar' AND `module` = 'system' AND `name` = 'member-menu');
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_sidebar', 'system', 'member-followings', '_sys_menu_item_title_system_member_followings', '_sys_menu_item_title_member_followings', '', '', '', '', 'sys_profile_followings', 2147483646, 0, 0, 0, 5 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_sidebar' AND `module` = 'system' AND `name` = 'member-followings');
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_sidebar', 'system', 'member-memberships', '_sys_menu_item_title_system_member_memberships', '', '', '', '', '', 'sys_profile_memberships', 2147483646, 1, 1, 0, 6 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_sidebar' AND `module` = 'system' AND `name` = 'member-memberships');

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_menu', 'system', 'home', '_sys_menu_item_title_system_home', '_sys_menu_item_title_home', 'page.php?i=home', '', '', 'home', '', '', 2147483647, 1, 1, 0, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_menu' AND `module` = 'system' AND `name` = 'home');
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_menu', 'system', 'explore', '_sys_menu_item_title_system_explore', '_sys_menu_item_title_explore', 'page.php?i=explore', '', '', 'compass', '', '', 2147483647, 1, 1, 0, 2 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_menu' AND `module` = 'system' AND `name` = 'explore');
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_menu', 'system', 'profile', '_sys_menu_item_title_system_profile', '_sys_menu_item_title_profile', '{member_url}', '', '', 'user', '', '', 2147483646, 1, 1, 0, 3 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_menu' AND `module` = 'system' AND `name` = 'profile');
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_apps_menu', 'system', 'connections', '_sys_menu_item_title_system_connections', '_sys_menu_item_title_connections', 'page.php?i=friend-suggestions', '', '', 'users', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:31:"get_unconfirmed_connections_num";s:6:"params";a:1:{i:0;s:20:"sys_profiles_friends";}s:5:"class";s:23:"TemplServiceConnections";}', '', 2147483646, 1, 1, 0, 6 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_menu' AND `module` = 'system' AND `name` = 'connections');

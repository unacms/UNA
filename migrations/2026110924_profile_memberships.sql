-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The new menu Profile Memberships (sys_profile_memberships, BxTemplMenuProfileMemberships) lists the contexts the
-- viewer belongs to, by module (Your friends, Your groups, Your spaces ...): a module's confirmed members, friends for
-- a module without a members connection. The apps' sidebar reads it (API v2 GET /navigation: the Apps Sidebar's item
-- Member Memberships, 2026110900_apps_sidebar.sql); the site's panel and API v1 do not. The modules add their items
-- in their own migrations.
INSERT INTO `sys_objects_menu` (`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`)
SELECT 'sys_profile_memberships', '_sys_menu_title_profile_memberships', 'sys_profile_memberships', 'system', 27, 0, 1, 'BxTemplMenuProfileMemberships', '' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_objects_menu` WHERE `object` = 'sys_profile_memberships');
INSERT INTO `sys_menu_sets` (`set_name`, `module`, `title`, `deletable`)
SELECT 'sys_profile_memberships', 'system', '_sys_menu_set_title_profile_memberships', 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_sets` WHERE `set_name` = 'sys_profile_memberships');

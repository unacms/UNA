-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The dashboard's "Administration" tab is for operators and moderators, as its page is: the apps showed it to every
-- member, and it opened empty.
UPDATE `sys_menu_items` SET `visible_for_levels` = 192 WHERE `set_name` = 'sys_account_dashboard' AND `module` = 'system' AND `name` = 'dashboard-admin' AND `visible_for_levels` = 2147483647;

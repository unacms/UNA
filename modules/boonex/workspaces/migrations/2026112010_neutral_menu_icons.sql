-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The module's items in shared menus (header, account and profile menus, the homepage apps) get the plain icon the
-- other items have, without a colour of their own. An icon the site has changed is left as it is.
UPDATE `sys_menu_items` SET `icon`='users' WHERE `set_name`='sys_account_notifications' AND `module`='bx_workspaces' AND `name`='notifications-friend-requests' AND `icon`='users col-blue3';
UPDATE `sys_menu_items` SET `icon`='sync' WHERE `set_name`='sys_account_notifications' AND `module`='bx_workspaces' AND `name`='notifications-relation-requests' AND `icon`='sync col-blue3';
UPDATE `sys_menu_items` SET `icon`='users' WHERE `set_name`='sys_profile_followings' AND `module`='bx_workspaces' AND `name`='workspaces' AND `icon`='users col-blue3';
UPDATE `sys_menu_items` SET `icon`='users' WHERE `set_name`='sys_profile_stats' AND `module`='bx_workspaces' AND `name`='profile-stats-friend-requests' AND `icon`='users col-blue3';
UPDATE `sys_menu_items` SET `icon`='users' WHERE `set_name`='sys_profile_stats' AND `module`='bx_workspaces' AND `name`='profile-stats-manage-profiles' AND `icon`='users col-blue3';
UPDATE `sys_menu_items` SET `icon`='star' WHERE `set_name`='sys_profile_stats' AND `module`='bx_workspaces' AND `name`='profile-stats-favorite-workspaces' AND `icon`='star col-blue3';
UPDATE `sys_menu_items` SET `icon`='rss' WHERE `set_name`='sys_profile_stats' AND `module`='bx_workspaces' AND `name`='profile-stats-subscriptions' AND `icon`='rss col-blue3';
UPDATE `sys_menu_items` SET `icon`='rss' WHERE `set_name`='sys_profile_stats' AND `module`='bx_workspaces' AND `name`='profile-stats-subscribed-me' AND `icon`='rss col-blue3';
UPDATE `sys_menu_items` SET `icon`='sync' WHERE `set_name`='sys_profile_stats' AND `module`='bx_workspaces' AND `name`='profile-stats-relations' AND `icon`='sync col-blue3';
UPDATE `sys_menu_items` SET `icon`='sync' WHERE `set_name`='sys_profile_stats' AND `module`='bx_workspaces' AND `name`='profile-stats-related-me' AND `icon`='sync col-blue3';

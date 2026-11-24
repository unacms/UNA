-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Profile stats: Friend requests, Following and Followers are off in the apps, as they are on the site, so the
-- member's own menu lists the same items on both. Only rows that still have the shipped value change: an
-- operator's own choice stays.
UPDATE `sys_menu_items` SET `active_api` = 0 WHERE `set_name` = 'sys_profile_stats' AND `module` = 'bx_organizations' AND `name` IN ('profile-stats-friend-requests', 'profile-stats-subscriptions', 'profile-stats-subscribed-me') AND `active_api` = 1;

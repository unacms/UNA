-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Profile stats: My courses is on in the apps too, as on the site (its page, Joined courses, is on in the apps),
-- so the member's own menu lists the same items on both. Only a row that still has the shipped value changes.
UPDATE `sys_menu_items` SET `active_api` = 1 WHERE `set_name` = 'sys_profile_stats' AND `module` = 'bx_courses' AND `name` = 'profile-stats-my-courses' AND `active_api` = 0;

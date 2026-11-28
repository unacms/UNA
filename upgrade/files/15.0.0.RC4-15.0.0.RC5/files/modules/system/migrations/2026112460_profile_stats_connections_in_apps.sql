-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Profile stats: Connections is on in the apps too, as on the site, so the member's own menu lists the same
-- items on both. Only a row that still has the shipped value changes: an operator's own choice stays.
UPDATE `sys_menu_items` SET `active_api` = 1 WHERE `set_name` = 'sys_profile_stats' AND `module` = 'system' AND `name` = 'friend-suggestions' AND `active_api` = 0;

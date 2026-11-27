-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Module titles decided 2026-11-27 (una-vocabulary skill). Names, URIs and prefixes stay.
UPDATE `sys_modules` SET `title` = 'Marketplace' WHERE `name` = 'bx_market' AND `title` = 'Market';
UPDATE `sys_modules` SET `title` = 'Map' WHERE `name` = 'bx_mapshow' AND `title` = 'Map Show';
UPDATE `sys_modules` SET `title` = 'Guest follow' WHERE `name` = 'bx_anon_follow' AND `title` = 'Anonymous Follow';
UPDATE `sys_modules` SET `title` = 'Unread comments' WHERE `name` = 'bx_new_comments' AND `title` = 'New Comments';
UPDATE `sys_modules` SET `title` = 'Guided tours' WHERE `name` = 'bx_help_tours' AND `title` = 'Help Tours';
UPDATE `sys_modules` SET `title` = 'Live' WHERE `name` = 'bx_stream' AND `title` = 'Stream';
UPDATE `sys_modules` SET `title` = 'Microsoft Connect' WHERE `name` = 'bx_azrcon' AND `title` = 'Azure AD Connect';
UPDATE `sys_modules` SET `title` = 'X Connect' WHERE `name` = 'bx_twitter' AND `title` = 'Twitter connect';

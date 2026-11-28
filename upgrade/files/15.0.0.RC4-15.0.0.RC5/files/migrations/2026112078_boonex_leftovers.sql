-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- BoonEx leftovers: the RSS object of a boonex.com feed that no longer exists (its class is
-- removed), help links on feed.boonex.com, and Messenger's vendor.
DELETE FROM `sys_objects_rss` WHERE `object` = 'sys_boonex' AND `class_name` = 'BxDolRssBoonEx';
UPDATE `sys_modules` SET `help_url` = 'http://feed.una.io/?section={module_name}' WHERE `name` IN ('bx_anon_follow', 'bx_new_comments') AND `help_url` = 'http://feed.boonex.com/?section={module_name}';
UPDATE `sys_modules` SET `vendor` = 'UNA INC' WHERE `name` = 'bx_messenger' AND `vendor` = 'BoonEx';

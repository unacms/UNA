-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Studio > Designer > Splash: a switch and an optional code field for each app (web, iOS, Android).
-- sys_options has a unique key on the name, so INSERT IGNORE adds each option once.
SET @iCategoryId = (SELECT `id` FROM `sys_options_categories` WHERE `name` = 'system' LIMIT 1);
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_site_splash_web_enabled', '', '', 'checkbox', '', '', '', 26),
(@iCategoryId, 'sys_site_splash_ios_enabled', '', '', 'checkbox', '', '', '', 26),
(@iCategoryId, 'sys_site_splash_android_enabled', '', '', 'checkbox', '', '', '', 26),
(@iCategoryId, 'sys_site_splash_code_web', '', '', 'text', '', '', '', 26),
(@iCategoryId, 'sys_site_splash_code_ios', '', '', 'text', '', '', '', 26),
(@iCategoryId, 'sys_site_splash_code_android', '', '', 'text', '', '', '', 26);
-- The apps showed the splash when sys_api_root_page_guest was 'splash', so the switches start from it. A switch that
-- was saved already ('on' or 'off') keeps the operator's choice.
SET @sGuestRoot = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_api_root_page_guest' LIMIT 1);
UPDATE `sys_options` SET `value` = IF(@sGuestRoot = 'splash', 'on', 'off')
WHERE `name` IN ('sys_site_splash_web_enabled', 'sys_site_splash_ios_enabled', 'sys_site_splash_android_enabled') AND `value` = '';

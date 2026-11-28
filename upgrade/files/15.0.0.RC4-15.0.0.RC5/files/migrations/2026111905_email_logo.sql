-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Designer > Logo > Email logo: a light and a dark mode logo for the email header, files of sys_images_custom.
-- sys_options has a unique key on the name, so INSERT IGNORE adds each option once and keeps an admin's own value.

SET @iCategoryId = (SELECT `id` FROM `sys_options_categories` WHERE `name` = 'system' LIMIT 1);
INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_site_logo_email', '', '0', 'digit', '', '', '', 25),
(@iCategoryId, 'sys_site_logo_email_dark', '', '0', 'digit', '', '', '', 25);

-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Designer > Icon: an optional favicon for dark browser tabs (SVG or PNG), next to sys_site_icon and sys_site_icon_svg.
-- sys_options has a unique key on the name, so INSERT IGNORE adds the option once.
SET @iCategoryId = (SELECT `id` FROM `sys_options_categories` WHERE `name` = 'system' LIMIT 1);
INSERT IGNORE INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_site_icon_dark', '', '0', 'digit', '', '', '', 16);

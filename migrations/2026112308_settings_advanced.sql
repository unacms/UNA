-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Settings: Global keeps what the operator sets up first (Site, Account, Security...); the server settings
-- (System, Cache, Permalinks, Storage, Push notifications, SMS, Sockets) move to a new Advanced page next to it.
-- Studio > API > Settings: the API v2 switches and limits move to an "API v2 preview" section, and Search sections
-- becomes a list of the site's search sections instead of raw names. Option names and values stay as they are.

INSERT IGNORE INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES
('system', 'advanced', '_adm_stg_cpt_type_advanced', 'mi-server-cog.svg', 2);

SET @iTypeSystem = (SELECT `id` FROM `sys_options_types` WHERE `name` = 'system' LIMIT 1);
SET @iTypeAdvanced = (SELECT `id` FROM `sys_options_types` WHERE `name` = 'advanced' LIMIT 1);

UPDATE `sys_options_categories` SET `type_id` = @iTypeAdvanced
WHERE `name` IN ('general', 'cache', 'permalinks', 'storage', 'notifications_push', 'sms', 'sockets') AND `type_id` = @iTypeSystem;

-- Security after Notifications, so Account comes right after Site.
UPDATE `sys_options_categories` SET `order` = 19 WHERE `name` = 'security' AND `type_id` = @iTypeSystem AND `order` = 11;

-- API v2 preview
INSERT IGNORE INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`) VALUES
(@iTypeSystem, 'api_preview', '_adm_stg_cpt_category_api_preview', 1, 4);

SET @iCategoryApiGeneral = (SELECT `id` FROM `sys_options_categories` WHERE `name` = 'api_general' LIMIT 1);
SET @iCategoryApiPreview = (SELECT `id` FROM `sys_options_categories` WHERE `name` = 'api_preview' LIMIT 1);

UPDATE `sys_options` SET `category_id` = @iCategoryApiPreview
WHERE `name` IN ('sys_api_v2_enable', 'sys_api_v2_rate_limit', 'sys_api_v2_rate_limit_general', 'sys_api_v2_rate_limit_write', 'sys_api_v2_rate_limit_search', 'sys_api_v2_rate_limit_preview', 'sys_api_v2_rate_limit_agent', 'sys_api_v2_rate_limit_upload')
AND `category_id` = @iCategoryApiGeneral;

UPDATE `sys_options` SET `type` = 'list', `extra` = 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:31:"get_options_api_search_sections";s:5:"class";s:13:"TemplServices";}'
WHERE `name` = 'sys_api_search_sections' AND `type` = 'digit';

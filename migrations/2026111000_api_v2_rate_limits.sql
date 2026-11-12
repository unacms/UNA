-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- API v2 rate limits (BxDolApiV2RateLimit): the requests of a subject counted in a bucket's current window.
-- subject: a keyed sha256 of the profile or of a guest's address; started: when the window began; hits stops one above the limit.
CREATE TABLE IF NOT EXISTS `sys_api_rate_limits` (
  `subject` binary(32) NOT NULL,
  `bucket` varchar(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `started` int(10) unsigned NOT NULL,
  `hits` int(10) unsigned NOT NULL,
  PRIMARY KEY (`subject`, `bucket`),
  KEY `started` (`started`)
) ENGINE=InnoDB;

-- The switch and each bucket's limit, requests a minute (Studio > API > Settings). sys_options has a unique key on the
-- name, so INSERT IGNORE is safe to run again and leaves an admin's own value alone.
INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_api_v2_rate_limit', '_adm_stg_cpt_option_sys_api_v2_rate_limit', 'on', 'checkbox', '', '', '', 60
FROM `sys_options_categories` WHERE `name` = 'api_general';

INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_api_v2_rate_limit_general', '_adm_stg_cpt_option_sys_api_v2_rate_limit_general', '600', 'digit', '', '', '', 61
FROM `sys_options_categories` WHERE `name` = 'api_general';

INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_api_v2_rate_limit_write', '_adm_stg_cpt_option_sys_api_v2_rate_limit_write', '120', 'digit', '', '', '', 62
FROM `sys_options_categories` WHERE `name` = 'api_general';

INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_api_v2_rate_limit_search', '_adm_stg_cpt_option_sys_api_v2_rate_limit_search', '120', 'digit', '', '', '', 63
FROM `sys_options_categories` WHERE `name` = 'api_general';

INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_api_v2_rate_limit_preview', '_adm_stg_cpt_option_sys_api_v2_rate_limit_preview', '30', 'digit', '', '', '', 64
FROM `sys_options_categories` WHERE `name` = 'api_general';

INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_api_v2_rate_limit_agent', '_adm_stg_cpt_option_sys_api_v2_rate_limit_agent', '20', 'digit', '', '', '', 65
FROM `sys_options_categories` WHERE `name` = 'api_general';

INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_api_v2_rate_limit_upload', '_adm_stg_cpt_option_sys_api_v2_rate_limit_upload', '120', 'digit', '', '', '', 66
FROM `sys_options_categories` WHERE `name` = 'api_general';

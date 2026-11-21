-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Defaults for a new site (WP10). Each option changes only where it still has the old default,
-- so a value the operator chose stays.

-- Logs: errors only, DEBUG wrote every query and request on production sites.
UPDATE `sys_options` SET `value` = 'ERROR' WHERE `name` = 'sys_logs_level' AND `value` = 'DEBUG';

-- Outgoing requests give up after 30 s instead of holding a PHP worker for 5 minutes. Downloads of
-- files and packages have their own timeout in code (BX_DOL_FILE_TRANSFER_TIMEOUT).
UPDATE `sys_options` SET `value` = '30' WHERE `name` = 'sys_default_curl_timeout' AND `value` = '300';

-- "Alerts/hooks logger" was never read by any code.
DELETE FROM `sys_options` WHERE `name` = 'sys_alerts_logger';

-- Dates and times follow the visitor's language: Nov 21, 2026 / 2:30 PM in English, 21 нояб. 2026 г. / 14:30 in Russian.
UPDATE `sys_options` SET `value` = 'll' WHERE `name` = 'sys_format_date' AND `value` = 'D MMM YYYY';
UPDATE `sys_options` SET `value` = 'LT' WHERE `name` = 'sys_format_time' AND `value` = 'HH:mm';
UPDATE `sys_options` SET `value` = 'lll' WHERE `name` = 'sys_format_datetime' AND `value` = 'D MMM YYYY h:mm:ss a';

-- Videos start in HD.
UPDATE `sys_options` SET `value` = 'hd' WHERE `name` = 'sys_player_default_format' AND `value` = 'sd';

-- S3: signature v4 and no object ACLs, as new AWS buckets require. Only where S3 is not set up
-- (no access key), so a working storage is never switched.
UPDATE `sys_options` SET `value` = 'v4' WHERE `name` = 'sys_storage_s3_sig_ver' AND `value` = 'v2'
AND NOT EXISTS (SELECT 1 FROM (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_s3_access_key') AS `k` WHERE `k`.`value` <> '');
UPDATE `sys_options` SET `value` = '' WHERE `name` = 'sys_storage_s3_acl_enable' AND `value` = 'on'
AND NOT EXISTS (SELECT 1 FROM (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_s3_access_key') AS `k` WHERE `k`.`value` <> '');

-- Interface sounds are for members: guests hear none, and guest pages don't load Cuelume, unless
-- the operator turns them on for guests.
INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_sounds_guests', '_adm_stg_cpt_option_sys_sounds_guests', '_adm_stg_inf_option_sys_sounds_guests', '', 'checkbox', '', '', '', 5
FROM `sys_options_categories` WHERE `name` = 'sounds' LIMIT 1;

-- Studio help: the feed it read (feed.una.io) is gone and the Help button was hidden. Its RSS
-- objects and their classes are removed, and modules no longer point at the feed.
DELETE FROM `sys_objects_rss` WHERE `object` IN ('sys_studio_page_help', 'sys_studio_module_help');
UPDATE `sys_modules` SET `help_url` = '' WHERE `help_url` IN ('http://feed.una.io/?section={module_name}', 'http://feed.boonex.com/?section={module_name}');

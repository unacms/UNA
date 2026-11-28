-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- API v2 is a preview with its own switch (Studio > API > Settings), off as installed: /api/v2 answers 503
-- api_v2_disabled until an operator turns it on. sys_options has a unique key on the name, so INSERT IGNORE
-- is safe to run again and leaves an operator's own value alone.
INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_api_v2_enable', '_adm_stg_cpt_option_sys_api_v2_enable', '', 'checkbox', '', '', '', 59
FROM `sys_options_categories` WHERE `name` = 'api_general';

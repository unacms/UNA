-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Security settings: upload security tokens. sys_options has a unique key on the name, so
-- INSERT IGNORE is safe to run again and leaves an admin's own value alone.
INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_security_upload_token_enable', '_adm_stg_cpt_option_sys_security_upload_token_enable', 'on', 'checkbox', '', '', '', 12
FROM `sys_options_categories` WHERE `name` = 'security';

INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_security_upload_token_lifetime', '_adm_stg_cpt_option_sys_security_upload_token_lifetime', '21600', 'digit', '', '', '', 13
FROM `sys_options_categories` WHERE `name` = 'security';

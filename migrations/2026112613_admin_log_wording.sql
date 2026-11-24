-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Audit > Settings: the Studio log retention says "0 = no limit" in its caption, so it has no description.

UPDATE `sys_options` SET `info` = '' WHERE `name` = 'sys_admin_log_days_before_expire' AND `info` = '_adm_stg_inf_option_sys_admin_log_days_before_expire';

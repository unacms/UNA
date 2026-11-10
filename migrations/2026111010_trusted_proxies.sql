-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Studio > Settings > Security: the public proxies and CDNs in front of the site (getVisitorIP reads proxy
-- headers only from them and from private addresses). sys_options has a unique key on the name.
INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_trusted_proxies', '_adm_stg_cpt_option_sys_trusted_proxies', '_adm_stg_inf_option_sys_trusted_proxies', '', 'text', '', '', '', 60
FROM `sys_options_categories` WHERE `name` = 'security' LIMIT 1;

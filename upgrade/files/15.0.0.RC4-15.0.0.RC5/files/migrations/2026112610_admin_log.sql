-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Audit: a journal of what administrators and agents change.
-- Separate from sys_audit. 0 days means the rows are kept.

CREATE TABLE IF NOT EXISTS `sys_admin_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `added` int(11) NOT NULL,
  `profile_id` int(11) NOT NULL DEFAULT 0,
  `source` enum('studio','agent','api','cli') NOT NULL DEFAULT 'studio',
  `agent_id` int(11) NOT NULL DEFAULT 0,
  `thread_id` varchar(255) NOT NULL DEFAULT '',
  `object_type` varchar(128) NOT NULL DEFAULT '',
  `object_id` varchar(255) NOT NULL DEFAULT '',
  `action` varchar(64) NOT NULL DEFAULT '',
  `before` longtext NOT NULL,
  `after` longtext NOT NULL,
  `ip` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `added` (`added`),
  KEY `profile_id` (`profile_id`),
  KEY `source` (`source`),
  KEY `object_type` (`object_type`)
);

INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_admin_log_enable', '_adm_stg_cpt_option_sys_admin_log_enable', '_adm_stg_inf_option_sys_admin_log_enable', 'on', 'checkbox', '', '', '', 5
FROM `sys_options_categories` WHERE `name` = 'audit';

INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_admin_log_days_before_expire', '_adm_stg_cpt_option_sys_admin_log_days_before_expire', '_adm_stg_inf_option_sys_admin_log_days_before_expire', '365', 'digit', '', '', '', 6
FROM `sys_options_categories` WHERE `name` = 'audit';

INSERT IGNORE INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `override_class_name`, `override_class_file`) VALUES
('sys_admin_log_administration', 'Sql', 'SELECT * FROM `sys_admin_log` WHERE 1 ', 'sys_admin_log', 'id', 'added', '', '', 20, NULL, 'start', '', 'object_type', '', 'like', 'added', '', 'BxTemplStudioAdminLogGrid', '');

INSERT IGNORE INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('sys_admin_log_administration', 'added', '_adm_form_txt_admin_log_added', '14%', 0, 0, '', 1),
('sys_admin_log_administration', 'profile_id', '_adm_form_txt_admin_log_profile', '16%', 0, 24, '', 2),
('sys_admin_log_administration', 'source', '_adm_form_txt_admin_log_source', '12%', 0, 16, '', 3),
('sys_admin_log_administration', 'agent_id', '_adm_form_txt_admin_log_agent', '14%', 0, 20, '', 4),
('sys_admin_log_administration', 'object_type', '_adm_form_txt_admin_log_object', '16%', 0, 24, '', 5),
('sys_admin_log_administration', 'object_id', '_adm_form_txt_admin_log_object_id', '14%', 0, 24, '', 6),
('sys_admin_log_administration', 'action', '_adm_form_txt_admin_log_action', '14%', 0, 16, '', 7);

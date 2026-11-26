-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Tasks: the prefix of task numbers on the Settings of a community's tasks, the prefix of tasks in no
-- community, and the alerts which make a task's SEO link its number (view-task/una-12) and lead a
-- link with a former prefix to the task. As install.sql and enable.sql have them.
INSERT IGNORE INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_tasks_context', 'bx_tasks', 'prefix', '', '', 0, 'text', '_bx_tasks_form_context_input_sys_prefix', '_bx_tasks_form_context_input_prefix', '_bx_tasks_form_context_input_prefix_info', 1, 0, 0, '', '', '', 'Preg', 'a:1:{s:4:"preg";s:28:"/^[A-Za-z][A-Za-z0-9]{1,9}$/";}', '_bx_tasks_form_context_input_prefix_err', '', '', 0, 0);

INSERT IGNORE INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_tasks_context_edit', 'prefix', 2147483647, 1, 0);

SET @iCategId = (SELECT `id` FROM `sys_options_categories` WHERE `name` = 'bx_tasks' LIMIT 1);
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`)
SELECT 'bx_tasks_personal_prefix', 'TASK', @iCategId, '_bx_tasks_option_personal_prefix', 'value', 'Preg', 'a:1:{s:4:"preg";s:28:"/^[A-Za-z][A-Za-z0-9]{1,9}$/";}', '_bx_tasks_option_personal_prefix_err', '', 45 FROM DUAL
WHERE @iCategId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `sys_options` WHERE `name` = 'bx_tasks_personal_prefix');

SET @iHandler = (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = 'bx_tasks' LIMIT 1);
INSERT IGNORE INTO `sys_alerts` (`unit`, `action`, `handler_id`)
SELECT 'system', 'uri_generate', @iHandler FROM DUAL WHERE @iHandler IS NOT NULL;
INSERT IGNORE INTO `sys_alerts` (`unit`, `action`, `handler_id`)
SELECT 'system', 'seo_link_not_found', @iHandler FROM DUAL WHERE @iHandler IS NOT NULL;

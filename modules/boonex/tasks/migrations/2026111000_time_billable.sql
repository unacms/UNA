-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Tasks: the switcher for the billable flag of time entries (the column is 2026111003) in the Log forms and a column in the time grids.
INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`)
SELECT 'bx_tasks_time', 'bx_tasks', 'billable', '1', '', 1, 'switcher', '_bx_tasks_form_time_input_sys_billable', '_bx_tasks_form_time_input_billable', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_form_inputs` WHERE `object` = 'bx_tasks_time' AND `name` = 'billable');

-- the switcher goes before the controls: move them down one place, once
UPDATE `sys_form_display_inputs` SET `order` = `order` + 1 WHERE `display_name` = 'bx_tasks_time_add' AND `input_name` IN ('controls', 'submit', 'cancel') AND `order` IN (10, 11, 12)
AND NOT EXISTS (SELECT 1 FROM (SELECT `id` FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_tasks_time_add' AND `input_name` = 'billable') AS `t`);
INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`)
SELECT 'bx_tasks_time_add', 'billable', 2147483647, 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_tasks_time_add' AND `input_name` = 'billable');

UPDATE `sys_form_display_inputs` SET `order` = `order` + 1 WHERE `display_name` = 'bx_tasks_time_edit' AND `input_name` IN ('controls', 'submit', 'cancel') AND `order` IN (7, 8, 9)
AND NOT EXISTS (SELECT 1 FROM (SELECT `id` FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_tasks_time_edit' AND `input_name` = 'billable') AS `t`);
INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`)
SELECT 'bx_tasks_time_edit', 'billable', 2147483647, 1, 7 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_tasks_time_edit' AND `input_name` = 'billable');

-- grids: the Billable column before the Date, the widths it takes from
UPDATE `sys_grid_fields` SET `order` = `order` + 1 WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'value_date' AND `order` = 8;
UPDATE `sys_grid_fields` SET `width` = '14%' WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'author_id' AND `width` = '18%';
UPDATE `sys_grid_fields` SET `width` = '11%' WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'text' AND `width` = '15%';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT 'bx_tasks_time_administration', 'billable', '_bx_tasks_grid_column_title_tm_billable', '8%', 0, 0, '', 8 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'billable');

UPDATE `sys_grid_fields` SET `order` = `order` + 1 WHERE `object` = 'bx_tasks_time_common' AND `name` = 'value_date' AND `order` = 7;
UPDATE `sys_grid_fields` SET `width` = '19%' WHERE `object` = 'bx_tasks_time_common' AND `name` = 'object_id' AND `width` = '23%';
UPDATE `sys_grid_fields` SET `width` = '16%' WHERE `object` = 'bx_tasks_time_common' AND `name` = 'text' AND `width` = '20%';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT 'bx_tasks_time_common', 'billable', '_bx_tasks_grid_column_title_tm_billable', '8%', 0, 0, '', 7 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'bx_tasks_time_common' AND `name` = 'billable');

UPDATE `sys_grid_fields` SET `order` = `order` + 1 WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'value_date' AND `order` = 6;
UPDATE `sys_grid_fields` SET `width` = '24%' WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'author_id' AND `width` = '28%';
UPDATE `sys_grid_fields` SET `width` = '26%' WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'object_id' AND `width` = '30%';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT 'bx_tasks_time_context_administration', 'billable', '_bx_tasks_grid_column_title_tm_billable', '8%', 0, 0, '', 6 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'billable');

UPDATE `sys_grid_fields` SET `order` = `order` + 1 WHERE `object` = 'bx_tasks_time_context_common' AND `name` IN ('value_date', 'actions') AND `order` IN (5, 6)
AND NOT EXISTS (SELECT 1 FROM (SELECT `id` FROM `sys_grid_fields` WHERE `object` = 'bx_tasks_time_context_common' AND `name` = 'billable') AS `t`);
UPDATE `sys_grid_fields` SET `width` = '26%' WHERE `object` = 'bx_tasks_time_context_common' AND `name` = 'object_id' AND `width` = '30%';
UPDATE `sys_grid_fields` SET `width` = '21%' WHERE `object` = 'bx_tasks_time_context_common' AND `name` = 'text' AND `width` = '25%';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT 'bx_tasks_time_context_common', 'billable', '_bx_tasks_grid_column_title_tm_billable', '8%', 0, 0, '', 5 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'bx_tasks_time_context_common' AND `name` = 'billable');

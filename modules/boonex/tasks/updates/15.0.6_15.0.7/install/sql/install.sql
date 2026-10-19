-- STORAGES
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

DELETE FROM `sys_objects_storage` WHERE `object` = 'bx_tasks_files_cmts';
INSERT INTO `sys_objects_storage` (`object`, `engine`, `params`, `token_life`, `cache_control`, `levels`, `table_files`, `ext_mode`, `ext_allow`, `ext_deny`, `quota_size`, `current_size`, `quota_number`, `current_number`, `max_file_size`, `ts`) VALUES
('bx_tasks_files_cmts', @sStorageEngine, '', 360, 2592000, 3, 'bx_tasks_files', 'deny-allow', '', '{dangerous}', 0, 0, 0, 0, 0, 0);

-- FORMS
UPDATE `sys_form_inputs` SET `checked`='2' WHERE `object`='bx_tasks' AND `name`='state';

DELETE FROM `sys_form_display_inputs` WHERE `display_name`='bx_tasks_entry_add' AND `input_name`='state';
INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_tasks_entry_add', 'state', 192, 1, 10);

UPDATE `sys_form_display_inputs` SET `order`='11' WHERE `display_name`='bx_tasks_entry_add' AND `input_name`='controls';
UPDATE `sys_form_display_inputs` SET `order`='12' WHERE `display_name`='bx_tasks_entry_add' AND `input_name`='do_publish';
UPDATE `sys_form_display_inputs` SET `order`='13' WHERE `display_name`='bx_tasks_entry_add' AND `input_name`='do_cancel';

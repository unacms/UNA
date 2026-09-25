-- STORAGES
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

DELETE FROM `sys_objects_storage` WHERE `object` = 'bx_tasks_files_cmts';
INSERT INTO `sys_objects_storage` (`object`, `engine`, `params`, `token_life`, `cache_control`, `levels`, `table_files`, `ext_mode`, `ext_allow`, `ext_deny`, `quota_size`, `current_size`, `quota_number`, `current_number`, `max_file_size`, `ts`) VALUES
('bx_tasks_files_cmts', @sStorageEngine, '', 360, 2592000, 3, 'bx_tasks_files', 'deny-allow', '', '{dangerous}', 0, 0, 0, 0, 0, 0);

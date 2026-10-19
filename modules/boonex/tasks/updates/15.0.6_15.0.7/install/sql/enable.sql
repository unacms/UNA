-- SETTINGS
SET @iTypeId = (SELECT `id` FROM `sys_options_types` WHERE `name`='bx_tasks' LIMIT 1);

DELETE FROM `sys_options_categories` WHERE `name`='bx_tasks_export';
INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`) VALUES (@iTypeId, 'bx_tasks_export', '_bx_tasks_options_category_export', 2);
SET @iCategId = LAST_INSERT_ID();

DELETE FROM `sys_options` WHERE `name` IN ('bx_tasks_export_time_to', 'bx_tasks_export_time_fields');
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_tasks_export_time_to', 'csv', @iCategId, '_bx_tasks_option_export_time_to', 'select', '', '', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:26:"get_options_export_time_to";}', 10),
('bx_tasks_export_time_fields', 'author_id,object_id,value,value_date', @iCategId, '_bx_tasks_option_export_time_fields', 'list', '', '', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:30:"get_options_export_time_fields";}', 12);

-- PAGES & BLOCKS
DELETE FROM `sys_pages_blocks` WHERE `object`='bx_tasks_context_time_administration' AND `module`='bx_tasks' AND `title_system`='_bx_tasks_page_block_title_sys_entries_budget_in_context_summary' AND `title`='_bx_tasks_page_block_title_entries_budget_in_context_summary';
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_tasks_context_time_administration', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_entries_budget_in_context_summary', '_bx_tasks_page_block_title_entries_budget_in_context_summary', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:16:"get_block_budget";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 2);

-- GRIDS
UPDATE `sys_objects_grid` SET `paginate_per_page`='20' WHERE `object` IN ('bx_tasks_time_context_administration', 'bx_tasks_time_context_common');

DELETE FROM `sys_grid_actions` WHERE `object` IN ('bx_tasks_time_context_administration', 'bx_tasks_time_context_common') AND `type`='bulk' AND `name`='export';
INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_tasks_time_context_administration', 'bulk', 'export', '_bx_tasks_grid_action_title_tm_export', '', 0, 0, 2),
('bx_tasks_time_context_common', 'bulk', 'export', '_bx_tasks_grid_action_title_tm_export', '', 0, 0, 2);

UPDATE `sys_grid_actions` SET `order`='3' WHERE `object` IN ('bx_tasks_time_context_administration', 'bx_tasks_time_context_common') AND `type`='bulk' AND `name`='delete';

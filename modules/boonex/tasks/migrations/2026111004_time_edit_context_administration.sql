-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Tasks: administrators of a context edit time entries in its time grid, as the members do in theirs.
INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`)
SELECT 'bx_tasks_time_context_administration', 'single', 'edit', '_bx_tasks_grid_action_title_tm_edit', 'pencil-alt', 1, 0, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_actions` WHERE `object` = 'bx_tasks_time_context_administration' AND `type` = 'single' AND `name` = 'edit');

-- the column the Edit button sits in: widths from the author and the task
UPDATE `sys_grid_fields` SET `width` = '20%' WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'author_id' AND `width` = '24%';
UPDATE `sys_grid_fields` SET `width` = '22%' WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'object_id' AND `width` = '26%';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT 'bx_tasks_time_context_administration', 'actions', '', '8%', 0, '', '', 8 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'actions');

-- the logged time by person block on the page the context administrators open
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'bx_tasks_context_time_administration', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_context_time_summary', '_bx_tasks_page_block_title_timers_stats', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:30:"get_block_time_summary_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 1, 1, 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'bx_tasks_context_time_administration' AND `module` = 'bx_tasks' AND `title_system` = '_bx_tasks_page_block_title_system_context_time_summary');

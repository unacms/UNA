-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Tasks: logged time by person on the task page and on the context time page, shown in the apps.
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'bx_tasks_view_entry', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_entry_time_summary', '_bx_tasks_page_block_title_timers_stats', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:22:\"get_block_time_summary\";}', 0, 0, 1, 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'bx_tasks_view_entry' AND `module` = 'bx_tasks' AND `title_system` = '_bx_tasks_page_block_title_system_entry_time_summary');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'bx_tasks_context_time', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_context_time_summary', '_bx_tasks_page_block_title_timers_stats', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:30:"get_block_time_summary_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 1, 1, 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'bx_tasks_context_time' AND `module` = 'bx_tasks' AND `title_system` = '_bx_tasks_page_block_title_system_context_time_summary');

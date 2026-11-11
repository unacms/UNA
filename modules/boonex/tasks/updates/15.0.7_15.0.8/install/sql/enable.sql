-- PAGES & BLOCKS
DELETE FROM `sys_pages_blocks` WHERE `object`='bx_tasks_timers' AND `module`='bx_tasks' AND `title_system`='_bx_tasks_page_block_title_system_timers_stats' AND `title`='_bx_tasks_page_block_title_timers_stats';
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_tasks_timers', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_timers_stats', '_bx_tasks_page_block_title_timers_stats', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:22:"get_block_timers_stats";}', 0, 1, 1);

-- PAGES: app settings (enable-app.sql), which an update does not run
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_tasks_timers' AND `module`='bx_tasks' AND `title_system`='_bx_tasks_page_block_title_system_timers_stats' AND `title`='_bx_tasks_page_block_title_timers_stats';

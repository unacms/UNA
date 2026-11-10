-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Tasks: Edit in the time grids of the site (Manage Time), for the administrators of the site and for the members on their own entries.

-- bx_tasks_time_administration: widths for the column of the Edit button
UPDATE `sys_grid_fields` SET `width` = '12%' WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'context_id' AND `width` = '15%';
UPDATE `sys_grid_fields` SET `width` = '12%' WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'object_id' AND `width` = '15%';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT 'bx_tasks_time_administration', 'actions', '', '8%', 0, '', '', 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'actions');
INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`)
SELECT 'bx_tasks_time_administration', 'single', 'edit', '_bx_tasks_grid_action_title_tm_edit', 'pencil-alt', 1, 0, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_actions` WHERE `object` = 'bx_tasks_time_administration' AND `type` = 'single' AND `name` = 'edit');
UPDATE `sys_grid_fields` SET `width` = '12%' WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'author_id' AND `width` = '14%';

-- bx_tasks_time_common: widths for the column of the Edit button
UPDATE `sys_grid_fields` SET `width` = '16%' WHERE `object` = 'bx_tasks_time_common' AND `name` = 'context_id' AND `width` = '20%';
UPDATE `sys_grid_fields` SET `width` = '15%' WHERE `object` = 'bx_tasks_time_common' AND `name` = 'object_id' AND `width` = '19%';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT 'bx_tasks_time_common', 'actions', '', '8%', 0, '', '', 9 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = 'bx_tasks_time_common' AND `name` = 'actions');
INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`)
SELECT 'bx_tasks_time_common', 'single', 'edit', '_bx_tasks_grid_action_title_tm_edit', 'pencil-alt', 1, 0, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_actions` WHERE `object` = 'bx_tasks_time_common' AND `type` = 'single' AND `name` = 'edit');

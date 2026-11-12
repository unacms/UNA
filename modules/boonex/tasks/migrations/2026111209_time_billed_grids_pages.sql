-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Tasks: Logged and Billed time. The Billable switcher of the time forms and the Billable column of the time grids go,
-- the grids get Total, Manual and Billed columns (their rows are the ones of enable.sql), the Billing page and tab are added,
-- the budget summary moves, My Time gets the viewer's own time, and a cron pauses the timers left running.

-- forms: Billed time is set per entry in the time grids
DELETE FROM `sys_form_display_inputs` WHERE `display_name` IN ('bx_tasks_time_add', 'bx_tasks_time_edit') AND `input_name` = 'billable';
DELETE FROM `sys_form_inputs` WHERE `object` = 'bx_tasks_time' AND `name` = 'billable';

-- grids: Billable becomes Billed. A grid that has both (the earlier migration ran again) keeps the Billed row.
DELETE `b` FROM `sys_grid_fields` AS `b` INNER JOIN `sys_grid_fields` AS `v` ON `v`.`object` = `b`.`object` AND `v`.`name` = 'value_billed'
WHERE `b`.`name` = 'billable' AND `b`.`object` IN ('bx_tasks_time_administration', 'bx_tasks_time_common', 'bx_tasks_time_context_administration', 'bx_tasks_time_context_common');
UPDATE `sys_grid_fields` SET `name` = 'value_billed', `title` = '_bx_tasks_grid_column_title_tm_value_billed'
WHERE `name` = 'billable' AND `object` IN ('bx_tasks_time_administration', 'bx_tasks_time_common', 'bx_tasks_time_context_administration', 'bx_tasks_time_context_common');

-- Time is the Total, the note is in the forms and the task's block
UPDATE `sys_grid_fields` SET `title` = '_bx_tasks_grid_column_title_tm_value_total' WHERE `name` = 'value' AND `title` = '_bx_tasks_grid_column_title_tm_value' AND `object` IN ('bx_tasks_time_administration', 'bx_tasks_time_common', 'bx_tasks_time_context_administration', 'bx_tasks_time_context_common');
DELETE FROM `sys_grid_fields` WHERE `name` = 'text' AND `object` IN ('bx_tasks_time_administration', 'bx_tasks_time_common', 'bx_tasks_time_context_administration', 'bx_tasks_time_context_common');

-- Manual: what hands added to or took from the timers' time
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`)
SELECT `g`.`object`, 'value_manual', '_bx_tasks_grid_column_title_tm_value_manual', `g`.`width`, 0, 0, '', `g`.`ord`
FROM (
    SELECT 'bx_tasks_time_administration' AS `object`, '8%' AS `width`, 7 AS `ord`
    UNION ALL
    SELECT 'bx_tasks_time_common' AS `object`, '8%' AS `width`, 6 AS `ord`
    UNION ALL
    SELECT 'bx_tasks_time_context_administration' AS `object`, '8%' AS `width`, 5 AS `ord`
    UNION ALL
    SELECT 'bx_tasks_time_context_common' AS `object`, '9%' AS `width`, 4 AS `ord`
) AS `g`
WHERE NOT EXISTS (SELECT 1 FROM `sys_grid_fields` WHERE `object` = `g`.`object` AND `name` = 'value_manual');

-- widths add up to 100%; only the default ones change, so an administrator's own widths stay
UPDATE `sys_grid_fields` SET `width` = '14%' WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'context_id' AND `width` = '12%';
UPDATE `sys_grid_fields` SET `width` = '18%' WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'object_id' AND `width` = '12%';
UPDATE `sys_grid_fields` SET `width` = '8%' WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'value' AND `width` = '10%';
UPDATE `sys_grid_fields` SET `width` = '12%' WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'value_date' AND `width` = '15%';
UPDATE `sys_grid_fields` SET `order` = 6 WHERE `object` = 'bx_tasks_time_administration' AND `name` = 'value' AND `order` = 7;
UPDATE `sys_grid_fields` SET `width` = '18%' WHERE `object` = 'bx_tasks_time_common' AND `name` = 'context_id' AND `width` = '16%';
UPDATE `sys_grid_fields` SET `width` = '22%' WHERE `object` = 'bx_tasks_time_common' AND `name` = 'object_id' AND `width` = '15%';
UPDATE `sys_grid_fields` SET `width` = '8%' WHERE `object` = 'bx_tasks_time_common' AND `name` = 'value' AND `width` = '10%';
UPDATE `sys_grid_fields` SET `width` = '14%' WHERE `object` = 'bx_tasks_time_common' AND `name` = 'value_date' AND `width` = '15%';
UPDATE `sys_grid_fields` SET `width` = '10%' WHERE `object` = 'bx_tasks_time_common' AND `name` = 'actions' AND `width` = '8%';
UPDATE `sys_grid_fields` SET `order` = 5 WHERE `object` = 'bx_tasks_time_common' AND `name` = 'value' AND `order` = 6;
UPDATE `sys_grid_fields` SET `width` = '35%' WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'object_id' AND `width` = '22%';
UPDATE `sys_grid_fields` SET `width` = '8%' WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'value' AND `width` = '10%';
UPDATE `sys_grid_fields` SET `width` = '11%' WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'value_date' AND `width` = '15%';
UPDATE `sys_grid_fields` SET `order` = 4 WHERE `object` = 'bx_tasks_time_context_administration' AND `name` = 'value' AND `order` = 5;
UPDATE `sys_grid_fields` SET `width` = '40%' WHERE `object` = 'bx_tasks_time_context_common' AND `name` = 'object_id' AND `width` = '26%';
UPDATE `sys_grid_fields` SET `width` = '9%' WHERE `object` = 'bx_tasks_time_context_common' AND `name` = 'value' AND `width` = '10%';
UPDATE `sys_grid_fields` SET `width` = '9%' WHERE `object` = 'bx_tasks_time_context_common' AND `name` = 'value_billed' AND `width` = '8%';
UPDATE `sys_grid_fields` SET `width` = '13%' WHERE `object` = 'bx_tasks_time_context_common' AND `name` = 'value_date' AND `width` = '15%';
UPDATE `sys_grid_fields` SET `order` = 3 WHERE `object` = 'bx_tasks_time_context_common' AND `name` = 'value' AND `order` = 4;

-- My Time: the summary block shows the viewer's own time only
UPDATE `sys_pages_blocks` SET `content` = 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:30:"get_block_time_summary_context";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;s:2:"my";}}'
WHERE `object` = 'bx_tasks_context_time' AND `module` = 'bx_tasks' AND `content` LIKE '%get_block_time_summary_context%' AND `content` NOT LIKE '%"my"%';

-- All Time has no budget summary: the Budget and Billing pages have it
DELETE FROM `sys_pages_blocks` WHERE `object` = 'bx_tasks_context_time_administration' AND `module` = 'bx_tasks' AND `content` LIKE '%get_block_budget%';

-- Budget: the summary in the main cell above the table
UPDATE `sys_pages_blocks` SET `cell_id` = 3, `order` = 1
WHERE `object` = 'bx_tasks_context_budget_administration' AND `module` = 'bx_tasks' AND `content` LIKE '%get_block_budget%' AND `cell_id` = 2;
UPDATE `sys_pages_blocks` SET `order` = 2
WHERE `object` = 'bx_tasks_context_budget_administration' AND `module` = 'bx_tasks' AND `content` LIKE '%get_block_manage_budget%' AND `order` = 1;

-- Billing page: the budget for every member, Billed time for those who see it
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`)
SELECT 'bx_tasks_context_billing', 'tasks-context-billing', '_bx_tasks_page_title_sys_entries_billing_in_context', '_bx_tasks_page_title_entries_billing_in_context', 'bx_tasks', 13, 510, 1, '', '', '', '', 0, 1, 0, 'BxTasksPageAuthor', 'modules/boonex/tasks/classes/BxTasksPageAuthor.php' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_objects_page` WHERE `object` = 'bx_tasks_context_billing');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'bx_tasks_context_billing', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_menu_in_context', '_bx_tasks_page_block_title_menu_in_context', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:22:"get_block_menu_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'bx_tasks_context_billing' AND `module` = 'bx_tasks' AND `title_system` = '_bx_tasks_page_block_title_sys_menu_in_context');
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'bx_tasks_context_billing', 3, 'bx_tasks', '_bx_tasks_page_block_title_sys_entries_budget_in_context_summary', '_bx_tasks_page_block_title_entries_budget_in_context_summary', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:16:"get_block_budget";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'bx_tasks_context_billing' AND `module` = 'bx_tasks' AND `title_system` = '_bx_tasks_page_block_title_sys_entries_budget_in_context_summary');
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'bx_tasks_context_billing', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_context_billing_summary', '_bx_tasks_page_block_title_context_billing_summary', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:25:"get_block_billing_summary";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1, 2 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'bx_tasks_context_billing' AND `module` = 'bx_tasks' AND `title_system` = '_bx_tasks_page_block_title_system_context_billing_summary');

-- the Billing tab
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `active_api`, `copyable`, `order`)
SELECT 'bx_tasks_view_context_submenu', 'bx_tasks', 'tasks-context-billing', '_bx_tasks_menu_item_title_system_view_context_billing', '_bx_tasks_menu_item_title_view_context_billing', 'page.php?i=tasks-context-billing&profile_id={profile_id}', '', '', '', '', 2147483647, '', 1, 1, 0, 7 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'bx_tasks_view_context_submenu' AND `name` = 'tasks-context-billing');

-- cron: pauses the timers that run for too long (BxTasksCronTimers)
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`)
SELECT 'bx_tasks_timers', '0 * * * *', 'BxTasksCronTimers', 'modules/boonex/tasks/classes/BxTasksCronTimers.php', '' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_cron_jobs` WHERE `name` = 'bx_tasks_timers');

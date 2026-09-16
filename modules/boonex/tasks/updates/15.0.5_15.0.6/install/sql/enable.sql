-- PAGES
UPDATE `sys_objects_page` SET `visible_for_levels`='2147483646' WHERE `object`='bx_tasks_home';
UPDATE `sys_objects_page` SET `visible_for_levels`='2147483646' WHERE `object`='bx_tasks_timers';

UPDATE `sys_pages_blocks` SET `active`='0', `order`='0' WHERE `object`='bx_tasks_view_entry' AND `title`='_bx_tasks_page_block_title_entry_assignments';

DELETE FROM `sys_objects_page` WHERE `object`='bx_tasks_context_budget_administration';
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_context_budget_administration', 'tasks-context-budget-administration', '_bx_tasks_page_title_sys_entries_budget_in_context_administration', '_bx_tasks_page_title_entries_budget_in_context_administration', 'bx_tasks', 13, 510, 1, '', '', '', '', 0, 1, 0, 'BxTasksPageAuthor', 'modules/boonex/tasks/classes/BxTasksPageAuthor.php');

DELETE FROM `sys_pages_blocks` WHERE `object`='bx_tasks_context_budget_administration';
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_tasks_context_budget_administration', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_menu_in_context', '_bx_tasks_page_block_title_menu_in_context', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:22:"get_block_menu_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1),
('bx_tasks_context_budget_administration', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_entries_budget_in_context_summary', '_bx_tasks_page_block_title_entries_budget_in_context_summary', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:16:"get_block_budget";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 2),
('bx_tasks_context_budget_administration', 3, 'bx_tasks', '_bx_tasks_page_block_title_sys_entries_budget_in_context_administration', '_bx_tasks_page_block_title_entries_budget_in_context_administration', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:23:"get_block_manage_budget";s:6:"params";a:2:{i:0;s:14:"administration";i:1;s:12:"{profile_id}";}}', 0, 0, 1, 1);


-- MENUS
DELETE FROM `sys_objects_menu` WHERE `object`='bx_tasks_submenu';
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_submenu', '_bx_tasks_menu_title_submenu', 'bx_tasks_submenu', 'bx_tasks', 8, 0, 1, 'BxTasksMenuSubmenu', 'modules/boonex/tasks/classes/BxTasksMenuSubmenu.php');

DELETE FROM `sys_menu_sets` WHERE `set_name`='bx_tasks_submenu';
INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_submenu', 'bx_tasks', '_bx_tasks_menu_set_title_submenu', 0);

DELETE FROM `sys_menu_items` WHERE `set_name`='bx_tasks_submenu';
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`) VALUES 
('bx_tasks_submenu', 'bx_tasks', 'use', '_bx_tasks_menu_item_title_system_submenu_use', '', '', '', '', '', 'bx_tasks_use_tools_submenu', 2147483646, 0, 1, 0, 1),
('bx_tasks_submenu', 'bx_tasks', 'browse', '_bx_tasks_menu_item_title_system_submenu_browse', '', '', '', '', '', 'bx_tasks_browse', 2147483646, 0, 1, 0, 2),
('bx_tasks_submenu', 'bx_tasks', 'manage', '_bx_tasks_menu_item_title_system_submenu_manage', '', '', '', '', '', 'bx_tasks_manage_tools_submenu', 2147483646, 0, 1, 0, 3);

SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
DELETE FROM `sys_menu_items` WHERE `set_name`='sys_add_content_links' AND `module`='bx_tasks' AND `name`='create-task';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_tasks', 'create-task', '_bx_tasks_menu_item_title_system_create_entry', '_bx_tasks_menu_item_title_create_entry', 'page.php?i=create-task', '', '', 'tasks', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

UPDATE `sys_menu_items` SET `active`='0' WHERE `set_name`='bx_tasks_view_actions' AND `name` IN ('set-completed', 'set-uncompleted');

DELETE FROM `sys_menu_items` WHERE `set_name`='bx_tasks_view_context_submenu' AND `name`='tasks-context-budget-administration';
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_tasks_view_context_submenu', 'bx_tasks', 'tasks-context-budget-administration', '_bx_tasks_menu_item_title_system_view_context_budget_administration', '_bx_tasks_menu_item_title_view_context_budget_administration', 'page.php?i=tasks-context-budget-administration&profile_id={profile_id}', '', '', '', '', 2147483647, '', 1, 0, 4);


-- PRIVACY
UPDATE `sys_objects_privacy` SET `default_group`='', `override_class_name`='BxTasksPrivacyView', `override_class_file`='modules/boonex/tasks/classes/BxTasksPrivacyView.php' WHERE `object`='bx_tasks_allow_view_to';


-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object`='bx_tasks_budget_context_administration';
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_budget_context_administration', 'Sql', 'SELECT * FROM `bx_tasks_budget_track` WHERE 1 ', 'bx_tasks_budget_track', 'id', '', '', '', 50, NULL, 'start', '', 'tbt`.`text,tt`.`title,tt`.`text', '', 'like', 'date', '', 2147483647, 'BxTasksGridBudgetContextAdministration', 'modules/boonex/tasks/classes/BxTasksGridBudgetContextAdministration.php');

DELETE FROM `sys_grid_fields` WHERE `object`='bx_tasks_budget_context_administration';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_tasks_budget_context_administration', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_tasks_budget_context_administration', 'profile_id', '_bx_tasks_grid_column_title_bdt_profile_id', '30%', 0, 0, '', 2),
('bx_tasks_budget_context_administration', 'text', '_bx_tasks_grid_column_title_bdt_text', '25%', 0, 32, '', 3),
('bx_tasks_budget_context_administration', 'value', '_bx_tasks_grid_column_title_bdt_value', '10%', 0, 0, '', 4),
('bx_tasks_budget_context_administration', 'date', '_bx_tasks_grid_column_title_bdt_date', '15%', 0, 0, '', 5),
('bx_tasks_budget_context_administration', 'actions', '', '18%', 0, '', '', 6);

DELETE FROM `sys_grid_actions` WHERE `object`='bx_tasks_budget_context_administration';
INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_tasks_budget_context_administration', 'independent', 'add', '_bx_tasks_grid_action_title_bdt_add', '', 0, 0, 1),
('bx_tasks_budget_context_administration', 'single', 'edit', '_bx_tasks_grid_action_title_bdt_edit', 'pencil-alt', 1, 0, 1),
('bx_tasks_budget_context_administration', 'single', 'delete', '_bx_tasks_grid_action_title_bdt_delete', 'remove', 1, 1, 2);

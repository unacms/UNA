
-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_tasks', '_bx_tasks', 'bx_tasks@modules/boonex/tasks/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_tasks', '_bx_tasks', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_tasks_enable_auto_approve', 'on', @iCategId, '_bx_tasks_option_enable_auto_approve', 'checkbox', '', '', '', 0),
('bx_tasks_summary_chars', '700', @iCategId, '_bx_tasks_option_summary_chars', 'digit', '', '', '', 1),
('bx_tasks_plain_summary_chars', '240', @iCategId, '_bx_tasks_option_plain_summary_chars', 'digit', '', '', '', 2),
('bx_tasks_per_page_browse', '12', @iCategId, '_bx_tasks_option_per_page_browse', 'digit', '', '', '', 10),
('bx_tasks_per_page_profile', '6', @iCategId, '_bx_tasks_option_per_page_profile', 'digit', '', '', '', 12),
('bx_tasks_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', 'digit', '', '', '', 15),
('bx_tasks_rss_num', '10', @iCategId, '_bx_tasks_option_rss_num', 'digit', '', '', '', 20),
('bx_tasks_searchable_fields', 'title,text', @iCategId, '_bx_tasks_option_searchable_fields', 'list', '', '', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_searchable_fields";}', 30),
('bx_tasks_auto_activation_for_categories', 'on', @iCategId, '_bx_tasks_option_auto_activation_for_categories', 'checkbox', '', '', '', 35);

-- PAGE: create entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_create_entry', '_bx_tasks_page_title_sys_create_entry', '_bx_tasks_page_title_create_entry', 'bx_tasks', 5, 2147483647, 1, 'create-task', 'page.php?i=create-task', '', '', '', 0, 1, 0, 'BxTasksPageBrowse', 'modules/boonex/tasks/classes/BxTasksPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_tasks_create_entry', 1, 'bx_tasks', '_bx_tasks_page_block_title_create_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:13:"entity_create";}', 0, 1, 1);


-- PAGE: edit entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_edit_entry', '_bx_tasks_page_title_sys_edit_entry', '_bx_tasks_page_title_edit_entry', 'bx_tasks', 5, 2147483647, 1, 'edit-task', '', '', '', '', 0, 1, 0, 'BxTasksPageEntry', 'modules/boonex/tasks/classes/BxTasksPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_tasks_edit_entry', 1, 'bx_tasks', '_bx_tasks_page_block_title_edit_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);


-- PAGE: delete entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_delete_entry', '_bx_tasks_page_title_sys_delete_entry', '_bx_tasks_page_title_delete_entry', 'bx_tasks', 5, 2147483647, 1, 'delete-task', '', '', '', '', 0, 1, 0, 'BxTasksPageEntry', 'modules/boonex/tasks/classes/BxTasksPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_tasks_delete_entry', 1, 'bx_tasks', '_bx_tasks_page_block_title_delete_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);


-- PAGE: view entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_view_entry', '_bx_tasks_page_title_sys_view_entry', '_bx_tasks_page_title_view_entry', 'bx_tasks', 12, 2147483647, 1, 'view-task', '', '', '', '', 0, 1, 0, 'BxTasksPageEntry', 'modules/boonex/tasks/classes/BxTasksPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_tasks_view_entry', 2, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_text', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:17:\"entity_text_block\";}', 0, 0, 1, 2),
('bx_tasks_view_entry', 2, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_author', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:13:\"entity_author\";}', 0, 0, 1, 1),
('bx_tasks_view_entry', 2, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_assignments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:18:\"entity_assignments\";}', 0, 0, 0, 0),
('bx_tasks_view_entry', 3, 'bx_tasks', '_bx_tasks_page_block_title_sys_entry_context', '_bx_tasks_page_block_title_entry_context', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:14:\"entity_context\";}', 0, 0, 1, 1),
('bx_tasks_view_entry', 3, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_timer', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:12:\"entity_timer\";}', 0, 0, 1, 2),
('bx_tasks_view_entry', 3, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_info', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:11:\"entity_info\";}', 0, 0, 1, 3),
('bx_tasks_view_entry', 2, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:18:\"entity_all_actions\";}', 0, 0, 1, 3),
('bx_tasks_view_entry', 4, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:14:\"entity_actions\";}', 0, 0, 0, 0),
('bx_tasks_view_entry', 4, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_social_sharing', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:21:\"entity_social_sharing\";}', 0, 0, 0, 0),
('bx_tasks_view_entry', 2, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_attachments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:18:\"entity_attachments\";}', 0, 0, 1, 4),
('bx_tasks_view_entry', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_entry_comments', '_bx_tasks_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 1, 6),
('bx_tasks_view_entry', 3, 'bx_tasks', '', '_bx_tasks_page_block_title_featured_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 0, 1, 5),
('bx_tasks_view_entry', 2, 'bx_tasks', '', '_bx_tasks_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);


-- PAGE: view entry comments

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_view_entry_comments', '_bx_tasks_page_title_sys_view_entry_comments', '_bx_tasks_page_title_view_entry_comments', 'bx_tasks', 5, 2147483647, 1, 'view-task-comments', '', '', '', '', 0, 1, 0, 'BxTasksPageEntry', 'modules/boonex/tasks/classes/BxTasksPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_tasks_view_entry_comments', 1, 'bx_tasks', '_bx_tasks_page_block_title_sys_entry_comments', '_bx_tasks_page_block_title_entry_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 1);

-- PAGE: entries in context
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_context', 'tasks-context', '_bx_tasks_page_title_sys_entries_in_context', '_bx_tasks_page_title_entries_in_context', 'bx_tasks', 13, 510, 1, '', '', '', '', 0, 1, 0, 'BxTasksPageAuthor', 'modules/boonex/tasks/classes/BxTasksPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_tasks_context', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_menu_in_context', '_bx_tasks_page_block_title_menu_in_context', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:22:"get_block_menu_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1),
('bx_tasks_context', 3, 'bx_tasks', '_bx_tasks_page_block_title_sys_entries_in_context', '_bx_tasks_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_tasks\";s:6:\"method\";s:14:\"browse_context\";}', 0, 0, 1, 1),
('bx_tasks_context', 4, 'bx_tasks', '_bx_tasks_page_block_title_sys_calendar_in_context', '_bx_tasks_page_block_title_calendar_in_context', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:8:"calendar";s:12:"ignore_cache";b:1;s:6:"params";a:1:{i:0;a:1:{s:10:"context_id";s:12:"{profile_id}";}}}', 0, 0, 1, 2);

-- PAGE: module home
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_home', 'tasks-home', '_bx_tasks_page_title_sys_home', '_bx_tasks_page_title_home', 'bx_tasks', 13, 2147483646, 1, 'page.php?i=tasks-home', '', '', '', 0, 1, 0, 'BxTasksPageBrowse', 'modules/boonex/tasks/classes/BxTasksPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_tasks_home', 2, 'bx_tasks', '_bx_tasks_page_block_title_system_menu_browse', '_bx_tasks_page_block_title_menu_browse', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_menu_browse";}', 0, 1, 1, 0),
('bx_tasks_home', 3, 'bx_tasks', '_bx_tasks_page_block_title_sys_home_entries', '_bx_tasks_page_block_title_home_entries', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:11:"browse_home";}', 0, 1, 1, 1);

-- PAGE: entries' time in context (own)
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_context_time', 'tasks-context-time', '_bx_tasks_page_title_sys_entries_time_in_context', '_bx_tasks_page_title_entries_time_in_context', 'bx_tasks', 13, 510, 1, '', '', '', '', 0, 1, 0, 'BxTasksPageAuthor', 'modules/boonex/tasks/classes/BxTasksPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_tasks_context_time', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_menu_in_context', '_bx_tasks_page_block_title_menu_in_context', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:22:"get_block_menu_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1),
('bx_tasks_context_time', 3, 'bx_tasks', '_bx_tasks_page_block_title_sys_entries_time_in_context', '_bx_tasks_page_block_title_entries_time_in_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_manage_time";s:6:"params";a:2:{i:0;s:6:"common";i:1;s:12:"{profile_id}";}}', 0, 0, 1, 1);

-- PAGE: entries' time in context (all)
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_context_time_administration', 'tasks-context-time-administration', '_bx_tasks_page_title_sys_entries_time_in_context_administration', '_bx_tasks_page_title_entries_time_in_context_administration', 'bx_tasks', 13, 510, 1, '', '', '', '', 0, 1, 0, 'BxTasksPageAuthor', 'modules/boonex/tasks/classes/BxTasksPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_tasks_context_time_administration', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_menu_in_context', '_bx_tasks_page_block_title_menu_in_context', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:22:"get_block_menu_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1),
('bx_tasks_context_time_administration', 3, 'bx_tasks', '_bx_tasks_page_block_title_sys_entries_time_in_context_administration', '_bx_tasks_page_block_title_entries_time_in_context_administration', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_manage_time";s:6:"params";a:2:{i:0;s:14:"administration";i:1;s:12:"{profile_id}";}}', 0, 0, 1, 1);

-- PAGE: pre lists and values in context
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_context_pre_values', '_bx_tasks_page_title_sys_context_pre_values', '_bx_tasks_page_title_context_pre_values', 'bx_tasks', 13, 2147483647, 1, 'tasks-context-values', 'page.php?i=tasks-context-values', '', '', '', 0, 1, 0, 'BxTasksPageAuthor', 'modules/boonex/tasks/classes/BxTasksPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_tasks_context_pre_values', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_menu_in_context', '_bx_tasks_page_block_title_menu_in_context', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:22:"get_block_menu_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1),
('bx_tasks_context_pre_values', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_context_pre_values', '_bx_tasks_page_block_title_context_pre_values', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:28:"get_block_context_pre_values";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1);

-- PAGE: context settings
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_context_settings', '_bx_tasks_page_title_sys_context_settings', '_bx_tasks_page_title_context_settings', 'bx_tasks', 13, 2147483647, 1, 'tasks-context-settings', 'page.php?i=tasks-context-settings', '', '', '', 0, 1, 0, 'BxTasksPageAuthor', 'modules/boonex/tasks/classes/BxTasksPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_tasks_context_settings', 2, 'bx_tasks', '_bx_tasks_page_block_title_sys_menu_in_context', '_bx_tasks_page_block_title_menu_in_context', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:22:"get_block_menu_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1),
('bx_tasks_context_settings', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_context_settings', '_bx_tasks_page_block_title_context_settings', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:26:"get_block_context_settings";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 1),
('bx_tasks_context_settings', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_context_authorize', '_bx_tasks_page_block_title_context_authorize', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:27:"get_block_context_authorize";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 0, 1, 2);

-- PAGE: manage own entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_manage', '_bx_tasks_page_title_sys_manage', '_bx_tasks_page_title_manage', 'bx_tasks', 13, 2147483647, 1, 'tasks-manage', 'page.php?i=tasks-manage', '', '', '', 0, 1, 0, 'BxTasksPageBrowse', 'modules/boonex/tasks/classes/BxTasksPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_tasks_manage', 2, 'bx_tasks', '_bx_tasks_page_block_title_system_menu_browse', '_bx_tasks_page_block_title_menu_browse', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_menu_browse";}', 0, 1, 0),
('bx_tasks_manage', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_manage', '_bx_tasks_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:12:"manage_tools";}', 0, 1, 0);

-- PAGE: manage all entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_administration', '_bx_tasks_page_title_sys_manage_administration', '_bx_tasks_page_title_manage', 'bx_tasks', 13, 192, 1, 'tasks-administration', 'page.php?i=tasks-administration', '', '', '', 0, 1, 0, 'BxTasksPageBrowse', 'modules/boonex/tasks/classes/BxTasksPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_tasks_administration', 2, 'bx_tasks', '_bx_tasks_page_block_title_system_menu_browse', '_bx_tasks_page_block_title_menu_browse', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_menu_browse";}', 0, 1, 0),
('bx_tasks_administration', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_manage_administration', '_bx_tasks_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);

-- PAGE: manage own time
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_time_manage', '_bx_tasks_page_title_sys_time_manage', '_bx_tasks_page_title_time_manage', 'bx_tasks', 13, 2147483647, 1, 'tasks-time-manage', 'page.php?i=tasks-time-manage', '', '', '', 0, 1, 0, 'BxTasksPageBrowse', 'modules/boonex/tasks/classes/BxTasksPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_tasks_time_manage', 2, 'bx_tasks', '_bx_tasks_page_block_title_system_menu_browse', '_bx_tasks_page_block_title_menu_browse', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_menu_browse";}', 0, 1, 0),
('bx_tasks_time_manage', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_time_manage', '_bx_tasks_page_block_title_time_manage', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_manage_time";s:6:"params";a:1:{i:0;s:6:"common";}}', 0, 1, 0);

-- PAGE: manage all time
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_time_administration', '_bx_tasks_page_title_sys_time_manage_administration', '_bx_tasks_page_title_time_manage', 'bx_tasks', 13, 192, 1, 'tasks-time-administration', 'page.php?i=tasks-time-administration', '', '', '', 0, 1, 0, 'BxTasksPageBrowse', 'modules/boonex/tasks/classes/BxTasksPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_tasks_time_administration', 2, 'bx_tasks', '_bx_tasks_page_block_title_system_menu_browse', '_bx_tasks_page_block_title_menu_browse', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_menu_browse";}', 0, 1, 0),
('bx_tasks_time_administration', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_time_manage_administration', '_bx_tasks_page_block_title_time_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_manage_time";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);

-- PAGE: timers
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_timers', '_bx_tasks_page_title_sys_timers', '_bx_tasks_page_title_timers', 'bx_tasks', 13, 2147483646, 1, 'tasks-timers', 'page.php?i=tasks-timers', '', '', '', 0, 1, 0, 'BxTasksPageBrowse', 'modules/boonex/tasks/classes/BxTasksPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_tasks_timers', 2, 'bx_tasks', '_bx_tasks_page_block_title_system_menu_browse', '_bx_tasks_page_block_title_menu_browse', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:21:"get_block_menu_browse";}', 0, 1, 0),
('bx_tasks_timers', 3, 'bx_tasks', '_bx_tasks_page_block_title_system_timers', '_bx_tasks_page_block_title_timers', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:16:"get_block_timers";}', 0, 1, 0);


-- MENU: add to site menu
SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_tasks', 'tasks-home', '_bx_tasks_menu_item_title_system_entries_home', '_bx_tasks_menu_item_title_entries_home', 'page.php?i=tasks-home', '', '', 'tasks', '', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to "add content" menu
SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_tasks', 'create-task', '_bx_tasks_menu_item_title_system_create_entry', '_bx_tasks_menu_item_title_create_entry', 'page.php?i=create-task', '', '', 'tasks', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: create task form attachments (link, photo, video, etc)
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_entry_attachments', '_bx_tasks_menu_title_entry_attachments', 'bx_tasks_entry_attachments', 'bx_tasks', 23, 0, 1, 'BxTasksMenuAttachments', 'modules/boonex/tasks/classes/BxTasksMenuAttachments.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_entry_attachments', 'bx_tasks', '_bx_tasks_menu_set_title_entry_attachments', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_tasks_entry_attachments', 'bx_tasks', 'photo_simple', '_bx_tasks_menu_item_title_system_cpa_photo_simple', '_bx_tasks_menu_item_title_cpa_photo_simple', 'javascript:void(0)', 'javascript:{js_object_uploader_photos_simple}.showUploaderForm();', '_self', 'camera', '', '', 2147483647, '', 0, 0, 1, 1),
('bx_tasks_entry_attachments', 'bx_tasks', 'photo_html5', '_bx_tasks_menu_item_title_system_cpa_photo_html5', '_bx_tasks_menu_item_title_cpa_photo_html5', 'javascript:void(0)', 'javascript:{js_object_uploader_photos_html5}.showUploaderForm();', '_self', 'camera', '', '', 2147483647, '', 1, 0, 1, 2),
('bx_tasks_entry_attachments', 'bx_tasks', 'video_simple', '_bx_tasks_menu_item_title_system_cpa_video_simple', '_bx_tasks_menu_item_title_cpa_video_simple', 'javascript:void(0)', 'javascript:{js_object_uploader_videos_simple}.showUploaderForm();', '_self', 'video', '', '', 2147483647, '', 0, 0, 1, 3),
('bx_tasks_entry_attachments', 'bx_tasks', 'video_html5', '_bx_tasks_menu_item_title_system_cpa_video_html5', '_bx_tasks_menu_item_title_cpa_video_html5', 'javascript:void(0)', 'javascript:{js_object_uploader_videos_html5}.showUploaderForm();', '_self', 'video', '', '', 2147483647, '', 1, 0, 1, 4),
('bx_tasks_entry_attachments', 'bx_tasks', 'video_record_video', '_bx_tasks_menu_item_title_system_cpa_video_record', '_bx_tasks_menu_item_title_cpa_video_record', 'javascript:void(0)', 'javascript:{js_object_uploader_videos_record_video}.showUploaderForm();', '_self', 'fas circle', '', '', 2147483647, '', 1, 0, 1, 5),
('bx_tasks_entry_attachments', 'bx_tasks', 'file_simple', '_bx_tasks_menu_item_title_system_cpa_file_simple', '_bx_tasks_menu_item_title_cpa_file_simple', 'javascript:void(0)', 'javascript:{js_object_uploader_files_simple}.showUploaderForm();', '_self', 'file', '', '', 2147483647, '', 0, 0, 1, 6),
('bx_tasks_entry_attachments', 'bx_tasks', 'file_html5', '_bx_tasks_menu_item_title_system_cpa_file_html5', '_bx_tasks_menu_item_title_cpa_file_html5', 'javascript:void(0)', 'javascript:{js_object_uploader_files_html5}.showUploaderForm();', '_self', 'file', '', '', 2147483647, '', 1, 0, 1, 7);

-- MENU: actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_view', '_bx_tasks_menu_title_view_entry', 'bx_tasks_view', 'bx_tasks', 9, 0, 1, 'BxTasksMenuView', 'modules/boonex/tasks/classes/BxTasksMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_view', 'bx_tasks', '_bx_tasks_menu_set_title_view_entry', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_tasks_view', 'bx_tasks', 'edit-task', '_bx_tasks_menu_item_title_system_edit_entry', '_bx_tasks_menu_item_title_edit_entry', 'page.php?i=edit-task&id={content_id}', '', '', 'pencil-alt', '', 2147483647, '', 1, 0, 1),
('bx_tasks_view', 'bx_tasks', 'edit-task-state', '_bx_tasks_menu_item_title_system_edit_entry_state', '_bx_tasks_menu_item_title_edit_entry_state', 'javascript:void(0)', 'javascript:{js_object}.processTaskEditState({content_id}, this)', '', 'pencil-alt', '', 2147483647, '', 1, 0, 2),
('bx_tasks_view', 'bx_tasks', 'delete-task', '_bx_tasks_menu_item_title_system_delete_entry', '_bx_tasks_menu_item_title_delete_entry', 'page.php?i=delete-task&id={content_id}', '', '', 'remove', '', 2147483647, '', 1, 0, 3),
('bx_tasks_view', 'bx_tasks', 'approve', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 2147483647, '', 1, 0, 4);


-- MENU: all actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_view_actions', '_sys_menu_title_view_actions', 'bx_tasks_view_actions', 'bx_tasks', 15, 0, 1, 'BxTasksMenuViewActions', 'modules/boonex/tasks/classes/BxTasksMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_view_actions', 'bx_tasks', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_tasks_view_actions', 'bx_tasks', 'edit-task', '_bx_tasks_menu_item_title_system_edit_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_tasks_view_actions', 'bx_tasks', 'edit-task-state', '_bx_tasks_menu_item_title_system_edit_entry_state', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 12),
('bx_tasks_view_actions', 'bx_tasks', 'delete-task', '_bx_tasks_menu_item_title_system_delete_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_tasks_view_actions', 'bx_tasks', 'report-time', '_bx_tasks_menu_item_title_system_report_time', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 25),
('bx_tasks_view_actions', 'bx_tasks', 'set-completed', '_bx_tasks_menu_item_title_system_set_completed', '_bx_tasks_menu_item_title_set_completed', 'javascript:void(0)', 'javascript:{js_object}.setCompletedByMenu({content_id}, 1, this);', '', 'check', '', '', 0, 2147483647, 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:22:"check_allowed_complete";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 0, 0, 30),
('bx_tasks_view_actions', 'bx_tasks', 'set-uncompleted', '_bx_tasks_menu_item_title_system_set_uncompleted', '_bx_tasks_menu_item_title_set_uncompleted', 'javascript:void(0)', 'javascript:{js_object}.setCompletedByMenu({content_id}, 0, this);', '', 'circle', '', '', 0, 2147483647, 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:24:"check_allowed_uncomplete";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 0, 0, 35),
('bx_tasks_view_actions', 'bx_tasks', 'approve', '_sys_menu_item_title_system_va_approve', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_tasks_view_actions', 'bx_tasks', 'set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_tasks'', content_id: {content_id}});', '', 'check-circle', '', '', 0, 2147483647, 'a:3:{s:6:"module";s:8:"bx_tasks";s:6:"method";s:15:"is_allow_badges";s:6:"params";a:1:{i:0;s:12:"{content_id}";}}', 1, 0, 50),
('bx_tasks_view_actions', 'bx_tasks', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_tasks_view_actions', 'bx_tasks', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_tasks_view_actions', 'bx_tasks', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 220),
('bx_tasks_view_actions', 'bx_tasks', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 225),
('bx_tasks_view_actions', 'bx_tasks', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 230),
('bx_tasks_view_actions', 'bx_tasks', 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 260),
('bx_tasks_view_actions', 'bx_tasks', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_tasks_view_actions', 'bx_tasks', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', '', 0, 2147483647, '', 1, 0, 280),
('bx_tasks_view_actions', 'bx_tasks', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_tasks&content_id={content_id}', '', '', 'history', '', '', 0, 192, '', 1, 0, 290),
('bx_tasks_view_actions', 'bx_tasks', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_tasks_view_actions', 'bx_tasks', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);


-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_submenu', '_bx_tasks_menu_title_submenu', 'bx_tasks_submenu', 'bx_tasks', 8, 0, 1, 'BxTasksMenuSubmenu', 'modules/boonex/tasks/classes/BxTasksMenuSubmenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_submenu', 'bx_tasks', '_bx_tasks_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `active_api`, `copyable`, `order`) VALUES 
('bx_tasks_submenu', 'bx_tasks', 'use', '_bx_tasks_menu_item_title_system_submenu_use', '', '', '', '', '', 'bx_tasks_use_tools_submenu', 2147483646, 0, 1, 0, 1),
('bx_tasks_submenu', 'bx_tasks', 'browse', '_bx_tasks_menu_item_title_system_submenu_browse', '', '', '', '', '', 'bx_tasks_browse', 2147483646, 0, 1, 0, 2),
('bx_tasks_submenu', 'bx_tasks', 'manage', '_bx_tasks_menu_item_title_system_submenu_manage', '', '', '', '', '', 'bx_tasks_manage_tools_submenu', 2147483646, 0, 1, 0, 3);

-- MENU: sub-menu for view entry
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_view_submenu', '_bx_tasks_menu_title_view_entry_submenu', 'bx_tasks_view_submenu', 'bx_tasks', 8, 0, 1, 'BxTasksMenuView', 'modules/boonex/tasks/classes/BxTasksMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_view_submenu', 'bx_tasks', '_bx_tasks_menu_set_title_view_entry_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_tasks_view_submenu', 'bx_tasks', 'view-task', '_bx_tasks_menu_item_title_system_view_entry', '_bx_tasks_menu_item_title_view_entry_submenu_entry', 'page.php?i=view-task&id={content_id}', '', '', '', '', 2147483647, 0, 0, 1),
('bx_tasks_view_submenu', 'bx_tasks', 'view-task-comments', '_bx_tasks_menu_item_title_system_view_entry_comments', '_bx_tasks_menu_item_title_view_entry_submenu_comments', 'page.php?i=view-task-comments&id={content_id}', '', '', '', '', 2147483647, 0, 0, 2);

-- MENU: context sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_view_context_submenu', '_bx_tasks_menu_title_view_context_submenu', 'bx_tasks_view_context_submenu', 'bx_tasks', 6, 0, 1, 'BxTasksMenuViewContext', 'modules/boonex/tasks/classes/BxTasksMenuViewContext.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_view_context_submenu', 'bx_tasks', '_bx_tasks_menu_set_title_view_context_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_tasks_view_context_submenu', 'bx_tasks', 'tasks-context', '_bx_tasks_menu_item_title_system_view_context_entries', '_bx_tasks_menu_item_title_view_context_entries', 'page.php?i=tasks-context&profile_id={profile_id}', '', '', '', '', 2147483647, '', 1, 0, 1),
('bx_tasks_view_context_submenu', 'bx_tasks', 'tasks-context-time', '_bx_tasks_menu_item_title_system_view_context_time', '_bx_tasks_menu_item_title_view_context_time', 'page.php?i=tasks-context-time&profile_id={profile_id}', '', '', '', '', 2147483647, '', 1, 0, 2),
('bx_tasks_view_context_submenu', 'bx_tasks', 'tasks-context-time-administration', '_bx_tasks_menu_item_title_system_view_context_time_administration', '_bx_tasks_menu_item_title_view_context_time_administration', 'page.php?i=tasks-context-time-administration&profile_id={profile_id}', '', '', '', '', 2147483647, '', 1, 0, 3),
('bx_tasks_view_context_submenu', 'bx_tasks', 'tasks-context-values', '_bx_tasks_menu_item_title_system_manage_context_pre_values', '_bx_tasks_menu_item_title_manage_context_pre_values', 'page.php?i=tasks-context-values&profile_id={profile_id}', '', '', '', '', 2147483647, '', 1, 0, 4),
('bx_tasks_view_context_submenu', 'bx_tasks', 'tasks-context-settings', '_bx_tasks_menu_item_title_system_manage_context_settings', '_bx_tasks_menu_item_title_manage_context_settings', 'page.php?i=tasks-context-settings&profile_id={profile_id}', '', '', '', '', 2147483647, '', 1, 0, 5);

-- MENU: use tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_use_tools_submenu', '_bx_tasks_menu_title_use_tools_submenu', 'bx_tasks_use_tools_submenu', 'bx_tasks', 26, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_use_tools_submenu', 'bx_tasks', '_bx_tasks_menu_set_title_use_tools_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_tasks_use_tools_submenu', 'bx_tasks', 'tasks-home', '', '_bx_tasks_menu_item_title_ut_submenu_home', 'page.php?i=tasks-home', '', '_self', '', '', 2147483647, 1, 0, 1),
('bx_tasks_use_tools_submenu', 'bx_tasks', 'tasks-timers', '', '_bx_tasks_menu_item_title_ut_submenu_timers', 'page.php?i=tasks-timers', '', '_self', '', '', 2147483647, 1, 0, 2);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_manage_tools_submenu', '_bx_tasks_menu_title_manage_tools_submenu', 'bx_tasks_manage_tools_submenu', 'bx_tasks', 26, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_manage_tools_submenu', 'bx_tasks', '_bx_tasks_menu_set_title_manage_tools_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_tasks_manage_tools_submenu', 'bx_tasks', 'tasks-manage', '', '_bx_tasks_menu_item_title_mt_submenu_entries_common', 'page.php?i=tasks-manage', '', '_self', '', '', 2147483647, 1, 0, 1),
('bx_tasks_manage_tools_submenu', 'bx_tasks', 'tasks-administration', '', '_bx_tasks_menu_item_title_mt_submenu_entries_administration', 'page.php?i=tasks-administration', '', '_self', '', '', 128, 1, 0, 2),
('bx_tasks_manage_tools_submenu', 'bx_tasks', 'tasks-time-manage', '', '_bx_tasks_menu_item_title_mt_submenu_time_common', 'page.php?i=tasks-time-manage', '', '_self', '', '', 2147483647, 1, 0, 3),
('bx_tasks_manage_tools_submenu', 'bx_tasks', 'tasks-time-administration', '', '_bx_tasks_menu_item_title_mt_submenu_time_administration', 'page.php?i=tasks-time-administration', '', '_self', '', '', 128, 1, 0, 4);

-- MENU: manage tools: item submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_menu_manage_tools', '_bx_tasks_menu_title_manage_tools', 'bx_tasks_menu_manage_tools', 'bx_tasks', 6, 0, 1, 'BxTasksMenuManageTools', 'modules/boonex/tasks/classes/BxTasksMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_menu_manage_tools', 'bx_tasks', '_bx_tasks_menu_set_title_manage_tools', 0);

--INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
--('bx_tasks_menu_manage_tools', 'bx_tasks', 'delete-with-content', '_bx_tasks_menu_item_title_system_delete_with_content', '_bx_tasks_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 128, 1, 0, 0);

-- MENU: browse
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_browse', '_bx_tasks_menu_title_browse', 'bx_tasks_browse', 'bx_tasks', 32, 0, 1, 'BxTasksMenuBrowse', 'modules/boonex/tasks/classes/BxTasksMenuBrowse.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_tasks_browse', 'bx_tasks', '_bx_tasks_menu_set_title_browse', 0);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_group_view_submenu', 'bx_tasks', 'tasks-context', '_bx_tasks_menu_item_title_system_view_entries_in_context', '_bx_tasks_menu_item_title_view_entries_in_context', 'page.php?i=tasks-context&profile_id={profile_id}', '', '', 'tasks', '', 510, 1, 0, 0);


-- PRIVACY 

INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_allow_view_to', 'bx_tasks', 'view', '_bx_tasks_form_entry_input_allow_view_to', '', 'bx_tasks_tasks', 'id', 'author', 'BxTasksPrivacyView', 'modules/boonex/tasks/classes/BxTasksPrivacyView.php');


-- ACL

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_tasks', 'create entry', NULL, '_bx_tasks_acl_action_create_entry', '', 1, 3);
SET @iIdActionEntryCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_tasks', 'delete entry', NULL, '_bx_tasks_acl_action_delete_entry', '', 1, 3);
SET @iIdActionEntryDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_tasks', 'view entry', NULL, '_bx_tasks_acl_action_view_entry', '', 1, 0);
SET @iIdActionEntryView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_tasks', 'set thumb', NULL, '_bx_tasks_acl_action_set_thumb', '', 1, 3);
SET @iIdActionSetThumb = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_tasks', 'edit any entry', NULL, '_bx_tasks_acl_action_edit_any_entry', '', 1, 3);
SET @iIdActionEntryEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_tasks', 'delete any entry', NULL, '_bx_tasks_acl_action_delete_any_entry', '', 1, 3);
SET @iIdActionEntryDeleteAny = LAST_INSERT_ID();

SET @iUnauthenticated = 1;
SET @iAccount = 2;
SET @iStandard = 3;
SET @iUnconfirmed = 4;
SET @iPending = 5;
SET @iSuspended = 6;
SET @iModerator = 7;
SET @iAdministrator = 8;
SET @iPremium = 9;

INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES

-- entry create
(@iStandard, @iIdActionEntryCreate),
(@iModerator, @iIdActionEntryCreate),
(@iAdministrator, @iIdActionEntryCreate),
(@iPremium, @iIdActionEntryCreate),

-- entry delete
(@iStandard, @iIdActionEntryDelete),
(@iModerator, @iIdActionEntryDelete),
(@iAdministrator, @iIdActionEntryDelete),
(@iPremium, @iIdActionEntryDelete),

-- entry view
(@iUnauthenticated, @iIdActionEntryView),
(@iAccount, @iIdActionEntryView),
(@iStandard, @iIdActionEntryView),
(@iUnconfirmed, @iIdActionEntryView),
(@iPending, @iIdActionEntryView),
(@iModerator, @iIdActionEntryView),
(@iAdministrator, @iIdActionEntryView),
(@iPremium, @iIdActionEntryView),

-- set entry thumb
(@iStandard, @iIdActionSetThumb),
(@iModerator, @iIdActionSetThumb),
(@iAdministrator, @iIdActionSetThumb),
(@iPremium, @iIdActionSetThumb),

-- edit any entry
(@iModerator, @iIdActionEntryEditAny),
(@iAdministrator, @iIdActionEntryEditAny),

-- delete any entry
(@iAdministrator, @iIdActionEntryDeleteAny);


-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_tasks', '_bx_tasks', @iSearchOrder + 1, 'BxTasksSearchResult', 'modules/boonex/tasks/classes/BxTasksSearchResult.php'),
('bx_tasks_cmts', '_bx_tasks_cmts', @iSearchOrder + 2, 'BxTasksCmtsSearchResult', 'modules/boonex/tasks/classes/BxTasksCmtsSearchResult.php');

-- CONNECTIONS
INSERT INTO `sys_objects_connection` (`object`, `table`, `profile_initiator`, `profile_content`, `type`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_assignments', 'bx_tasks_assignments', 1, 0, 'one-way', '', '');


-- CATEGORY
INSERT INTO `sys_objects_category` (`object`, `module`, `search_object`, `form_object`, `list_name`, `table`, `field`, `join`, `where`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_cats', 'bx_tasks', 'bx_tasks', 'bx_tasks', 'bx_tasks_cats', 'bx_tasks_tasks', 'cat', 'INNER JOIN `sys_profiles` ON (`sys_profiles`.`id` = ABS(`bx_tasks_tasks`.`author`))', 'AND `sys_profiles`.`status` = ''active''', '', '');

-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_tasks', 'bx_tasks', '_bx_tasks', 'page.php?i=tasks-home', 'tasks', 'SELECT COUNT(*) FROM `bx_tasks_tasks` WHERE 1 AND `status` = ''active'' AND `status_admin` = ''active''', @iMaxOrderStats + 1);

-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_tasks_growth', '_bx_tasks_chart_growth', 'bx_tasks_tasks', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_tasks_growth_speed', '_bx_tasks_chart_growth_speed', 'bx_tasks_tasks', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_administration', 'Sql', 'SELECT `tt`.*, `tp`.`id` AS `context_id`, `tp`.`type` AS `context_module` FROM `bx_tasks_tasks` AS `tt` INNER JOIN `sys_profiles` AS `tp` ON ABS(`tt`.`allow_view_to`)=`tp`.`id` WHERE 1 ', 'bx_tasks_tasks', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'tt`.`title,tt`.`text', '', 'like', 'reports', '', 192, 'BxTasksGridAdministration', 'modules/boonex/tasks/classes/BxTasksGridAdministration.php'),
('bx_tasks_common', 'Sql', 'SELECT `tt`.*, `tp`.`id` AS `context_id`, `tp`.`type` AS `context_module` FROM `bx_tasks_tasks` AS `tt` INNER JOIN `sys_profiles` AS `tp` ON ABS(`tt`.`allow_view_to`)=`tp`.`id` WHERE 1 ', 'bx_tasks_tasks', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'tt`.`title,tt`.`text', '', 'like', '', '', 2147483647, 'BxTasksGridCommon', 'modules/boonex/tasks/classes/BxTasksGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_tasks_administration', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_tasks_administration', 'switcher', '_bx_tasks_grid_column_title_adm_active', '8%', 0, 0, '', 2),
('bx_tasks_administration', 'reports', '_sys_txt_reports_title', '5%', 0, 0, '', 3),
('bx_tasks_administration', 'context_module', '_bx_tasks_grid_column_title_adm_context_module', '10%', 0, 0, '', 4),
('bx_tasks_administration', 'title', '_bx_tasks_grid_column_title_adm_title', '25%', 0, 25, '', 5),
('bx_tasks_administration', 'added', '_bx_tasks_grid_column_title_adm_added', '10%', 1, 25, '', 6),
('bx_tasks_administration', 'author', '_bx_tasks_grid_column_title_adm_author', '20%', 0, 25, '', 7),
('bx_tasks_administration', 'actions', '', '20%', 0, 0, '', 8),

('bx_tasks_common', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_tasks_common', 'switcher', '_bx_tasks_grid_column_title_adm_active', '8%', 0, 0, '', 2),
('bx_tasks_common', 'title', '_bx_tasks_grid_column_title_adm_title', '35%', 0, 35, '', 3),
('bx_tasks_common', 'context_module', '_bx_tasks_grid_column_title_adm_context_module', '10%', 0, 0, '', 4),
('bx_tasks_common', 'added', '_bx_tasks_grid_column_title_adm_added', '10%', 1, 25, '', 5),
('bx_tasks_common', 'status_admin', '_bx_tasks_grid_column_title_adm_status_admin', '15%', 0, 16, '', 6),
('bx_tasks_common', 'actions', '', '20%', 0, 0, '', 7);


INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_tasks_administration', 'bulk', 'delete', '_bx_tasks_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_tasks_administration', 'bulk', 'clear_reports', '_bx_tasks_grid_action_title_adm_clear_reports', '', 0, 1, 1),
('bx_tasks_administration', 'single', 'edit', '_bx_tasks_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_tasks_administration', 'single', 'delete', '_bx_tasks_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_tasks_administration', 'single', 'settings', '_bx_tasks_grid_action_title_adm_more_actions', 'cog', 1, 0, 3),
('bx_tasks_administration', 'single', 'audit_content', '_bx_tasks_grid_action_title_adm_audit_content', 'search', 1, 0, 4),
('bx_tasks_administration', 'single', 'clear_reports', '_bx_tasks_grid_action_title_adm_clear_reports', 'eraser', 1, 0, 5),

('bx_tasks_common', 'bulk', 'delete', '_bx_tasks_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_tasks_common', 'single', 'edit', '_bx_tasks_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_tasks_common', 'single', 'delete', '_bx_tasks_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_tasks_common', 'single', 'settings', '_bx_tasks_grid_action_title_adm_more_actions', 'cog', 1, 0, 3);

-- GRIDS: moderation time tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_time_administration', 'Sql', 'SELECT `ttt`.*, `tt`.`title`, `tp`.`id` AS `context_id`, `tp`.`type` AS `context_module` FROM `bx_tasks_time_track` AS `ttt` INNER JOIN `bx_tasks_tasks` AS `tt` ON `ttt`.`object_id`=`tt`.`id` INNER JOIN `sys_profiles` AS `tp` ON ABS(`tt`.`allow_view_to`)=`tp`.`id` WHERE 1 ', 'bx_tasks_time_track', 'id', 'value_date', '', '', 100, NULL, 'start', '', 'ttt`.`text,tt`.`title,tt`.`text', '', 'like', 'date', '', 192, 'BxTasksGridTimeAdministration', 'modules/boonex/tasks/classes/BxTasksGridTimeAdministration.php'),
('bx_tasks_time_common', 'Sql', 'SELECT `ttt`.*, `tt`.`title`, `tp`.`id` AS `context_id`, `tp`.`type` AS `context_module` FROM `bx_tasks_time_track` AS `ttt` INNER JOIN `bx_tasks_tasks` AS `tt` ON `ttt`.`object_id`=`tt`.`id` INNER JOIN `sys_profiles` AS `tp` ON ABS(`tt`.`allow_view_to`)=`tp`.`id` WHERE 1 ', 'bx_tasks_time_track', 'id', 'value_date', '', '', 100, NULL, 'start', '', 'ttt`.`text,tt`.`title,tt`.`text', '', 'like', 'date', '', 2147483647, 'BxTasksGridTimeCommon', 'modules/boonex/tasks/classes/BxTasksGridTimeCommon.php'),

('bx_tasks_time_context_administration', 'Sql', 'SELECT `ttt`.*, `tt`.`title` FROM `bx_tasks_time_track` AS `ttt` INNER JOIN `bx_tasks_tasks` AS `tt` ON `ttt`.`object_id`=`tt`.`id` WHERE 1 ', 'bx_tasks_time_track', 'id', 'value_date', '', '', 50, NULL, 'start', '', 'ttt`.`text,tt`.`title,tt`.`text', '', 'like', 'date', '', 192, 'BxTasksGridTimeContextAdministration', 'modules/boonex/tasks/classes/BxTasksGridTimeContextAdministration.php'),
('bx_tasks_time_context_common', 'Sql', 'SELECT `ttt`.*, `tt`.`title` FROM `bx_tasks_time_track` AS `ttt` INNER JOIN `bx_tasks_tasks` AS `tt` ON `ttt`.`object_id`=`tt`.`id` WHERE 1 ', 'bx_tasks_time_track', 'id', 'value_date', '', '', 50, NULL, 'start', '', 'ttt`.`text,tt`.`title,tt`.`text', '', 'like', 'date', '', 2147483647, 'BxTasksGridTimeContextCommon', 'modules/boonex/tasks/classes/BxTasksGridTimeContextCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_tasks_time_administration', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_tasks_time_administration', 'author_id', '_bx_tasks_grid_column_title_tm_author_id', '18%', 0, 0, '', 2),
('bx_tasks_time_administration', 'context_module', '_bx_tasks_grid_column_title_tm_context_module', '10%', 0, 0, '', 3),
('bx_tasks_time_administration', 'context_id', '_bx_tasks_grid_column_title_tm_context_id', '15%', 0, 0, '', 4),
('bx_tasks_time_administration', 'object_id', '_bx_tasks_grid_column_title_tm_object_id', '15%', 0, 0, '', 5),
('bx_tasks_time_administration', 'text', '_bx_tasks_grid_column_title_tm_text', '15%', 0, 16, '', 6),
('bx_tasks_time_administration', 'value', '_bx_tasks_grid_column_title_tm_value', '10%', 0, 0, '', 7),
('bx_tasks_time_administration', 'value_date', '_bx_tasks_grid_column_title_tm_value_date', '15%', 0, 0, '', 8),

('bx_tasks_time_common', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_tasks_time_common', 'context_module', '_bx_tasks_grid_column_title_tm_context_module', '10%', 0, 0, '', 2),
('bx_tasks_time_common', 'context_id', '_bx_tasks_grid_column_title_tm_context_id', '20%', 0, 0, '', 3),
('bx_tasks_time_common', 'object_id', '_bx_tasks_grid_column_title_tm_object_id', '23%', 0, 0, '', 4),
('bx_tasks_time_common', 'text', '_bx_tasks_grid_column_title_tm_text', '20%', 0, 32, '', 5),
('bx_tasks_time_common', 'value', '_bx_tasks_grid_column_title_tm_value', '10%', 0, 0, '', 6),
('bx_tasks_time_common', 'value_date', '_bx_tasks_grid_column_title_tm_value_date', '15%', 0, 0, '', 7),

('bx_tasks_time_context_administration', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_tasks_time_context_administration', 'author_id', '_bx_tasks_grid_column_title_tm_author_id', '28%', 0, 0, '', 2),
('bx_tasks_time_context_administration', 'object_id', '_bx_tasks_grid_column_title_tm_object_id', '30%', 0, 0, '', 3),
('bx_tasks_time_context_administration', 'text', '_bx_tasks_grid_column_title_tm_text', '15%', 0, 16, '', 4),
('bx_tasks_time_context_administration', 'value', '_bx_tasks_grid_column_title_tm_value', '10%', 0, 0, '', 5),
('bx_tasks_time_context_administration', 'value_date', '_bx_tasks_grid_column_title_tm_value_date', '15%', 0, 0, '', 6),

('bx_tasks_time_context_common', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_tasks_time_context_common', 'object_id', '_bx_tasks_grid_column_title_tm_object_id', '30%', 0, 0, '', 2),
('bx_tasks_time_context_common', 'text', '_bx_tasks_grid_column_title_tm_text', '25%', 0, 32, '', 3),
('bx_tasks_time_context_common', 'value', '_bx_tasks_grid_column_title_tm_value', '10%', 0, 0, '', 4),
('bx_tasks_time_context_common', 'value_date', '_bx_tasks_grid_column_title_tm_value_date', '15%', 0, 0, '', 5),
('bx_tasks_time_context_common', 'actions', '', '18%', 0, '', '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_tasks_time_administration', 'bulk', 'calculate', '_bx_tasks_grid_action_title_tm_calculate', '', 0, 0, 1),
('bx_tasks_time_administration', 'bulk', 'delete', '_bx_tasks_grid_action_title_tm_delete', '', 0, 1, 2),

('bx_tasks_time_common', 'bulk', 'calculate', '_bx_tasks_grid_action_title_tm_calculate', '', 0, 0, 1),
('bx_tasks_time_common', 'bulk', 'delete', '_bx_tasks_grid_action_title_tm_delete', '', 0, 1, 2),

('bx_tasks_time_context_administration', 'bulk', 'calculate', '_bx_tasks_grid_action_title_tm_calculate', '', 0, 0, 1),
('bx_tasks_time_context_administration', 'bulk', 'delete', '_bx_tasks_grid_action_title_tm_delete', '', 0, 1, 2),

('bx_tasks_time_context_common', 'independent', 'add', '_bx_tasks_grid_action_title_tm_add', '', 0, 0, 1),
('bx_tasks_time_context_common', 'bulk', 'calculate', '_bx_tasks_grid_action_title_tm_calculate', '', 0, 0, 1),
('bx_tasks_time_context_common', 'bulk', 'delete', '_bx_tasks_grid_action_title_tm_delete', '', 0, 1, 2),
('bx_tasks_time_context_common', 'single', 'edit', '_bx_tasks_grid_action_title_tm_edit', 'pencil-alt', 1, 0, 1),
('bx_tasks_time_context_common', 'single', 'delete', '_bx_tasks_grid_action_title_tm_delete', 'remove', 1, 1, 2);

-- GRIDS: pre lists and values
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_pre_values', 'Sql', 'SELECT `tpv`.*, `tpl`.`title` AS `list_title`, `tpl`.`use_color` AS `list_color`, `tpl`.`use_multiselect` AS `list_multiselect` FROM `bx_tasks_pre_values` AS `tpv` INNER JOIN `bx_tasks_pre_lists` AS `tpl` ON `tpv`.`list`=`tpl`.`name` WHERE 1 ', 'bx_tasks_pre_values', 'id', 'order', 'active', '', 20, NULL, 'start', '', 'tpv`.`name,tpv`.`title,tpl`.`title', '', 'like', '', '', 2147483647, 'BxTasksGridPreValues', 'modules/boonex/tasks/classes/BxTasksGridPreValues.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_tasks_pre_values', 'checkbox', '_sys_select', '3%', 0, 0, '', 1),
('bx_tasks_pre_values', 'order', '', '3%', 0, 0, '', 2),
('bx_tasks_pre_values', 'switcher', '_bx_tasks_grid_column_title_pv_active', '9%', 0, 0, '', 3),
('bx_tasks_pre_values', 'title', '_bx_tasks_grid_column_title_pv_title', '65%', 0, 0, '', 4),
('bx_tasks_pre_values', 'actions', '', '20%', 0, 0, '', 5);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_tasks_pre_values', 'independent', 'add', '_bx_tasks_grid_action_title_pv_add', '', 0, 0, 1),
('bx_tasks_pre_values', 'bulk', 'activate', '_bx_tasks_grid_action_title_pv_activate', '', 0, 0, 1),
('bx_tasks_pre_values', 'bulk', 'deactivate', '_bx_tasks_grid_action_title_pv_deactivate', '', 0, 0, 2),
('bx_tasks_pre_values', 'bulk', 'delete', '_bx_tasks_grid_action_title_pv_delete', '', 0, 1, 3),
('bx_tasks_pre_values', 'single', 'edit', '_bx_tasks_grid_action_title_pv_edit', 'pencil-alt', 1, 0, 1),
('bx_tasks_pre_values', 'single', 'delete', '_bx_tasks_grid_action_title_pv_delete', 'remove', 1, 1, 2);


-- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_html5', 1, 'BxTasksUploaderHTML5', 'modules/boonex/tasks/classes/BxTasksUploaderHTML5.php'),
('bx_tasks_record_video', 1, 'BxTasksUploaderRecordVideo', 'modules/boonex/tasks/classes/BxTasksUploaderRecordVideo.php'),
('bx_tasks_photos_html5', 1, 'BxTasksUploaderHTML5Attach', 'modules/boonex/tasks/classes/BxTasksUploaderHTML5Attach.php'),
('bx_tasks_videos_html5', 1, 'BxTasksUploaderHTML5Attach', 'modules/boonex/tasks/classes/BxTasksUploaderHTML5Attach.php'),
('bx_tasks_videos_record_video', 1, 'BxTasksUploaderRecordVideoAttach', 'modules/boonex/tasks/classes/BxTasksUploaderRecordVideoAttach.php'),
('bx_tasks_files_html5', 1, 'BxTasksUploaderHTML5Attach', 'modules/boonex/tasks/classes/BxTasksUploaderHTML5Attach.php');

-- ALERTS

INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_tasks', 'BxTasksAlertsResponse', 'modules/boonex/tasks/classes/BxTasksAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('profile', 'delete', @iHandler),
('profile', 'search_by_term', @iHandler),

('bx_tasks_videos_mp4', 'transcoded', @iHandler);


-- CRON
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_tasks_publishing', '* * * * *', 'BxTasksCronPublishing', 'modules/boonex/tasks/classes/BxTasksCronPublishing.php', ''),
('bx_tasks_expiring', '* * * * *', 'BxTasksCronExpiring', 'modules/boonex/tasks/classes/BxTasksCronExpiring.php', '');

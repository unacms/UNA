
-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_files', '_bx_files', 'bx_files@modules/boonex/files/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_files', '_bx_files', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_files_enable_auto_approve', 'on', @iCategId, '_bx_files_option_enable_auto_approve', 'checkbox', '', '', '', 0),
('bx_files_summary_chars', '700', @iCategId, '_bx_files_option_summary_chars', 'digit', '', '', '', 1),
('bx_files_default_layout_mode', 'gallery', @iCategId, '_bx_files_option_default_layout_mode', 'select', '', '', 'gallery,table', 4),
('bx_files_show_link_to_preview', '', @iCategId, '_bx_files_option_link_to_preview', 'checkbox', '', '', '', 5),
('bx_files_max_nesting_level', '3', @iCategId, '_bx_files_option_max_nesting_level', 'digit', '', '', '', 6),
('bx_files_max_bulk_download_size', '100', @iCategId, '_bx_files_option_max_bulk_download_size', 'digit', '', '', '', 7),
('bx_files_allowed_ext', '', @iCategId, '_bx_files_option_allowed_ext', 'digit', '', '', '', 8),
('bx_files_per_page_browse', '12', @iCategId, '_bx_files_option_per_page_browse', 'digit', '', '', '', 10),
('bx_files_per_page_profile', '6', @iCategId, '_bx_files_option_per_page_profile', 'digit', '', '', '', 12),
('bx_files_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', 'digit', '', '', '', 15),
('bx_files_per_page_for_favorites_lists', '5', @iCategId, '_bx_files_option_per_page_for_favorites_lists', 'digit', '', '', '', 17),
('bx_files_rss_num', '10', @iCategId, '_bx_files_option_rss_num', 'digit', '', '', '', 20),
('bx_files_searchable_fields', 'title,desc,data', @iCategId, '_bx_files_option_searchable_fields', 'list', '', '', 'a:2:{s:6:"module";s:8:"bx_files";s:6:"method";s:21:"get_searchable_fields";}', 30);


-- PAGE: create entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_create_entry', '_bx_files_page_title_sys_create_entry', '_bx_files_page_title_create_entry', 'bx_files', 5, 2147483647, 1, 'create-file', 'page.php?i=create-file', '', '', '', 0, 1, 0, 'BxFilesPageBrowse', 'modules/boonex/files/classes/BxFilesPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_files_create_entry', 1, 'bx_files', '_bx_files_page_block_title_create_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_files";s:6:"method";s:13:"entity_create";}', 0, 1, 1);


-- PAGE: edit entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_edit_entry', '_bx_files_page_title_sys_edit_entry', '_bx_files_page_title_edit_entry', 'bx_files', 5, 2147483647, 1, 'edit-file', '', '', '', '', 0, 1, 0, 'BxFilesPageEntry', 'modules/boonex/files/classes/BxFilesPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_files_edit_entry', 1, 'bx_files', '_bx_files_page_block_title_edit_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_files";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);


-- PAGE: delete entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_delete_entry', '_bx_files_page_title_sys_delete_entry', '_bx_files_page_title_delete_entry', 'bx_files', 5, 2147483647, 1, 'delete-file', '', '', '', '', 0, 1, 0, 'BxFilesPageEntry', 'modules/boonex/files/classes/BxFilesPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_files_delete_entry', 1, 'bx_files', '_bx_files_page_block_title_delete_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_files";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);


-- PAGE: view entry

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_view_entry', '_bx_files_page_title_sys_view_entry', '_bx_files_page_title_view_entry', 'bx_files', 12, 2147483647, 1, 'view-file', '', '', '', '', 0, 1, 0, 'BxFilesPageEntry', 'modules/boonex/files/classes/BxFilesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_files_view_entry', 2, 'bx_files', '', '_bx_files_page_block_title_entry_text', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:17:\"entity_text_block\";}', 0, 0, 1, 1),
('bx_files_view_entry', 1, 'bx_files', '', '_bx_files_page_block_title_entry_file_preview', 3, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:19:\"entity_file_preview\";}', 0, 0, 0, 0),
('bx_files_view_entry', 3, 'bx_files', '', '_bx_files_page_block_title_entry_author', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:13:\"entity_author\";}', 0, 0, 1, 2),
('bx_files_view_entry', 3, 'bx_files', '_bx_files_page_block_title_sys_entry_context', '_bx_files_page_block_title_entry_context', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:14:\"entity_context\";}', 0, 0, 1, 1),
('bx_files_view_entry', 3, 'bx_files', '', '_bx_files_page_block_title_entry_info', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:11:\"entity_info\";}', 0, 0, 1, 3),
('bx_files_view_entry', 3, 'bx_files', '', '_bx_files_page_block_title_entry_location', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:15:\"entity_location\";}', 0, 0, 0, 0),
('bx_files_view_entry', 2, 'bx_files', '', '_bx_files_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:18:\"entity_all_actions\";}', 0, 0, 1, 2),
('bx_files_view_entry', 4, 'bx_files', '', '_bx_files_page_block_title_entry_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:14:\"entity_actions\";}', 0, 0, 0, 0),
('bx_files_view_entry', 4, 'bx_files', '', '_bx_files_page_block_title_entry_social_sharing', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:21:\"entity_social_sharing\";}', 0, 0, 0, 0),
('bx_files_view_entry', 2, 'bx_files', '', '_bx_files_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 1, 3),
('bx_files_view_entry', 3, 'bx_files', '', '_bx_files_page_block_title_entry_location', 3, 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:13:\"locations_map\";s:6:\"params\";a:2:{i:0;s:8:\"bx_files\";i:1;s:4:\"{id}\";}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', 0, 0, 1, 4),
('bx_files_view_entry', 2, 'bx_files', '', '_bx_files_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);


-- PAGE: view entry comments

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_view_entry_comments', '_bx_files_page_title_sys_view_entry_comments', '_bx_files_page_title_view_entry_comments', 'bx_files', 5, 2147483647, 1, 'view-file-comments', '', '', '', '', 0, 1, 0, 'BxFilesPageEntry', 'modules/boonex/files/classes/BxFilesPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_files_view_entry_comments', 1, 'bx_files', '_bx_files_page_block_title_entry_comments', '_bx_files_page_block_title_entry_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 1);


-- PAGE: popular entries

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_popular', '_bx_files_page_title_sys_entries_popular', '_bx_files_page_title_entries_popular', 'bx_files', 5, 2147483647, 1, 'files-popular', 'page.php?i=files-popular', '', '', '', 0, 1, 0, 'BxFilesPageBrowse', 'modules/boonex/files/classes/BxFilesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_files_popular', 1, 'bx_files', '_bx_files_page_block_title_popular_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:14:"browse_popular";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);


-- PAGE: top entries

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_top', '_bx_files_page_title_sys_entries_top', '_bx_files_page_title_entries_top', 'bx_files', 5, 2147483647, 1, 'files-top', 'page.php?i=files-top', '', '', '', 0, 1, 0, 'BxFilesPageBrowse', 'modules/boonex/files/classes/BxFilesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_files_top', 1, 'bx_files', '_bx_files_page_block_title_top_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:10:"browse_top";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);


-- PAGE: recently updated entries

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_updated', '_bx_files_page_title_sys_entries_updated', '_bx_files_page_title_entries_updated', 'bx_files', 5, 2147483647, 1, 'files-updated', 'page.php?i=files-updated', '', '', '', 0, 1, 0, 'BxFilesPageBrowse', 'modules/boonex/files/classes/BxFilesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_files_updated', 1, 'bx_files', '_bx_files_page_block_title_updated_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:14:"browse_updated";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);


-- PAGE: entries of author

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_author', 'files-author', '_bx_files_page_title_sys_entries_of_author', '_bx_files_page_title_entries_of_author', 'bx_files', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxFilesPageAuthor', 'modules/boonex/files/classes/BxFilesPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
-- ('bx_files_author', 1, 'bx_files', '', '_bx_files_page_block_title_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:18:\"my_entries_actions\";}', 0, 0, 1, 1),
('bx_files_author', 1, 'bx_files', '_bx_files_page_block_title_sys_favorites_of_author', '_bx_files_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:21:"browse_favorite_lists";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1, 2),
('bx_files_author', 1, 'bx_files', '_bx_files_page_block_title_sys_entries_of_author', '_bx_files_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:13:\"browse_author\";}', 0, 0, 1, 3),
('bx_files_author', 1, 'bx_files', '_bx_files_page_block_title_sys_entries_in_context', '_bx_files_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:14:"browse_context";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";i:0;a:1:{s:13:"empty_message";b:0;}}}', 0, 0, 1, 4);


-- PAGE: favorites by list
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_favorites', '_bx_files_page_title_sys_entries_favorites', '_bx_files_page_title_entries_favorites', 'bx_files', 12, 2147483647, 1, 'files-favorites', 'page.php?i=files-favorites', '', '', '', 0, 1, 0, 'BxFilesPageListEntry', 'modules/boonex/files/classes/BxFilesPageListEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_files_favorites', 2, 'bx_files', '_bx_files_page_block_title_sys_favorites_entries', '_bx_files_page_block_title_favorites_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:15:"browse_favorite";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1),
('bx_files_favorites', 3, 'bx_files', '', '_bx_files_page_block_title_favorites_entries_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_files";s:6:"method";s:19:"favorites_list_info";}', 0, 0, 0),
('bx_files_favorites', 3, 'bx_files', '', '_bx_files_page_block_title_favorites_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_files";s:6:"method";s:22:"favorites_list_actions";}', 0, 0, 1);


-- PAGE: entries in context
 INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
 ('bx_files_context', 'files-context', '_bx_files_page_title_sys_entries_in_context', '_bx_files_page_title_entries_in_context', 'bx_files', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxFilesPageAuthor', 'modules/boonex/files/classes/BxFilesPageAuthor.php');
 
 INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
 ('bx_files_context', 1, 'bx_files', '_bx_files_page_block_title_sys_entries_in_context', '_bx_files_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:14:\"browse_context\";}', 0, 0, 1, 1);
 
-- PAGE: module home

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_home', 'files-home', '_bx_files_page_title_sys_home', '_bx_files_page_title_home', 'bx_files', 2, 2147483647, 1, 'page.php?i=files-home', '', '', '', 0, 1, 0, 'BxFilesPageBrowse', 'modules/boonex/files/classes/BxFilesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_files_home', 1, 'bx_files', '', '_bx_files_page_block_title_featured_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, 1, 0),
('bx_files_home', 1, 'bx_files', '', '_bx_files_page_block_title_recent_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:13:"browse_public";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, 1, 1),
('bx_files_home', 2, 'bx_files', '', '_bx_files_page_block_title_popular_keywords', 11, 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:14:\"keywords_cloud\";s:6:\"params\";a:2:{i:0;s:8:\"bx_files\";i:1;s:8:\"bx_files\";}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', 0, 1, 1, 0),
('bx_files_home', 2, 'bx_files', '', '_bx_files_page_block_title_cats', 11, 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:15:\"categories_list\";s:6:\"params\";a:2:{i:0;s:13:\"bx_files_cats\";i:1;a:1:{s:10:\"show_empty\";b:1;}}s:5:\"class\";s:20:\"TemplServiceCategory\";}', 0, 1, 1, 1);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_search', '_bx_files_page_title_sys_entries_search', '_bx_files_page_title_entries_search', 'bx_files', 5, 2147483647, 1, 'files-search', 'page.php?i=files-search', '', '', '', 0, 1, 0, 'BxFilesPageBrowse', 'modules/boonex/files/classes/BxFilesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_files_search', 1, 'bx_files', '_bx_files_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:8:"bx_files";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_files_search', 1, 'bx_files', '_bx_files_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:8:"bx_files";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 2),
('bx_files_search', 1, 'bx_files', '_bx_files_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:13:"bx_files_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_files_search', 1, 'bx_files', '_bx_files_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:13:"bx_files_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: module manage own
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_manage', '_bx_files_page_title_sys_manage', '_bx_files_page_title_manage', 'bx_files', 5, 2147483647, 1, 'files-manage', 'page.php?i=files-manage', '', '', '', 0, 1, 0, 'BxFilesPageBrowse', 'modules/boonex/files/classes/BxFilesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_files_manage', 1, 'bx_files', '_bx_files_page_block_title_system_manage', '_bx_files_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:12:\"manage_tools\";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_administration', '_bx_files_page_title_sys_manage_administration', '_bx_files_page_title_manage', 'bx_files', 5, 192, 1, 'files-administration', 'page.php?i=files-administration', '', '', '', 0, 1, 0, 'BxFilesPageBrowse', 'modules/boonex/files/classes/BxFilesPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_files_administration', 1, 'bx_files', '_bx_files_page_block_title_system_manage_administration', '_bx_files_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:12:\"manage_tools\";s:6:\"params\";a:1:{i:0;s:14:\"administration\";}}', 0, 1, 0);

-- PAGE: add block to homepage

SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', 1, 'bx_files', '_bx_files_page_block_title_recent_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:13:"browse_public";s:6:"params";a:2:{i:0;b:0;i:1;b:0;}}}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 3;
SET @iPBCellGroup = 4;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_files', '_bx_files_page_block_title_sys_my_entries', '_bx_files_page_block_title_my_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:13:"browse_author";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:3:{s:8:"per_page";s:25:"bx_files_per_page_profile";s:13:"empty_message";b:0;s:10:"no_toolbar";b:1;}}}', 0, 0, 0);

-- PAGE: service blocks

SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('', 0, 'bx_files', '', '_bx_files_page_block_title_recent_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:13:\"browse_public\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:7:\"gallery\";s:13:\"empty_message\";b:1;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 1),

('', 0, 'bx_files', '', '_bx_files_page_block_title_popular_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_files";s:6:"method";s:14:"browse_popular";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, 'bx_files', '_bx_files_page_block_title_sys_recent_entries_view_showcase', '_bx_files_page_block_title_recent_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:13:\"browse_public\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 3),
('', 0, 'bx_files', '_bx_files_page_block_title_sys_popular_entries_view_showcase', '_bx_files_page_block_title_popular_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:14:\"browse_popular\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 4),
('', 0, 'bx_files', '_bx_files_page_block_title_sys_featured_entries_view_showcase', '_bx_files_page_block_title_featured_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_files\";s:6:\"method\";s:15:\"browse_featured\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 5);


-- MENU: add to site menu

SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_files', 'files-home', '_bx_files_menu_item_title_system_entries_home', '_bx_files_menu_item_title_entries_home', 'page.php?i=files-home', '', '', 'far file', 'bx_files_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu

SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_files', 'files-home', '_bx_files_menu_item_title_system_entries_home', '_bx_files_menu_item_title_entries_home', 'page.php?i=files-home', '', '', 'far file', 'bx_files_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: add to "add content" menu

SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_files', 'create-file', '_bx_files_menu_item_title_system_create_entry', '_bx_files_menu_item_title_create_entry', 'page.php?i=create-file', '', '', 'far file', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);


-- MENU: actions menu for view entry 

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_view', '_bx_files_menu_title_view_entry', 'bx_files_view', 'bx_files', 9, 0, 1, 'BxFilesMenuView', 'modules/boonex/files/classes/BxFilesMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_files_view', 'bx_files', '_bx_files_menu_set_title_view_entry', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_files_view', 'bx_files', 'download-file', '_bx_files_menu_item_title_system_download_file', '_bx_files_menu_item_title_download_file', 'modules/?r=files/download/{file_download_token}/{content_id}.{file_ext}', '', '_blank', 'download', '', 2147483647, 1, 0, 1),
('bx_files_view', 'bx_files', 'edit-file', '_bx_files_menu_item_title_system_edit_entry', '_bx_files_menu_item_title_edit_entry', 'page.php?i=edit-file&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 1, 0, 2),
('bx_files_view', 'bx_files', 'delete-file', '_bx_files_menu_item_title_system_delete_entry', '_bx_files_menu_item_title_delete_entry', 'page.php?i=delete-file&id={content_id}', '', '', 'remove', '', 2147483647, 1, 0, 3),
('bx_files_view', 'bx_files', 'approve', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 2147483647, 1, 0, 4);


-- MENU: all actions menu for view entry 

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_view_actions', '_sys_menu_title_view_actions', 'bx_files_view_actions', 'bx_files', 15, 0, 1, 'BxFilesMenuViewActions', 'modules/boonex/files/classes/BxFilesMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_files_view_actions', 'bx_files', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_files_view_actions', 'bx_files', 'download-file', '_bx_files_menu_item_title_system_download_file', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_files_view_actions', 'bx_files', 'edit-file', '_bx_files_menu_item_title_system_edit_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_files_view_actions', 'bx_files', 'delete-file', '_bx_files_menu_item_title_system_delete_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30), 
('bx_files_view_actions', 'bx_files', 'approve', '_sys_menu_item_title_system_va_approve', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_files_view_actions', 'bx_files', 'set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_files'', content_id: {content_id}});', '', 'check-circle', '', '', 0, 2147483647, 'a:2:{s:6:"module";s:8:"bx_files";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 50),
('bx_files_view_actions', 'bx_files', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_files_view_actions', 'bx_files', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_files_view_actions', 'bx_files', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 220),
('bx_files_view_actions', 'bx_files', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 225),
('bx_files_view_actions', 'bx_files', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 230),
('bx_files_view_actions', 'bx_files', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 240),
('bx_files_view_actions', 'bx_files', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 250),
('bx_files_view_actions', 'bx_files', 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 260),
('bx_files_view_actions', 'bx_files', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_files_view_actions', 'bx_files', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', '', 0, 2147483647, '', 1, 0, 280),
('bx_files_view_actions', 'bx_files', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_files&content_id={content_id}', '', '', 'history', '', '', 0, 192, '', 1, 0, 290),
('bx_files_view_actions', 'bx_files', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_files_view_actions', 'bx_files', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);


-- MENU: actions menu for view inline entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_files_view_inline', '_bx_files_menu_title_view_inline', 'bx_files_view_inline', 'bx_files', 15, 0, 1, 'BxFilesMenuViewActionsInline', 'modules/boonex/files/classes/BxFilesMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
('bx_files_view_inline', 'bx_files', '_bx_files_menu_set_title_view_inline', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('bx_files_view_inline', 'bx_files', 'favorite', '_sys_menu_item_title_system_va_favorite', '_sys_menu_item_title_va_favorite', '', '', '', '', '', 2147483647, 0, 0, 1),
('bx_files_view_inline', 'bx_files', 'bookmark', '_bx_files_menu_item_title_system_bookmark', '_bx_files_menu_item_title_bookmark', '', '{js_object}.bookmark({content_id}, this); return false;', '', 'far star', '', 2147483647, 1, 0, 2),
('bx_files_view_inline', 'bx_files', 'download-file', '_bx_files_menu_item_title_system_download_file', '_bx_files_menu_item_title_download_file', 'modules/?r=files/download/{file_download_token}/{content_id}.{file_ext}', '', '_blank', 'download', '', 2147483647, 1, 0, 3),
('bx_files_view_inline', 'bx_files', 'delete-file-quick', '_bx_files_menu_item_title_system_delete_entry', '_bx_files_menu_item_title_delete_entry', 'page.php?i=delete-file&id={content_id}', '{js_object}.delete({content_id}); return false;', '', 'remove', '', 2147483647, 1, 0, 4),
('bx_files_view_inline', 'bx_files', 'move-to', '_bx_files_menu_item_title_system_move_to_entry', '_bx_files_menu_item_title_move_to_entry', '', '{js_object}.moveTo({content_id}); return false;', '', 'file-export', '', 2147483647, 1, 0, 5),
('bx_files_view_inline', 'bx_files', 'edit-title', '_bx_files_menu_item_title_system_edit_title', '_bx_files_menu_item_title_edit_title', 'page.php?i=edit-file&id={content_id}', '{js_object}.edit({content_id}); return false;', '', 'pencil-alt', '', 2147483647, 1, 0, 6),
('bx_files_view_inline', 'bx_files', 'preview', '_bx_files_menu_item_title_system_info_entry', '_bx_files_menu_item_title_info_entry', '', '{js_object}.info({content_id}); return false;', '', 'info', '', 2147483647, 1, 0, 7),
('bx_files_view_inline', 'bx_files', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', 2147483647, 1, 0, 8),
('bx_files_view_inline', 'bx_files', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', 2147483647, 1, 0, 9999);



-- MENU: actions menu for my entries

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_my', '_bx_files_menu_title_entries_my', 'bx_files_my', 'bx_files', 9, 0, 1, 'BxFilesMenu', 'modules/boonex/files/classes/BxFilesMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_files_my', 'bx_files', '_bx_files_menu_set_title_entries_my', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_files_my', 'bx_files', 'create-file', '_bx_files_menu_item_title_system_create_entry', '_bx_files_menu_item_title_create_entry', 'page.php?i=create-file', '', '', 'file-plus', '', 2147483647, 1, 0, 0);


-- MENU: module sub-menu

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_submenu', '_bx_files_menu_title_submenu', 'bx_files_submenu', 'bx_files', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_files_submenu', 'bx_files', '_bx_files_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_files_submenu', 'bx_files', 'files-home', '_bx_files_menu_item_title_system_entries_public', '_bx_files_menu_item_title_entries_public', 'page.php?i=files-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_files_submenu', 'bx_files', 'files-popular', '_bx_files_menu_item_title_system_entries_popular', '_bx_files_menu_item_title_entries_popular', 'page.php?i=files-popular', '', '', '', '', 2147483647, 1, 1, 2),
('bx_files_submenu', 'bx_files', 'files-top', '_bx_files_menu_item_title_system_entries_top', '_bx_files_menu_item_title_entries_top', 'page.php?i=files-top', '', '', '', '', 2147483647, 1, 1, 3),
('bx_files_submenu', 'bx_files', 'files-search', '_bx_files_menu_item_title_system_entries_search', '_bx_files_menu_item_title_entries_search', 'page.php?i=files-search', '', '', '', '', 2147483647, 1, 1, 4),
('bx_files_submenu', 'bx_files', 'files-manage', '_bx_files_menu_item_title_system_entries_manage', '_bx_files_menu_item_title_entries_manage', 'page.php?i=files-manage', '', '', '', '', 2147483646, 1, 1, 5);

-- MENU: sub-menu for view entry

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_view_submenu', '_bx_files_menu_title_view_entry_submenu', 'bx_files_view_submenu', 'bx_files', 8, 0, 1, 'BxFilesMenuView', 'modules/boonex/files/classes/BxFilesMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_files_view_submenu', 'bx_files', '_bx_files_menu_set_title_view_entry_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_files_view_submenu', 'bx_files', 'view-file', '_bx_files_menu_item_title_system_view_entry', '_bx_files_menu_item_title_view_entry_submenu_entry', 'page.php?i=view-file&id={content_id}', '', '', '', '', 2147483647, 0, 0, 1),
('bx_files_view_submenu', 'bx_files', 'view-file-comments', '_bx_files_menu_item_title_system_view_entry_comments', '_bx_files_menu_item_title_view_entry_submenu_comments', 'page.php?i=view-file-comments&id={content_id}', '', '', '', '', 2147483647, 0, 0, 2);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_files_snippet_meta', 'bx_files', 15, 0, 1, 'BxFilesMenuSnippetMeta', 'modules/boonex/files/classes/BxFilesMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_files_snippet_meta', 'bx_files', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_files_snippet_meta', 'bx_files', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, 1, 0, 1, 1),
('bx_files_snippet_meta', 'bx_files', 'size', '_bx_files_menu_item_title_system_sm_size', '_bx_files_menu_item_title_sm_size', '', '', '', '', '', 2147483647, 1, 0, 1, 2),
('bx_files_snippet_meta', 'bx_files', 'author', '_sys_menu_item_title_system_sm_author', '_sys_menu_item_title_sm_author', '', '', '', '', '', 2147483647, 1, 0, 1, 3),
('bx_files_snippet_meta', 'bx_files', 'category', '_sys_menu_item_title_system_sm_category', '_sys_menu_item_title_sm_category', '', '', '', '', '', 2147483647, 0, 0, 1, 4),
('bx_files_snippet_meta', 'bx_files', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, 0, 0, 1, 5),
('bx_files_snippet_meta', 'bx_files', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, 0, 0, 1, 6),
('bx_files_snippet_meta', 'bx_files', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, 0, 0, 1, 7);

-- MENU: profile stats
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_files', 'profile-stats-my-files', '_bx_files_menu_item_title_system_manage_my_files', '_bx_files_menu_item_title_manage_my_files', 'page.php?i=files-author&profile_id={member_id}', '', '_self', 'far file', 'a:2:{s:6:"module";s:8:"bx_files";s:6:"method";s:41:"get_menu_addon_manage_tools_profile_stats";}', '', 2147483646, 1, 0, @iNotifMenuOrder + 1);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_files_menu_manage_tools', '_bx_files_menu_title_manage_tools', 'bx_files_menu_manage_tools', 'bx_files', 6, 0, 1, 'BxFilesMenuManageTools', 'modules/boonex/files/classes/BxFilesMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_files_menu_manage_tools', 'bx_files', '_bx_files_menu_set_title_manage_tools', 0);

--INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
--('bx_files_menu_manage_tools', 'bx_files', 'delete-with-content', '_bx_files_menu_item_title_system_delete_with_content', '_bx_files_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 128, 1, 0, 0);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_files', 'files-administration', '_bx_files_menu_item_title_system_admt_files', '_bx_files_menu_item_title_admt_files', 'page.php?i=files-administration', '', '_self', 'far file', 'a:2:{s:6:"module";s:8:"bx_files";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- MENU: add menu item to profile & group based modules (trigger* menu sets are processed separately upon modules enable/disable)

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_files', 'files-author', '_bx_files_menu_item_title_system_view_entries_author', '_bx_files_menu_item_title_view_entries_author', 'page.php?i=files-author&profile_id={profile_id}', '', '', 'far file', '', 2147483647, 1, 0, 0),
('trigger_group_view_submenu', 'bx_files', 'files-context', '_bx_files_menu_item_title_system_view_entries_in_context', '_bx_files_menu_item_title_view_entries_in_context', 'page.php?i=files-context&profile_id={profile_id}', '', '', 'far file', '', 2147483647, 1, 0, 0);

-- PRIVACY 

INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_files_allow_view_to', 'bx_files', 'view', '_bx_files_form_entry_input_allow_view_to', '3', 'bx_files_main', 'id', 'author', 'BxFilesPrivacy', 'modules/boonex/files/classes/BxFilesPrivacy.php'),
('bx_files_allow_view_favorite_list', 'bx_files', 'view_favorite_list', '_bx_files_form_entry_input_allow_view_favorite_list', '3', 'bx_files_favorites_lists', 'id', 'author_id', 'BxFilesPrivacy', 'modules/boonex/files/classes/BxFilesPrivacy.php');


-- ACL

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_files', 'create entry', NULL, '_bx_files_acl_action_create_entry', '', 1, 3);
SET @iIdActionEntryCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_files', 'delete entry', NULL, '_bx_files_acl_action_delete_entry', '', 1, 3);
SET @iIdActionEntryDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_files', 'view entry', NULL, '_bx_files_acl_action_view_entry', '', 1, 0);
SET @iIdActionEntryView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_files', 'edit any entry', NULL, '_bx_files_acl_action_edit_any_entry', '', 1, 3);
SET @iIdActionEntryEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_files', 'delete any entry', NULL, '_bx_files_acl_action_delete_any_entry', '', 1, 3);
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

-- edit any entry
(@iModerator, @iIdActionEntryEditAny),
(@iAdministrator, @iIdActionEntryEditAny),

-- delete any entry
(@iAdministrator, @iIdActionEntryDeleteAny);


-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_files', '_bx_files', @iSearchOrder + 1, 'BxFilesSearchResult', 'modules/boonex/files/classes/BxFilesSearchResult.php'),
('bx_files_cmts', '_bx_files_cmts', @iSearchOrder + 2, 'BxFilesCmtsSearchResult', 'modules/boonex/files/classes/BxFilesCmtsSearchResult.php');

-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('bx_files', 'bx_files', 'bx_files_meta_keywords', '', 'bx_files_meta_mentions', '', '');

-- CATEGORY
INSERT INTO `sys_objects_category` (`object`, `module`, `search_object`, `form_object`, `list_name`, `table`, `field`, `join`, `where`, `override_class_name`, `override_class_file`) VALUES
('bx_files_cats', 'bx_files', 'bx_files', 'bx_files', 'bx_files_cats', 'bx_files_main', 'cat', 'INNER JOIN `sys_profiles` ON (`sys_profiles`.`id` = `bx_files_main`.`author`)', 'AND `sys_profiles`.`status` = ''active''', '', '');

-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_files', 'bx_files', '_bx_files', 'page.php?i=files-home', 'far file', 'SELECT COUNT(*) FROM `bx_files_main` WHERE 1 AND `status` = ''active'' AND `status_admin` = ''active''', @iMaxOrderStats + 1);

-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_files_growth', '_bx_files_chart_growth', 'bx_files_main', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_files_growth_speed', '_bx_files_chart_growth_speed', 'bx_files_main', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_files_administration', 'Sql', 'SELECT * FROM `bx_files_main` WHERE 1 ', 'bx_files_main', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'title,desc', '', 'like', 'reports', '', 192, 'BxFilesGridAdministration', 'modules/boonex/files/classes/BxFilesGridAdministration.php'),
('bx_files_common', 'Sql', 'SELECT * FROM `bx_files_main` WHERE 1 ', 'bx_files_main', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'title,desc', '', 'like', '', '', 2147483647, 'BxFilesGridCommon', 'modules/boonex/files/classes/BxFilesGridCommon.php');


INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_files_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_files_administration', 'switcher', '_bx_files_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_files_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_files_administration', 'title', '_bx_files_grid_column_title_adm_title', '25%', 0, '', '', 4),
('bx_files_administration', 'added', '_bx_files_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_files_administration', 'author', '_bx_files_grid_column_title_adm_author', '20%', 0, '25', '', 6),
('bx_files_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_files_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_files_common', 'switcher', '_bx_files_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_files_common', 'title', '_bx_files_grid_column_title_adm_title', '40%', 0, '', '', 3),
('bx_files_common', 'added', '_bx_files_grid_column_title_adm_added', '15%', 1, '25', '', 4),
('bx_files_common', 'status_admin', '_bx_files_grid_column_title_adm_status_admin', '15%', 0, '16', '', 5),
('bx_files_common', 'actions', '', '20%', 0, '', '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_files_administration', 'bulk', 'delete', '_bx_files_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_files_administration', 'bulk', 'clear_reports', '_bx_files_grid_action_title_adm_clear_reports', '', 0, 1, 2),
('bx_files_administration', 'single', 'edit', '_bx_files_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_files_administration', 'single', 'delete', '_bx_files_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_files_administration', 'single', 'settings', '_bx_files_grid_action_title_adm_more_actions', 'cog', 1, 0, 3),
('bx_files_administration', 'single', 'audit_content', '_bx_files_grid_action_title_adm_audit_content', 'search', 1, 0, 4),
('bx_files_administration', 'single', 'clear_reports', '_bx_files_grid_action_title_adm_clear_reports', 'eraser', 1, 0, 5),

('bx_files_common', 'bulk', 'delete', '_bx_files_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_files_common', 'single', 'edit', '_bx_files_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_files_common', 'single', 'delete', '_bx_files_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_files_common', 'single', 'settings', '_bx_files_grid_action_title_adm_more_actions', 'cog', 1, 0, 3);

-- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_files_html5', 1, 'BxFilesUploaderHTML5', 'modules/boonex/files/classes/BxFilesUploaderHTML5.php');

-- ALERTS

INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_files', 'BxFilesAlertsResponse', 'modules/boonex/files/classes/BxFilesAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('profile', 'delete', @iHandler);

-- CRON

INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_files_process_data', '* * * * *', 'BxFilesCronProcessData', 'modules/boonex/files/classes/BxFilesCronProcessData.php', '');


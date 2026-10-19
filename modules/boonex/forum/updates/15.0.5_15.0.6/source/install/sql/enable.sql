SET @sName = 'bx_forum';


-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', @sName, '_bx_forum', 'bx_forum@modules/boonex/forum/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, @sName, '_bx_forum', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_forum_enable_auto_approve', 'on', @iCategId, '_bx_forum_option_enable_auto_approve', 'checkbox', '', '', '', 0),
('bx_forum_summary_chars', '700', @iCategId, '_bx_forum_option_summary_chars', 'digit', '', '', '', 1),
('bx_forum_plain_summary_chars', '240', @iCategId, '_bx_forum_option_plain_summary_chars', 'digit', '', '', '', 2),
('bx_forum_per_page_browse', '12', @iCategId, '_bx_forum_option_per_page_browse', 'digit', '', '', '', 10),
('bx_forum_per_page_index', '6', @iCategId, '_bx_forum_option_per_page_index', 'digit', '', '', '', 11),
('bx_forum_per_page_profile', '6', @iCategId, '_bx_forum_option_per_page_profile', 'digit', '', '', '', 12),
('bx_forum_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', 'digit', '', '', '', 14),
('bx_forum_per_page_for_favorites_lists', '5', @iCategId, '_bx_forum_option_per_page_for_favorites_lists', 'digit', '', '', '', 17),
('bx_forum_rss_num', '10', @iCategId, '_bx_forum_option_rss_num', 'digit', '', '', '', 20),
('bx_forum_searchable_fields', 'title,text,text_comments', @iCategId, '_bx_forum_option_searchable_fields', 'list', '', '', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:21:"get_searchable_fields";}', 30),
('bx_forum_auto_activation_for_categories', 'on', @iCategId, '_bx_forum_option_auto_activation_for_categories', 'checkbox', '', '', '', 35),
('bx_forum_visible_categories', '10', @iCategId, '_bx_forum_option_visible_categories', 'digit', '', '', '', 40);
-- ('bx_forum_autosubscribe_created', '', @iCategId, '_bx_forum_option_autosubscribe_created', 'checkbox', '', '', '', 40),
-- ('bx_forum_autosubscribe_replied', '', @iCategId, '_bx_forum_option_autosubscribe_replied', 'checkbox', '', '', '', 41),



-- PAGE: create entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_create_entry', '_bx_forum_page_title_sys_create_entry', '_bx_forum_page_title_create_entry', @sName, 5, 2147483647, 1, 'create-discussion', 'page.php?i=create-discussion', '', '', '', 0, 1, 0, 'BxForumPageBrowse', 'modules/boonex/forum/classes/BxForumPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_forum_create_entry', 1, @sName, '_bx_forum_page_block_title_create_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:13:"entity_create";}', 0, 1, 1);

-- PAGE: edit entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_edit_entry', '_bx_forum_page_title_sys_edit_entry', '_bx_forum_page_title_edit_entry', @sName, 5, 2147483647, 1, 'edit-discussion', '', '', '', '', 0, 1, 0, 'BxForumPageEntry', 'modules/boonex/forum/classes/BxForumPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_forum_edit_entry', 1, @sName, '_bx_forum_page_block_title_edit_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);

-- PAGE: delete entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_delete_entry', '_bx_forum_page_title_sys_delete_entry', '_bx_forum_page_title_delete_entry', @sName, 5, 2147483647, 1, 'delete-discussion', '', '', '', '', 0, 1, 0, 'BxForumPageEntry', 'modules/boonex/forum/classes/BxForumPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_forum_delete_entry', 1, @sName, '_bx_forum_page_block_title_delete_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);

-- PAGE: view entry
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_view_entry', 'view-discussion', '_bx_forum_page_title_sys_view_entry', '_bx_forum_page_title_view_entry', @sName, 12, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxForumPageEntry', 'modules/boonex/forum/classes/BxForumPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_forum_view_entry', 1, @sName,'', '_bx_forum_page_block_title_entry_breadcrumb', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:17:"entity_breadcrumb";}', 0, 0, 1, 1),
('bx_forum_view_entry', 3, @sName,'', '_bx_forum_page_block_title_entry_author', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:13:"entity_author";}', 0, 0, 1, 1),
('bx_forum_view_entry', 3, @sName, '_bx_forum_page_block_title_sys_entry_context', '_bx_forum_page_block_title_entry_context', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:14:\"entity_context\";}', 0, 0, 1, 2),
('bx_forum_view_entry', 3, @sName,'', '_bx_forum_page_block_title_entry_participants', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:19:"entity_participants";}', 0, 0, 1, 3),
('bx_forum_view_entry', 3, @sName, '', '_bx_forum_page_block_title_entry_info', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:11:\"entity_info\";}', 0, 0, 0, 0),
('bx_forum_view_entry', 2, @sName,'', '_bx_forum_page_block_title_entry_text', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:17:"entity_text_block";}', 0, 0, 1, 1),
('bx_forum_view_entry', 1, @sName,'', '_bx_forum_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:18:"entity_all_actions";}', 0, 0, 1, 2),
('bx_forum_view_entry', 2, @sName,'', '_bx_forum_page_block_title_entry_attachments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:18:"entity_attachments";}', 0, 0, 1, 2),
('bx_forum_view_entry', 2, @sName, '', '_bx_forum_page_block_title_entry_polls', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:12:"entity_polls";}', 0, 0, 1, 3),
('bx_forum_view_entry', 2, @sName,'', '_bx_forum_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:15:"entity_comments";}', 0, 0, 1, 4),
('bx_forum_view_entry', 2, @sName, '', '_bx_forum_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);


-- PAGE: categories
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_categories', 'discussions-categories', '_bx_forum_page_title_sys_entries_categories', '_bx_forum_page_title_entries_categories', @sName, 5, 2147483647, 1, 'page.php?i=discussions-categories', '', '', '', 0, 1, 0, 'BxForumPageBrowse', 'modules/boonex/forum/classes/BxForumPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_forum_categories', 1, @sName, '', '_bx_forum_page_block_title_entries_categories', 13, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"categories_list";s:6:"params";a:2:{i:0;s:13:"bx_forum_cats";i:1;a:1:{s:10:"show_empty";b:1;}}s:5:"class";s:20:"TemplServiceCategory";}', 0, 0, 1, 0);

-- PAGE: entries by category
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_category', 'discussions-category', '_bx_forum_page_title_sys_entries_by_category', '_bx_forum_page_title_entries_by_category', @sName, 1, 2147483647, 1, 'page.php?i=discussions-category', '', '', '', 0, 1, 0, 'BxForumPageBrowse', 'modules/boonex/forum/classes/BxForumPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_forum_category', 2, @sName, '_bx_forum_page_block_title_sys_entries_by_category', '_bx_forum_page_block_title_entries_by_category', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:15:"browse_category";s:6:"params";a:1:{i:0;s:5:"table";}}', 0, 0, 1, 1),
('bx_forum_category', 1, @sName, '', '_bx_forum_page_block_title_cats', 11, 2147483647, 'menu', 'bx_forum_categories', 0, 0, 1, 1);

-- PAGE: entries by keyword
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_keyword', 'discussions-keyword', '_bx_forum_page_title_sys_entries_by_keyword', '_bx_forum_page_title_entries_by_keyword', @sName, 5, 2147483647, 1, 'page.php?i=discussions-keyword', '', '', '', 0, 1, 0, 'BxForumPageBrowse', 'modules/boonex/forum/classes/BxForumPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_forum_keyword', 1, @sName, '_bx_forum_page_block_title_sys_entries_by_keyword', '_bx_forum_page_block_title_entries_by_keyword', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:14:"browse_keyword";s:6:"params";a:1:{i:0;s:5:"table";}}', 0, 0, 1, 1);

-- PAGE: entries of author
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_author', 'discussions-author', '_bx_forum_page_title_sys_entries_of_author', '_bx_forum_page_title_entries_of_author', @sName, 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxForumPageAuthor', 'modules/boonex/forum/classes/BxForumPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_forum_author', 1, @sName, '', '_bx_forum_page_block_title_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:18:"my_entries_actions";}', 0, 0, 1, 1),
('bx_forum_author', 1, @sName, '_bx_forum_page_block_title_sys_favorites_of_author', '_bx_forum_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:21:"browse_favorite_lists";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1, 2),
('bx_forum_author', 1, @sName, '_bx_forum_page_block_title_sys_entries_of_author', '_bx_forum_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:13:"browse_author";}', 0, 0, 1, 3),
('bx_forum_author', 1, @sName, '_bx_forum_page_block_title_sys_entries_in_context', '_bx_forum_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:14:"browse_context";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";i:0;a:1:{s:13:"empty_message";b:0;}}}', 0, 0, 1, 4);


-- PAGE: favorites by list
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_favorites', '_bx_forum_page_title_sys_entries_favorites', '_bx_forum_page_title_entries_favorites', @sName, 12, 2147483647, 1, 'discussions-favorites', 'page.php?i=discussions-favorites', '', '', '', 0, 1, 0, 'BxForumPageListEntry', 'modules/boonex/forum/classes/BxForumPageListEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_forum_favorites', 2, @sName, '_bx_forum_page_block_title_sys_favorites_entries', '_bx_forum_page_block_title_favorites_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:15:"browse_favorite";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1),
('bx_forum_favorites', 3, @sName, '', '_bx_forum_page_block_title_favorites_entries_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:19:"favorites_list_info";}', 0, 0, 0),
('bx_forum_favorites', 3, @sName, '', '_bx_forum_page_block_title_favorites_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:22:"favorites_list_actions";}', 0, 0, 1);


-- PAGE: entries in context
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_context', 'discussions-context', '_bx_forum_page_title_sys_entries_in_context', '_bx_forum_page_title_entries_in_context', 'bx_forum', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxForumPageAuthor', 'modules/boonex/forum/classes/BxForumPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_forum_context', 1, @sName, '_bx_forum_page_block_title_sys_entries_in_context', '_bx_forum_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:14:\"browse_context\";}', 0, 0, 1, 1),
('bx_forum_context', 1, @sName, '_bx_forum_page_block_title_sys_multi_categories_in_context', '_bx_forum_page_block_title_multi_categories_in_context', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:29:\"categories_multi_list_context\";}', 0, 0, 0, 2);

-- PAGE: module home
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `cover`, `cover_image`, `type_id`, `layout_id`, `submenu`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `inj_head`, `inj_footer`, `sticky_columns`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_home', 'discussions-home', '_bx_forum_page_title_sys_home', '_bx_forum_page_title_home', @sName, 1, 0, 1, 6, '', 2147483647, 1, 'page.php?i=discussions-home', '', '', '', 0, 1, '', '', 0, 0, 'BxForumPageBrowse', 'modules/boonex/forum/classes/BxForumPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `async`, `cache_lifetime`, `submenu`, `tabs`, `hidden_on`, `visible_for_levels`, `type`, `content`, `help`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_forum_home', 1, @sName, '_bx_forum_page_block_title_sys_featured_entries_view_showcase', '_bx_forum_page_block_title_featured_entries_view_showcase', 0, 0, NULL, '', 0, '', 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:15:\"browse_featured\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', NULL, 0, 1, 1, 0),
('bx_forum_home', 2, @sName, '', '_bx_forum_page_block_title_cats', 11, 0, NULL, '', 0, 0, 2147483647, 'menu', 'bx_forum_categories', NULL, 0, 1, 1, 0),
('bx_forum_home', 2, @sName, '_bx_forum_page_block_title_sys_multicats', '_bx_forum_page_block_title_multicats', 11, 0, NULL, '', 0, '', 2147483647, 'service', 'a:2:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:21:\"categories_multi_list\";}', NULL, 0, 1, 0, 1),
('bx_forum_home', 3, @sName, '', '_bx_forum_page_block_title_home', 11, 0, NULL, '', 0, '', 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:13:\"browse_latest\";s:6:\"params\";a:3:{i:0;s:5:\"table\";i:1;b:1;i:2;b:0;}}', NULL, 0, 1, 1, 1),
('bx_forum_home', 2, @sName, '', '_bx_forum_page_block_title_browse_labels', 11, 0, NULL, '', 0, '', 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:13:\"browse_labels\";s:5:\"class\";s:20:\"TemplServiceMetatags\";}', NULL, 0, 1, 0, 2),
('bx_forum_home', 2, @sName, '', '_bx_forum_page_block_title_popular_keywords', 11, 0, NULL, '', 0, '', 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:14:\"keywords_cloud\";s:6:\"params\";a:3:{i:0;s:8:\"bx_forum\";i:1;s:8:\"bx_forum\";i:2;a:1:{s:9:\"menu_view\";b:1;}}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', NULL, 0, 1, 1, 3),
('bx_forum_home', 2, @sName, '_bx_forum_page_block_title_popular_entries_view_extended', '_bx_forum_page_block_title_popular_entries', 11, 0, NULL, '', 0, '', 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:14:\"browse_popular\";s:6:\"params\";a:1:{i:0;s:8:\"extended\";}}', NULL, 0, 1, 1, 3);

-- PAGE: module search
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_search', 'discussions-search', '_bx_forum_page_title_sys_entries_search', '_bx_forum_page_title_entries_search', @sName, 5, 2147483647, 1, 'page.php?i=discussions-search', '', '', '', 0, 1, 0, 'BxForumPageBrowse', 'modules/boonex/forum/classes/BxForumPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_forum_search', 1, @sName, '', '_bx_forum_page_block_title_entries_search_form', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:6:"search";}', 0, 0, 1, 0),
('bx_forum_search', 1, @sName, '', '_bx_forum_page_block_title_entries_search_results', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:21:"browse_search_results";s:6:"params";a:1:{i:0;s:5:"table";}}', 0, 0, 1, 1),
('bx_forum_search', 1, @sName, '', '_bx_forum_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:8:"bx_forum";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 2),
('bx_forum_search', 1, @sName, '', '_bx_forum_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:8:"bx_forum";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_forum_search', 1, @sName, '', '_bx_forum_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:13:"bx_forum_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4),
('bx_forum_search', 1, @sName, '', '_bx_forum_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:13:"bx_forum_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 5);

-- PAGE: module manage own
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_manage', '_bx_forum_page_title_sys_manage', '_bx_forum_page_title_manage', @sName, 5, 2147483647, 1, 'discussions-manage', 'page.php?i=discussions-manage', '', '', '', 0, 1, 0, 'BxForumPageBrowse', 'modules/boonex/forum/classes/BxForumPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_forum_manage', 1, @sName, '_bx_forum_page_block_title_system_manage', '_bx_forum_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:12:"manage_tools";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_administration', '_bx_forum_page_title_sys_manage_administration', '_bx_forum_page_title_manage', @sName, 5, 192, 1, 'discussions-administration', 'page.php?i=discussions-administration', '', '', '', 0, 1, 0, 'BxForumPageBrowse', 'modules/boonex/forum/classes/BxForumPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_forum_administration', 1, @sName, '_bx_forum_page_block_title_system_manage_administration', '_bx_forum_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);

-- PAGE: add block to homepage
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', 1, @sName, '_bx_forum_page_block_title_new_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:12:"browse_index";s:6:"params";a:4:{i:0;s:5:"table";i:1;b:0;i:2;b:1;i:3;b:0;}}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 2;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, @sName, '_bx_forum_page_block_title_sys_my_entries', '_bx_forum_page_block_title_my_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:13:"browse_author";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:0;}}}', 0, 0, 0);


-- PAGE: service blocks
 SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('', 0, @sName, '_bx_forum_page_block_title_popular_entries_view_extended', '_bx_forum_page_block_title_popular_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:14:\"browse_popular\";s:6:\"params\";a:1:{i:0;s:8:\"extended\";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 1),
('', 0, @sName, '_bx_forum_page_block_title_popular_entries_view_showcase', '_bx_forum_page_block_title_popular_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:14:\"browse_popular\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, @sName, '_bx_forum_page_block_title_popular_entries_view_gallery', '_bx_forum_page_block_title_popular_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:14:\"browse_popular\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:7:\"gallery\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:1;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 3),

('', 0, @sName, '_bx_forum_page_block_title_featured_entries_view_extended', '_bx_forum_page_block_title_featured_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:15:\"browse_featured\";s:6:\"params\";a:1:{i:0;s:8:\"extended\";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 4),
('', 0, @sName, '_bx_forum_page_block_title_featured_entries_view_gallery', '_bx_forum_page_block_title_featured_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:15:\"browse_featured\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:7:\"gallery\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:1;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 5),

('', 0, @sName, '_bx_forum_page_block_title_latest_entries_view_extended', '_bx_forum_page_block_title_latest_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:13:\"browse_latest\";s:6:\"params\";a:1:{i:0;s:8:\"extended\";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 6),
('', 0, @sName, '_bx_forum_page_block_title_latest_entries_view_showcase', '_bx_forum_page_block_title_latest_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:13:\"browse_latest\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 7),
('', 0, @sName, '_bx_forum_page_block_title_latest_entries_view_gallery', '_bx_forum_page_block_title_latest_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:13:\"browse_latest\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:7:\"gallery\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:1;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 8),

('', 0, @sName, '_bx_forum_page_block_title_new_entries_view_extended', '_bx_forum_page_block_title_new_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:10:\"browse_new\";s:6:\"params\";a:1:{i:0;s:8:\"extended\";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 9),
('', 0, @sName, '_bx_forum_page_block_title_new_entries_view_showcase', '_bx_forum_page_block_title_new_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:10:\"browse_new\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 10),
('', 0, @sName, '_bx_forum_page_block_title_new_entries_view_gallery', '_bx_forum_page_block_title_new_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:10:\"browse_new\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:7:\"gallery\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:1;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 11),

('', 0, @sName, '_bx_forum_page_block_title_top_entries_view_extended', '_bx_forum_page_block_title_top_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:10:\"browse_top\";s:6:\"params\";a:1:{i:0;s:8:\"extended\";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 12),
('', 0, @sName, '_bx_forum_page_block_title_top_entries_view_showcase', '_bx_forum_page_block_title_top_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:10:\"browse_top\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 13),
('', 0, @sName, '_bx_forum_page_block_title_top_entries_view_gallery', '_bx_forum_page_block_title_top_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:8:\"bx_forum\";s:6:\"method\";s:10:\"browse_top\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:7:\"gallery\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:1;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 14),

('', 0, @sName, '_bx_forum_page_block_title_partaken_entries', '_bx_forum_page_block_title_partaken_entries', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:15:"browse_partaken";}', 0, 1, IFNULL(@iBlockOrder, 0) + 15);



-- MENU: add to site menu
SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', @sName, 'discussions-home', '_bx_forum_menu_item_title_system_entries_home', '_bx_forum_menu_item_title_entries_home', 'page.php?i=discussions-home', '', '', 'far comments', 'bx_forum_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu
SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', @sName, 'discussions-home', '_bx_forum_menu_item_title_system_entries_home', '_bx_forum_menu_item_title_entries_home', 'page.php?i=discussions-home', '', '', 'far comments', 'bx_forum_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: add to "add content" menu
SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', @sName, 'create-discussion', '_bx_forum_menu_item_title_system_create_entry', '_bx_forum_menu_item_title_create_entry', 'page.php?i=create-discussion', '', '', 'far comments', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: add to "create post" menu
SET @iCreatePostOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_create_post' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_create_post', @sName, 'create-discussion', '_bx_forum_menu_item_title_system_create_entry', '_bx_forum_menu_item_title_create_entry', 'page.php?i=create-discussion', '', '', 'far comments', '', 2147483647, 1, 0, IFNULL(@iCreatePostOrder, 0) + 1);

-- MENU: create post form attachments (link, photo, video, etc)
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_entry_attachments', '_bx_forum_menu_title_entry_attachments', 'bx_forum_entry_attachments', @sName, 23, 0, 1, 'BxForumMenuAttachments', 'modules/boonex/forum/classes/BxForumMenuAttachments.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_entry_attachments', @sName, '_bx_forum_menu_set_title_entry_attachments', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_forum_entry_attachments', @sName, 'photo_simple', '_bx_forum_menu_item_title_system_cpa_photo_simple', '_bx_forum_menu_item_title_cpa_photo_simple', 'javascript:void(0)', 'javascript:{js_object_uploader_photos_simple}.showUploaderForm();', '_self', 'camera', '', '', 2147483647, '', 0, 0, 1, 1),
('bx_forum_entry_attachments', @sName, 'photo_html5', '_bx_forum_menu_item_title_system_cpa_photo_html5', '_bx_forum_menu_item_title_cpa_photo_html5', 'javascript:void(0)', 'javascript:{js_object_uploader_photos_html5}.showUploaderForm();', '_self', 'camera', '', '', 2147483647, '', 1, 0, 1, 2),
('bx_forum_entry_attachments', @sName, 'video_simple', '_bx_forum_menu_item_title_system_cpa_video_simple', '_bx_forum_menu_item_title_cpa_video_simple', 'javascript:void(0)', 'javascript:{js_object_uploader_videos_simple}.showUploaderForm();', '_self', 'video', '', '', 2147483647, '', 0, 0, 1, 3),
('bx_forum_entry_attachments', @sName, 'video_html5', '_bx_forum_menu_item_title_system_cpa_video_html5', '_bx_forum_menu_item_title_cpa_video_html5', 'javascript:void(0)', 'javascript:{js_object_uploader_videos_html5}.showUploaderForm();', '_self', 'video', '', '', 2147483647, '', 1, 0, 1, 4),
('bx_forum_entry_attachments', @sName, 'video_record_video', '_bx_forum_menu_item_title_system_cpa_video_record', '_bx_forum_menu_item_title_cpa_video_record', 'javascript:void(0)', 'javascript:{js_object_uploader_videos_record_video}.showUploaderForm();', '_self', 'fas circle', '', '', 2147483647, '', 1, 0, 1, 5),
('bx_forum_entry_attachments', @sName, 'file_simple', '_bx_forum_menu_item_title_system_cpa_file_simple', '_bx_forum_menu_item_title_cpa_file_simple', 'javascript:void(0)', 'javascript:{js_object_uploader_files_simple}.showUploaderForm();', '_self', 'file', '', '', 2147483647, '', 0, 0, 1, 6),
('bx_forum_entry_attachments', @sName, 'file_html5', '_bx_forum_menu_item_title_system_cpa_file_html5', '_bx_forum_menu_item_title_cpa_file_html5', 'javascript:void(0)', 'javascript:{js_object_uploader_files_html5}.showUploaderForm();', '_self', 'file', '', '', 2147483647, '', 1, 0, 1, 7),
('bx_forum_entry_attachments', @sName, 'poll', '_bx_forum_menu_item_title_system_cpa_poll', '_bx_forum_menu_item_title_cpa_poll', 'javascript:void(0)', 'javascript:{js_object}.showPollForm(this);', '_self', 'tasks', '', '', 2147483647, '', 1, 0, 1, 8),
('bx_forum_entry_attachments', @sName, 'add-link', '_bx_forum_menu_item_title_system_add_link', '_bx_forum_menu_item_title_add_link', 'javascript:void(0)', 'javascript:{js_object_link}.showAttachLink(this);', '_self', 'link', '', '', 2147483647, '', 1, 0, 1, 10);

-- MENU: actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_view', '_bx_forum_menu_title_view_entry', 'bx_forum_view', @sName, 9, 0, 1, 'BxForumMenuView', 'modules/boonex/forum/classes/BxForumMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_view', @sName, '_bx_forum_menu_set_title_view_entry', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
-- ('bx_forum_view', @sName, 'subscribe-discussion', '_bx_forum_menu_item_title_system_subscribe', '_bx_forum_menu_item_title_subscribe', 'javascript:void(0)', 'bx_conn_action(this, \'bx_forum_subscribers\', \'add\', \'{content_id}\')', '', 'check', '', 0, 2147483647, 1, 0, 1),
('bx_forum_view', @sName, 'resolve-discussion', '_bx_forum_menu_item_title_system_resolve_entry', '_bx_forum_menu_item_title_resolve_entry', 'javascript:void(0);', '{js_object}.updateStatus(this, \'resolve\', {content_id});', '', 'check-circle', '', 0, 2147483647, 1, 0, 1),
('bx_forum_view', @sName, 'stick-discussion', '_bx_forum_menu_item_title_system_stick_entry', '_bx_forum_menu_item_title_stick_entry', 'javascript:void(0);', '{js_object}.updateStatus(this, \'stick\', {content_id});', '', 'thumbtack', '', 0, 2147483647, 1, 0, 2),
('bx_forum_view', @sName, 'lock-discussion', '_bx_forum_menu_item_title_system_lock_entry', '_bx_forum_menu_item_title_lock_entry', 'javascript:void(0);', '{js_object}.updateStatus(this, \'lock\', {content_id});', '', 'lock', '', 0, 2147483647, 1, 0, 3),
('bx_forum_view', @sName, 'hide-discussion', '_bx_forum_menu_item_title_system_hide_entry', '_bx_forum_menu_item_title_hide_entry', 'javascript:void(0);', '{js_object}.updateStatus(this, \'hide\', {content_id});', '', 'stop-circle', '', 0, 2147483647, 1, 0, 4),
('bx_forum_view', @sName, 'approve', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 0, 2147483647, 1, 0, 5),
('bx_forum_view', @sName, 'more', '_bx_forum_menu_item_title_system_more', '_bx_forum_menu_item_title_more', 'javascript:void(0)', 'bx_menu_popup(\'bx_forum_view_more\', this, {}, {id:{content_id}});', '', 'cog', 'bx_forum_view_more', 1, 2147483647, 1, 0, 9999);

-- MENU: view actions more
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_view_more', '_bx_forum_menu_title_view_more', 'bx_forum_view_more', @sName, 6, 0, 1, 'BxForumMenuView', 'modules/boonex/forum/classes/BxForumMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_view_more', @sName, '_bx_forum_menu_set_title_view_more', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
-- ('bx_forum_view_more', @sName, 'unsubscribe-discussion', '_bx_forum_menu_item_title_system_unsubscribe', '_bx_forum_menu_item_title_unsubscribe', 'javascript:void(0)', 'bx_conn_action(this, \'bx_forum_subscribers\', \'remove\', \'{content_id}\')', '', 'check', '', 2147483647, 1, 0, 1),
('bx_forum_view_more', @sName, 'unresolve-discussion', '_bx_forum_menu_item_title_system_unresolve_entry', '_bx_forum_menu_item_title_unresolve_entry', 'javascript:void(0);', '{js_object}.updateStatus(this, \'unresolve\', {content_id});', '', 'check-circle', '', 2147483647, 1, 0, 1),
('bx_forum_view_more', @sName, 'unstick-discussion', '_bx_forum_menu_item_title_system_unstick_entry', '_bx_forum_menu_item_title_unstick_entry', 'javascript:void(0);', '{js_object}.updateStatus(this, \'unstick\', {content_id});', '', 'thumbtack', '', 2147483647, 1, 0, 2),
('bx_forum_view_more', @sName, 'unlock-discussion', '_bx_forum_menu_item_title_system_unlock_entry', '_bx_forum_menu_item_title_unlock_entry', 'javascript:void(0);', '{js_object}.updateStatus(this, \'unlock\', {content_id});', '', 'unlock', '', 2147483647, 1, 0, 3),
('bx_forum_view_more', @sName, 'unhide-discussion', '_bx_forum_menu_item_title_system_unhide_entry', '_bx_forum_menu_item_title_unhide_entry', 'javascript:void(0);', '{js_object}.updateStatus(this, \'unhide\', {content_id});', '', 'play-circle', '', 2147483647, 1, 0, 4),
('bx_forum_view_more', @sName, 'edit-discussion', '_bx_forum_menu_item_title_system_edit_entry', '_bx_forum_menu_item_title_edit_entry', 'page.php?i=edit-discussion&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 1, 0, 5),
('bx_forum_view_more', @sName, 'delete-discussion', '_bx_forum_menu_item_title_system_delete_entry', '_bx_forum_menu_item_title_delete_entry', 'page.php?i=delete-discussion&id={content_id}', '', '', 'remove', '', 2147483647, 1, 0, 6);

-- MENU: all actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_view_actions', '_sys_menu_title_view_actions', 'bx_forum_view_actions', @sName, 15, 0, 1, 'BxForumMenuViewActions', 'modules/boonex/forum/classes/BxForumMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_view_actions', @sName, '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
-- ('bx_forum_view_actions', @sName, 'subscribe-discussion', '_bx_forum_menu_item_title_system_subscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
-- ('bx_forum_view_actions', @sName, 'unsubscribe-discussion', '_bx_forum_menu_item_title_system_unsubscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_forum_view_actions', @sName, 'resolve-discussion', '_bx_forum_menu_item_title_system_resolve_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_forum_view_actions', @sName, 'unresolve-discussion', '_bx_forum_menu_item_title_system_unresolve_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 25),
('bx_forum_view_actions', @sName, 'stick-discussion', '_bx_forum_menu_item_title_system_stick_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_forum_view_actions', @sName, 'unstick-discussion', '_bx_forum_menu_item_title_system_unstick_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_forum_view_actions', @sName, 'lock-discussion', '_bx_forum_menu_item_title_system_lock_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 50),
('bx_forum_view_actions', @sName, 'unlock-discussion', '_bx_forum_menu_item_title_system_unlock_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 60),
('bx_forum_view_actions', @sName, 'hide-discussion', '_bx_forum_menu_item_title_system_hide_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 70),
('bx_forum_view_actions', @sName, 'unhide-discussion', '_bx_forum_menu_item_title_system_unhide_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 80),
('bx_forum_view_actions', @sName, 'edit-discussion', '_bx_forum_menu_item_title_system_edit_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 90),
('bx_forum_view_actions', @sName, 'delete-discussion', '_bx_forum_menu_item_title_system_delete_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 100),
('bx_forum_view_actions', @sName, 'approve', '_sys_menu_item_title_system_va_approve', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 100),
('bx_forum_view_actions', @sName, 'set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_forum'', content_id: {content_id}});', '', 'check-circle', '', '', 0, 2147483647, 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 110),
('bx_forum_view_actions', @sName, 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_forum_view_actions', @sName, 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_forum_view_actions', @sName, 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 220),
('bx_forum_view_actions', @sName, 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 225),
('bx_forum_view_actions', @sName, 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 230),
('bx_forum_view_actions', @sName, 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 240),
('bx_forum_view_actions', @sName, 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 250),
('bx_forum_view_actions', @sName, 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 260),
('bx_forum_view_actions', @sName, 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_forum_view_actions', @sName, 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', '', 0, 2147483647, '', 1, 0, 280),
('bx_forum_view_actions', @sName, 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_forum&content_id={content_id}', '', '', 'history', '', '', 0, 192, '', 1, 0, 290),
('bx_forum_view_actions', @sName, 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_forum_view_actions', @sName, 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);

-- MENU: actions menu for my entries
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_my', '_bx_forum_menu_title_entries_my', 'bx_forum_my', @sName, 9, 0, 1, 'BxForumMenu', 'modules/boonex/forum/classes/BxForumMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_my', @sName, '_bx_forum_menu_set_title_entries_my', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_forum_my', 'bx_forum', 'create-discussion', '_bx_forum_menu_item_title_system_create_entry', '_bx_forum_menu_item_title_create_entry', 'page.php?i=create-discussion', '', '', 'plus', '', 2147483647, 1, 0, 0);

-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_submenu', '_bx_forum_menu_title_submenu', '_bx_forum_menu_title_public_submenu', 'bx_forum_submenu', @sName, 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_submenu', @sName, '_bx_forum_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_forum_submenu', @sName, 'discussions-home', '_bx_forum_menu_item_title_system_entries_public', '_bx_forum_menu_item_title_entries_public', 'page.php?i=discussions-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_forum_submenu', @sName, 'discussions-search', '_bx_forum_menu_item_title_system_entries_search', '_bx_forum_menu_item_title_entries_search', 'page.php?i=discussions-search', '', '', '', '', 2147483647, 1, 1, 5),
('bx_forum_submenu', @sName, 'discussions-manage', '_bx_forum_menu_item_title_system_entries_manage', '_bx_forum_menu_item_title_entries_manage', 'page.php?i=discussions-manage', '', '', '', '', 2147483646, 1, 1, 7);

-- MENU: custom menu for 'main' snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_snippet_meta_main', '_bx_forum_menu_title_snippet_meta_main', 'bx_forum_snippet_meta_main', 'bx_forum', 15, 0, 1, 'BxForumMenuSnippetMeta', 'modules/boonex/forum/classes/BxForumMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_snippet_meta_main', 'bx_forum', '_bx_forum_menu_set_title_snippet_meta_main', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`, `hidden_on_col`) VALUES 
('bx_forum_snippet_meta_main', 'bx_forum', 'scores', '_sys_menu_item_title_system_sm_scores', '_sys_menu_item_title_sm_scores', '', '', '', '', '', 2147483647, 1, 0, 1, 0, 0),
('bx_forum_snippet_meta_main', 'bx_forum', 'author', '_sys_menu_item_title_system_sm_author', '_sys_menu_item_title_sm_author', '', '', '', '', '', 2147483647, 1, 0, 1, 1, 0),
('bx_forum_snippet_meta_main', 'bx_forum', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', 'clock', '', 2147483647, 1, 0, 1, 2, 0),
('bx_forum_snippet_meta_main', 'bx_forum', 'category', '_sys_menu_item_title_system_sm_category', '_sys_menu_item_title_sm_category', '', '', '', '', '', 2147483647, 1, 0, 1, 3, 3),
('bx_forum_snippet_meta_main', 'bx_forum', 'reactions', '_sys_menu_item_title_system_sm_reactions', '_sys_menu_item_title_sm_reactions', '', '', '', '', '', 2147483647, 0, 0, 1, 4, 3),
('bx_forum_snippet_meta_main', 'bx_forum', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', 'comments', '', 2147483647, 1, 0, 1, 5, 3),
('bx_forum_snippet_meta_main', 'bx_forum', 'sticked', '_bx_forum_menu_item_title_system_sm_sticked', '_bx_forum_menu_item_title_sm_sticked', '', '', '', 'thumbtack', '', 2147483647, 1, 0, 1, 6, 3),
('bx_forum_snippet_meta_main', 'bx_forum', 'locked', '_bx_forum_menu_item_title_system_sm_locked', '_bx_forum_menu_item_title_sm_locked', '', '', '', 'lock', '', 2147483647, 0, 0, 1, 7, 3),
('bx_forum_snippet_meta_main', 'bx_forum', 'status', '_bx_forum_menu_item_title_system_sm_status', '_bx_forum_menu_item_title_sm_status', '', '', '', '', '', 2147483647, 1, 0, 1, 8, 3);


-- MENU: custom menu for 'counters' snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_snippet_meta_counters', '_bx_forum_menu_title_snippet_meta_counters', 'bx_forum_snippet_meta_counters', 'bx_forum', 15, 0, 1, 'BxForumMenuSnippetMeta', 'modules/boonex/forum/classes/BxForumMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_snippet_meta_counters', 'bx_forum', '_bx_forum_menu_set_title_snippet_meta_counters', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_forum_snippet_meta_counters', 'bx_forum', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, 1, 0, 1, 1),
('bx_forum_snippet_meta_counters', 'bx_forum', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 2147483647, 1, 0, 1, 2),
('bx_forum_snippet_meta_counters', 'bx_forum', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, 1, 0, 1, 3);

-- MENU: custom menu for 'reply' snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_snippet_meta_reply', '_bx_forum_menu_title_snippet_meta_reply', 'bx_forum_snippet_meta_reply', 'bx_forum', 15, 0, 1, 'BxForumMenuSnippetMeta', 'modules/boonex/forum/classes/BxForumMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_snippet_meta_reply', 'bx_forum', '_bx_forum_menu_set_title_snippet_meta_reply', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_forum_snippet_meta_reply', 'bx_forum', 'reply-author', '_sys_menu_item_title_system_sm_author', '_sys_menu_item_title_sm_author', '', '', '', '', '', 2147483647, 1, 0, 1, 1),
('bx_forum_snippet_meta_reply', 'bx_forum', 'reply-date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, 1, 0, 1, 2),
('bx_forum_snippet_meta_reply', 'bx_forum', 'reply-text', '_bx_forum_menu_item_title_system_sm_reply_text', '_bx_forum_menu_item_title_sm_reply_text', '', '', '', '', '', 2147483647, 1, 0, 1, 3);


-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_menu_manage_tools', '_bx_forum_menu_title_manage_tools', 'bx_forum_menu_manage_tools', 'bx_forum', 6, 0, 1, 'BxForumMenuManageTools', 'modules/boonex/forum/classes/BxForumMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_forum_menu_manage_tools', 'bx_forum', '_bx_forum_menu_set_title_manage_tools', 0);

--INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
--('bx_forum_menu_manage_tools', 'bx_forum', 'delete-with-content', '_bx_forum_menu_item_title_system_delete_with_content', '_bx_forum_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 128, 1, 0, 0);

-- MENU: profile stats
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', @sName, 'profile-stats-my-forum', '_bx_forum_menu_item_title_system_discussions', '_bx_forum_menu_item_title_discussions', 'page.php?i=discussions-author&profile_id={member_id}', '', '', 'far comments', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:19:"get_discussions_num";}', '', 2147483646, 1, 0, 2);

-- MENU: categories
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_forum_categories', '_bx_forum_menu_title_categories', '', 'bx_forum', 21, 0, 1, 'BxForumMenuCategories', 'modules/boonex/forum/classes/BxForumMenuCategories.php');


-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', @sName, 'discussions-administration', '_bx_forum_menu_item_title_system_admt_discussions', '_bx_forum_menu_item_title_admt_discussions', 'page.php?i=discussions-administration', '', '_self', 'far comments', 'a:2:{s:6:"module";s:8:"bx_forum";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', @sName, 'discussions-author', '_bx_forum_menu_item_title_system_view_entries_author', '_bx_forum_menu_item_title_view_entries_author', 'page.php?i=discussions-author&profile_id={profile_id}', '', '', 'far comments', '', 2147483647, 1, 0, 0),
('trigger_group_view_submenu', @sName, 'discussions-context', '_bx_forum_menu_item_title_system_view_entries_in_context', '_bx_forum_menu_item_title_view_entries_in_context', 'page.php?i=discussions-context&profile_id={profile_id}', '', '', 'far comments', '', 2147483647, 1, 0, 0);

-- GRIDS: main
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_mode`, `sorting_fields`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
(@sName, 'Sql', 'SELECT `bx_forum_discussions`.*, `bx_forum_cmts`.`cmt_text` AS `cmt_text` %s FROM `bx_forum_discussions` LEFT JOIN `bx_forum_cmts` ON (`bx_forum_cmts`.`cmt_id` = `bx_forum_discussions`.`lr_comment_id`) %s WHERE 1 %s %s', 'bx_forum_discussions', 'id', 'lr_timestamp', '', 10, NULL, 'start', '', 'title,text,text_comments', 'auto', '', 2147483647, 'BxForumGrid', 'modules/boonex/forum/classes/BxForumGrid.php'),
('bx_forum_favorite', 'Sql', 'SELECT `bx_forum_discussions`.*, `bx_forum_cmts`.`cmt_text` AS `cmt_text` %s FROM `bx_forum_discussions` LEFT JOIN `bx_forum_cmts` ON (`bx_forum_cmts`.`cmt_id` = `bx_forum_discussions`.`lr_comment_id`) %s WHERE 1 %s %s', 'bx_forum_discussions', 'id', 'lr_timestamp', '', 10, NULL, 'start', '', 'title,text,text_comments', 'auto', '', 2147483647, 'BxForumGrid', 'modules/boonex/forum/classes/BxForumGrid.php'),
('bx_forum_feature', 'Sql', 'SELECT `bx_forum_discussions`.*, `bx_forum_cmts`.`cmt_text` AS `cmt_text` %s FROM `bx_forum_discussions` LEFT JOIN `bx_forum_cmts` ON (`bx_forum_cmts`.`cmt_id` = `bx_forum_discussions`.`lr_comment_id`) %s WHERE 1 %s %s', 'bx_forum_discussions', 'id', 'lr_timestamp', '', 10, NULL, 'start', '', 'title,text,text_comments', 'auto', '', 2147483647, 'BxForumGrid', 'modules/boonex/forum/classes/BxForumGrid.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
(@sName, 'text', '', '100%', '', 1),

('bx_forum_favorite', 'text', '', '100%', '', 2);

-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_forum_administration', 'Sql', 'SELECT * FROM `bx_forum_discussions` WHERE 1 ', 'bx_forum_discussions', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'title,text', '', 'like', 'reports', '', 192, 'BxForumGridAdministration', 'modules/boonex/forum/classes/BxForumGridAdministration.php'),
('bx_forum_common', 'Sql', 'SELECT * FROM `bx_forum_discussions` WHERE 1 ', 'bx_forum_discussions', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'title,text', '', 'like', '', '', 2147483647, 'BxForumGridCommon', 'modules/boonex/forum/classes/BxForumGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_forum_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_forum_administration', 'switcher', '_bx_forum_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_forum_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_forum_administration', 'title', '_bx_forum_grid_column_title_adm_title', '25%', 0, '', '', 4),
('bx_forum_administration', 'added', '_bx_forum_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_forum_administration', 'author', '_bx_forum_grid_column_title_adm_author', '20%', 0, '25', '', 6),
('bx_forum_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_forum_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_forum_common', 'switcher', '_bx_forum_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_forum_common', 'title', '_bx_forum_grid_column_title_adm_title', '40%', 0, '', '', 3),
('bx_forum_common', 'added', '_bx_forum_grid_column_title_adm_added', '15%', 1, '25', '', 4),
('bx_forum_common', 'status_admin', '_bx_forum_grid_column_title_adm_status_admin', '15%', 0, '16', '', 5),
('bx_forum_common', 'actions', '', '20%', 0, '', '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_forum_administration', 'bulk', 'delete', '_bx_forum_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_forum_administration', 'bulk', 'clear_reports', '_bx_forum_grid_action_title_adm_clear_reports', '', 0, 1, 2),
('bx_forum_administration', 'single', 'edit', '_bx_forum_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_forum_administration', 'single', 'delete', '_bx_forum_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_forum_administration', 'single', 'settings', '_bx_forum_grid_action_title_adm_more_actions', 'cog', 1, 0, 3),
('bx_forum_administration', 'single', 'audit_content', '_bx_forum_grid_action_title_adm_audit_content', 'search', 1, 0, 4),
('bx_forum_administration', 'single', 'clear_reports', '_bx_forum_grid_action_title_adm_clear_reports', 'eraser', 1, 0, 5),

('bx_forum_common', 'bulk', 'delete', '_bx_forum_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_forum_common', 'single', 'edit', '_bx_forum_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_forum_common', 'single', 'delete', '_bx_forum_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_forum_common', 'single', 'settings', '_bx_forum_grid_action_title_adm_more_actions', 'cog', 1, 0, 3);

-- GRIDS: categories manager
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_mode`, `sorting_fields`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_forum_categories', 'Array', '', '', 'category', '', '', 10, NULL, 'start', '', 'title', 'auto', '', 128, 'BxForumGridCategories', 'modules/boonex/forum/classes/BxForumGridCategories.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_forum_categories', 'icon', '_bx_forum_grid_column_title_icon', '10%', '', 1),
('bx_forum_categories', 'title', '_bx_forum_grid_column_title_title', '50%', '', 2),
('bx_forum_categories', 'visible_for_levels', '_bx_forum_grid_column_title_visible_for_levels', '20%', '', 3),
('bx_forum_categories', 'actions', '', '20%', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_forum_categories', 'single', 'show_to', '_bx_forum_grid_action_title_show_to', '', 0, 1),
('bx_forum_categories', 'single', 'edit', '_bx_forum_grid_action_title_adm_edit', 'pencil-alt', 0, 2);


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'create entry', NULL, '_bx_forum_acl_action_create_entry', '', 1, 3);
SET @iIdActionEntryCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'delete entry', NULL, '_bx_forum_acl_action_delete_entry', '', 1, 3);
SET @iIdActionEntryDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'view entry', NULL, '_bx_forum_acl_action_view_entry', '', 1, 0);
SET @iIdActionEntryView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'set thumb', NULL, '_bx_forum_acl_action_set_thumb', '', 1, 3);
SET @iIdActionSetThumb = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'edit any entry', NULL, '_bx_forum_acl_action_edit_any_entry', '', 1, 3);
SET @iIdActionEntryEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'delete any entry', NULL, '_bx_forum_acl_action_delete_any_entry', '', 1, 3);
SET @iIdActionEntryDeleteAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'stick any entry', NULL, '_bx_forum_acl_action_stick_any_entry', '', 1, 3);
SET @iIdActionEntryStickAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'lock any entry', NULL, '_bx_forum_acl_action_lock_any_entry', '', 1, 3);
SET @iIdActionEntryLockAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'hide any entry', NULL, '_bx_forum_acl_action_hide_any_entry', '', 1, 3);
SET @iIdActionEntryHideAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'resolve any entry', NULL, '_bx_forum_acl_action_resolve_any_entry', '', 1, 3);
SET @iIdActionEntryResolveAny = LAST_INSERT_ID();

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
(@iAdministrator, @iIdActionEntryDeleteAny),

-- stick any entry
(@iModerator, @iIdActionEntryStickAny),
(@iAdministrator, @iIdActionEntryStickAny),

-- lock any entry
(@iModerator, @iIdActionEntryLockAny),
(@iAdministrator, @iIdActionEntryLockAny),

-- hide any entry
(@iModerator, @iIdActionEntryHideAny),
(@iAdministrator, @iIdActionEntryHideAny),

-- resolve any entry
(@iModerator, @iIdActionEntryResolveAny),
(@iAdministrator, @iIdActionEntryResolveAny);


-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_forum_allow_view_to', @sName, 'view', '_bx_forum_form_entry_input_allow_view_to', '3', 'bx_forum_discussions', 'id', 'author', '', ''),
('bx_forum_allow_view_favorite_list', @sName, 'view_favorite_list', '_bx_forum_form_entry_input_allow_view_favorite_list', '3', 'bx_forum_favorites_lists', 'id', 'author_id', '', '');



-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
(@sName, '_bx_forum', @iSearchOrder + 1, 'BxForumSearchResult', 'modules/boonex/forum/classes/BxForumSearchResult.php'),
('bx_forum_cmts', '_bx_forum_cmts', @iSearchOrder + 2, 'BxForumCmtsSearchResult', 'modules/boonex/forum/classes/BxForumCmtsSearchResult.php');


-- CONNECTIONS
INSERT INTO `sys_objects_connection` (`object`, `table`, `profile_initiator`, `profile_content`, `type`, `override_class_name`, `override_class_file`) VALUES
('bx_forum_subscribers', 'bx_forum_subscribers', 1, 0, 'one-way', '', '');


-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
(@sName, @sName, 'bx_forum_meta_keywords', '', 'bx_forum_meta_mentions', 'BxForumMetatags', 'modules/boonex/forum/classes/BxForumMetatags.php');


-- CATEGORY
INSERT INTO `sys_objects_category` (`object`, `module`, `search_object`, `form_object`, `list_name`, `table`, `field`, `join`, `where`, `override_class_name`, `override_class_file`) VALUES
('bx_forum_cats', @sName, @sName, @sName, 'bx_forum_cats', 'bx_forum_discussions', 'cat', 'INNER JOIN `sys_profiles` ON (`sys_profiles`.`id` = ABS(`bx_forum_discussions`.`author`))', 'AND `sys_profiles`.`status` = ''active''', 'BxForumCategory', 'modules/boonex/forum/classes/BxForumCategory.php');


-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
(@sName, @sName, '_bx_forum', 'page.php?i=discussions-home', 'far comments', 'SELECT COUNT(*) FROM `bx_forum_discussions` WHERE 1 AND `status` = ''active'' AND `status_admin` = ''active''', @iMaxOrderStats + 1);


-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_forum_growth', '_bx_forum_chart_growth', 'bx_forum_discussions', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_forum_growth_speed', '_bx_forum_chart_growth_speed', 'bx_forum_discussions', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');


-- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_forum_html5', 1, 'BxForumUploaderHTML5', 'modules/boonex/forum/classes/BxForumUploaderHTML5.php'),
('bx_forum_record_video', 1, 'BxForumUploaderRecordVideo', 'modules/boonex/forum/classes/BxForumUploaderRecordVideo.php'),
('bx_forum_photos_html5', 1, 'BxForumUploaderHTML5Attach', 'modules/boonex/forum/classes/BxForumUploaderHTML5Attach.php'),
('bx_forum_videos_html5', 1, 'BxForumUploaderHTML5Attach', 'modules/boonex/forum/classes/BxForumUploaderHTML5Attach.php'),
('bx_forum_videos_record_video', 1, 'BxForumUploaderRecordVideoAttach', 'modules/boonex/forum/classes/BxForumUploaderRecordVideoAttach.php'),
('bx_forum_files_html5', 1, 'BxForumUploaderHTML5Attach', 'modules/boonex/forum/classes/BxForumUploaderHTML5Attach.php');


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxForumAlertsResponse', 'modules/boonex/forum/classes/BxForumAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('profile', 'delete', @iHandler),
(@sName, 'commentPost', @iHandler),
(@sName, 'commentUpdated', @iHandler),
(@sName, 'commentRemoved', @iHandler),
('bx_forum_files_cmts', 'file_deleted', @iHandler);


-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
(@sName, '_bx_forum_email_new_reply', 'bx_forum_new_reply', '_bx_forum_email_new_reply_subject', '_bx_forum_email_new_reply_body');

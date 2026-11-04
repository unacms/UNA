
-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_shopify', '_bx_shopify', 'bx_shopify@modules/boonex/shopify/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_shopify', '_bx_shopify', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_shopify_enable_auto_approve', 'on', @iCategId, '_bx_shopify_option_enable_auto_approve', 'checkbox', '', '', '', 0),
('bx_shopify_per_page_browse', '12', @iCategId, '_bx_shopify_option_per_page_browse', 'digit', '', '', '', 10),
('bx_shopify_per_page_profile', '6', @iCategId, '_bx_shopify_option_per_page_profile', 'digit', '', '', '', 12),
('bx_shopify_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', 'digit', '', '', '', 15),
('bx_shopify_rss_num', '10', @iCategId, '_bx_shopify_option_rss_num', 'digit', '', '', '', 20),
('bx_shopify_searchable_fields', 'title', @iCategId, '_bx_shopify_option_searchable_fields', 'list', '', '', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:21:"get_searchable_fields";}', 30);

-- PAGE: create entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_create_entry', '_bx_shopify_page_title_sys_create_entry', '_bx_shopify_page_title_create_entry', 'bx_shopify', 5, 2147483647, 1, 'create-shopify-entry', 'page.php?i=create-shopify-entry', '', '', '', 0, 1, 0, 'BxShopifyPageBrowse', 'modules/boonex/shopify/classes/BxShopifyPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_shopify_create_entry', 1, 'bx_shopify', '_bx_shopify_page_block_title_create_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:13:"entity_create";}', 0, 1, 1);

-- PAGE: edit entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_edit_entry', '_bx_shopify_page_title_sys_edit_entry', '_bx_shopify_page_title_edit_entry', 'bx_shopify', 5, 2147483647, 1, 'edit-shopify-entry', '', '', '', '', 0, 1, 0, 'BxShopifyPageEntry', 'modules/boonex/shopify/classes/BxShopifyPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_shopify_edit_entry', 1, 'bx_shopify', '_bx_shopify_page_block_title_edit_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);

-- PAGE: delete entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_delete_entry', '_bx_shopify_page_title_sys_delete_entry', '_bx_shopify_page_title_delete_entry', 'bx_shopify', 5, 2147483647, 1, 'delete-shopify-entry', '', '', '', '', 0, 1, 0, 'BxShopifyPageEntry', 'modules/boonex/shopify/classes/BxShopifyPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_shopify_delete_entry', 1, 'bx_shopify', '_bx_shopify_page_block_title_delete_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);

-- PAGE: view entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_view_entry', '_bx_shopify_page_title_sys_view_entry', '_bx_shopify_page_title_view_entry', 'bx_shopify', 12, 2147483647, 1, 'view-shopify-entry', '', '', '', '', 0, 1, 0, 'BxShopifyPageEntry', 'modules/boonex/shopify/classes/BxShopifyPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_shopify_view_entry', 2, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_text', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:17:"entity_text_block";}', 0, 0, 1, 1),
('bx_shopify_view_entry', 2, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_attachments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:18:"entity_attachments";}', 0, 0, 1, 2),
('bx_shopify_view_entry', 3, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_author', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:13:"entity_author";}', 0, 0, 1, 3),
('bx_shopify_view_entry', 3, 'bx_shopify', '_bx_shopify_page_block_title_sys_entry_context', '_bx_shopify_page_block_title_entry_context', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:10:\"bx_shopify\";s:6:\"method\";s:14:\"entity_context\";}', 0, 0, 1, 1),
('bx_shopify_view_entry', 3, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:11:"entity_info";}', 0, 0, 1, 2),
('bx_shopify_view_entry', 3, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_location', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:15:"entity_location";}', 0, 0, 0, 0),
('bx_shopify_view_entry', 2, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:18:"entity_all_actions";}', 0, 0, 1, 3),
('bx_shopify_view_entry', 4, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:14:"entity_actions";}', 0, 0, 0, 0),
('bx_shopify_view_entry', 4, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_social_sharing', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:21:"entity_social_sharing";}', 0, 0, 0, 0),
('bx_shopify_view_entry', 2, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:15:"entity_comments";}', 0, 0, 1, 4),
('bx_shopify_view_entry', 3, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_location', 3, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"locations_map";s:6:"params";a:2:{i:0;s:10:"bx_shopify";i:1;s:4:"{id}";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 0, 1, 4),
('bx_shopify_view_entry', 2, 'bx_shopify', '', '_bx_shopify_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:10:\"bx_shopify\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);


-- PAGE: view entry comments
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_view_entry_comments', '_bx_shopify_page_title_sys_view_entry_comments', '_bx_shopify_page_title_view_entry_comments', 'bx_shopify', 5, 2147483647, 1, 'view-shopify-entry-comments', '', '', '', '', 0, 1, 0, 'BxShopifyPageEntry', 'modules/boonex/shopify/classes/BxShopifyPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_shopify_view_entry_comments', 1, 'bx_shopify', '_bx_shopify_page_block_title_entry_comments', '_bx_shopify_page_block_title_entry_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:15:"entity_comments";}', 0, 0, 1);

-- PAGE: popular entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_popular', '_bx_shopify_page_title_sys_entries_popular', '_bx_shopify_page_title_entries_popular', 'bx_shopify', 5, 2147483647, 1, 'shopify-popular', 'page.php?i=shopify-popular', '', '', '', 0, 1, 0, 'BxShopifyPageBrowse', 'modules/boonex/shopify/classes/BxShopifyPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_shopify_popular', 1, 'bx_shopify', '_bx_shopify_page_block_title_popular_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:14:"browse_popular";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);

-- PAGE: recently updated entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_updated', '_bx_shopify_page_title_sys_entries_updated', '_bx_shopify_page_title_entries_updated', 'bx_shopify', 5, 2147483647, 1, 'shopify-updated', 'page.php?i=shopify-updated', '', '', '', 0, 1, 0, 'BxShopifyPageBrowse', 'modules/boonex/shopify/classes/BxShopifyPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_shopify_updated', 1, 'bx_shopify', '_bx_shopify_page_block_title_updated_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:14:"browse_updated";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);

-- PAGE: entries of author
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_author', 'shopify-author', '_bx_shopify_page_title_sys_entries_of_author', '_bx_shopify_page_title_entries_of_author', 'bx_shopify', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxShopifyPageAuthor', 'modules/boonex/shopify/classes/BxShopifyPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_shopify_author', 1, 'bx_shopify', '', '_bx_shopify_page_block_title_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:18:"my_entries_actions";}', 0, 0, 1, 1),
('bx_shopify_author', 1, 'bx_shopify', '_bx_shopify_page_block_title_sys_favorites_of_author', '_bx_shopify_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:15:"browse_favorite";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 1, 1, 2),
('bx_shopify_author', 1, 'bx_shopify', '_bx_shopify_page_block_title_sys_entries_of_author', '_bx_shopify_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:13:"browse_author";}', 0, 0, 1, 3),
('bx_shopify_author', 1, 'bx_shopify', '_bx_shopify_page_block_title_sys_entries_in_context', '_bx_shopify_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:14:"browse_context";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";i:0;a:1:{s:13:"empty_message";b:0;}}}', 0, 0, 1, 4);


-- PAGE: entries in context
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_context', 'shopify-context', '_bx_shopify_page_title_sys_entries_in_context', '_bx_shopify_page_title_entries_in_context', 'bx_shopify', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxShopifyPageAuthor', 'modules/boonex/shopify/classes/BxShopifyPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_shopify_context', 1, 'bx_shopify', '_bx_shopify_page_block_title_sys_entries_in_context', '_bx_shopify_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:10:\"bx_shopify\";s:6:\"method\";s:14:\"browse_context\";}', 0, 0, 1, 1);

-- PAGE: module home
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_home', 'shopify-home', '_bx_shopify_page_title_sys_home', '_bx_shopify_page_title_home', 'bx_shopify', 2, 2147483647, 1, 'page.php?i=shopify-home', '', '', '', 0, 1, 0, 'BxShopifyPageBrowse', 'modules/boonex/shopify/classes/BxShopifyPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_shopify_home', 1, 'bx_shopify', '', '_bx_shopify_page_block_title_featured_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, 1, 0),
('bx_shopify_home', 1, 'bx_shopify', '', '_bx_shopify_page_block_title_recent_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:13:"browse_public";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, 1, 1),
('bx_shopify_home', 2, 'bx_shopify', '', '_bx_shopify_page_block_title_popular_keywords', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"keywords_cloud";s:6:"params";a:2:{i:0;s:10:"bx_shopify";i:1;s:10:"bx_shopify";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 1, 1, 0),
('bx_shopify_home', 2, 'bx_shopify', '', '_bx_shopify_page_block_title_cats', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"categories_list";s:6:"params";a:2:{i:0;s:15:"bx_shopify_cats";i:1;a:1:{s:10:"show_empty";b:1;}}s:5:"class";s:20:"TemplServiceCategory";}', 0, 1, 1, 1);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_search', '_bx_shopify_page_title_sys_entries_search', '_bx_shopify_page_title_entries_search', 'bx_shopify', 5, 2147483647, 1, 'shopify-search', 'page.php?i=shopify-search', '', '', '', 0, 1, 0, 'BxShopifyPageBrowse', 'modules/boonex/shopify/classes/BxShopifyPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_shopify_search', 1, 'bx_shopify', '_bx_shopify_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:10:"bx_shopify";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_shopify_search', 1, 'bx_shopify', '_bx_shopify_page_block_title_search_results', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:27:"get_results_search_extended";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:10:"bx_shopify";s:10:"show_empty";b:1;}}}', 0, 1, 1, 2),
('bx_shopify_search', 1, 'bx_shopify', '_bx_shopify_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:15:"bx_shopify_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_shopify_search', 1, 'bx_shopify', '_bx_shopify_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:15:"bx_shopify_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: module manage own
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_manage', '_bx_shopify_page_title_sys_manage', '_bx_shopify_page_title_manage', 'bx_shopify', 5, 2147483647, 1, 'shopify-manage', 'page.php?i=shopify-manage', '', '', '', 0, 1, 0, 'BxShopifyPageBrowse', 'modules/boonex/shopify/classes/BxShopifyPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_shopify_manage', 1, 'bx_shopify', '_bx_shopify_page_block_title_system_manage', '_bx_shopify_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:12:"manage_tools";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_administration', '_bx_shopify_page_title_sys_manage_administration', '_bx_shopify_page_title_manage', 'bx_shopify', 5, 192, 1, 'shopify-administration', 'page.php?i=shopify-administration', '', '', '', 0, 1, 0, 'BxShopifyPageBrowse', 'modules/boonex/shopify/classes/BxShopifyPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_shopify_administration', 1, 'bx_shopify', '_bx_shopify_page_block_title_system_manage_administration', '_bx_shopify_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);

-- PAGE: module settings
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_settings', '_bx_shopify_page_title_sys_settings', '_bx_shopify_page_title_settings', 'bx_shopify', 5, 2147483647, 1, 'shopify-settings', 'page.php?i=shopify-settings', '', '', '', 0, 1, 0, 'BxShopifyPageBrowse', 'modules/boonex/shopify/classes/BxShopifyPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_shopify_settings', 1, 'bx_shopify', '_bx_shopify_page_block_title_system_settings', '_bx_shopify_page_block_title_settings', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:8:"settings";}}', 0, 1, 0);

-- PAGE: add block to homepage
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', 1, 'bx_shopify', '_bx_shopify_page_block_title_recent_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:13:"browse_public";s:6:"params";a:2:{i:0;b:0;i:1;b:0;}}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 3;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_shopify', '_bx_shopify_page_block_title_sys_my_entries', '_bx_shopify_page_block_title_my_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:13:"browse_author";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:2:{s:8:"per_page";s:27:"bx_shopify_per_page_profile";s:13:"empty_message";b:0;}}}', 0, 0, 0);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('', 0, 'bx_shopify', '', '_bx_shopify_page_block_title_recent_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:13:"browse_public";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 1),

('', 0, 'bx_shopify', '', '_bx_shopify_page_block_title_recent_entries_view_full', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:13:"browse_public";s:6:"params";a:1:{i:0;s:4:"full";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, 'bx_shopify', '', '_bx_shopify_page_block_title_popular_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:14:"browse_popular";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 3),
('', 0, 'bx_shopify', '', '_bx_shopify_page_block_title_popular_entries_view_full', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:14:"browse_popular";s:6:"params";a:1:{i:0;s:4:"full";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 4),
('', 0, 'bx_shopify', '_bx_shopify_page_block_title_sys_recent_entries_view_showcase', '_bx_shopify_page_block_title_recent_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:10:\"bx_shopify\";s:6:\"method\";s:13:\"browse_public\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 5),
('', 0, 'bx_shopify', '_bx_shopify_page_block_title_sys_popular_entries_view_showcase', '_bx_shopify_page_block_title_popular_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:10:\"bx_shopify\";s:6:\"method\";s:14:\"browse_popular\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 6),
('', 0, 'bx_shopify', '_bx_shopify_page_block_title_sys_featured_entries_view_showcase', '_bx_shopify_page_block_title_featured_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:10:\"bx_shopify\";s:6:\"method\";s:15:\"browse_featured\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 7);


-- MENU: add to site menu
SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_shopify', 'shopify-home', '_bx_shopify_menu_item_title_system_entries_home', '_bx_shopify_menu_item_title_entries_home', 'page.php?i=shopify-home', '', '', 'shopping-bag', 'bx_shopify_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu
SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_shopify', 'shopify-home', '_bx_shopify_menu_item_title_system_entries_home', '_bx_shopify_menu_item_title_entries_home', 'page.php?i=shopify-home', '', '', 'shopping-bag', 'bx_shopify_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: add to "add content" menu
SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_shopify', 'create-shopify-entry', '_bx_shopify_menu_item_title_system_create_entry', '_bx_shopify_menu_item_title_create_entry', 'page.php?i=create-shopify-entry', '', '', 'shopping-bag', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_view', '_bx_shopify_menu_title_view_entry', 'bx_shopify_view', 'bx_shopify', 9, 0, 1, 'BxShopifyMenuView', 'modules/boonex/shopify/classes/BxShopifyMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_shopify_view', 'bx_shopify', '_bx_shopify_menu_set_title_view_entry', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_shopify_view', 'bx_shopify', 'edit-shopify-entry', '_bx_shopify_menu_item_title_system_edit_entry', '_bx_shopify_menu_item_title_edit_entry', 'page.php?i=edit-shopify-entry&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 1, 0, 1),
('bx_shopify_view', 'bx_shopify', 'delete-shopify-entry', '_bx_shopify_menu_item_title_system_delete_entry', '_bx_shopify_menu_item_title_delete_entry', 'page.php?i=delete-shopify-entry&id={content_id}', '', '', 'remove', '', 2147483647, 1, 0, 2),
('bx_shopify_view', 'bx_shopify', 'approve', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 2147483647, 1, 0, 3);

-- MENU: all actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_view_actions', '_sys_menu_title_view_actions', 'bx_shopify_view_actions', 'bx_shopify', 15, 0, 1, 'BxShopifyMenuViewActions', 'modules/boonex/shopify/classes/BxShopifyMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_shopify_view_actions', 'bx_shopify', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_shopify_view_actions', 'bx_shopify', 'buy-shopify-entry', '_bx_shopify_menu_item_title_system_buy_entry', '_bx_shopify_menu_item_title_buy_entry', '', '', '', '', '', '', 0, 2147483647, 1, 0, 0),
('bx_shopify_view_actions', 'bx_shopify', 'edit-shopify-entry', '_bx_shopify_menu_item_title_system_edit_entry', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 10),
('bx_shopify_view_actions', 'bx_shopify', 'delete-shopify-entry', '_bx_shopify_menu_item_title_system_delete_entry', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 20),
('bx_shopify_view_actions', 'bx_shopify', 'approve', '_sys_menu_item_title_system_va_approve', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 30),
('bx_shopify_view_actions', 'bx_shopify', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 200),
('bx_shopify_view_actions', 'bx_shopify', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 210),
('bx_shopify_view_actions', 'bx_shopify', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 220),
('bx_shopify_view_actions', 'bx_shopify', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 225),
('bx_shopify_view_actions', 'bx_shopify', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 230),
('bx_shopify_view_actions', 'bx_shopify', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 240),
('bx_shopify_view_actions', 'bx_shopify', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 250),
('bx_shopify_view_actions', 'bx_shopify', 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 260),
('bx_shopify_view_actions', 'bx_shopify', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 270),
('bx_shopify_view_actions', 'bx_shopify', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', '', 0, 2147483647, 1, 0, 280),
('bx_shopify_view_actions', 'bx_shopify', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_shopify&content_id={content_id}', '', '', 'history', '', '', 0, 192, 1, 0, 290),
('bx_shopify_view_actions', 'bx_shopify', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, 1, 0, 300),
('bx_shopify_view_actions', 'bx_shopify', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, 1, 0, 9999);

-- MENU: actions menu for my entries
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_my', '_bx_shopify_menu_title_entries_my', 'bx_shopify_my', 'bx_shopify', 9, 0, 1, 'BxShopifyMenu', 'modules/boonex/shopify/classes/BxShopifyMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_shopify_my', 'bx_shopify', '_bx_shopify_menu_set_title_entries_my', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_shopify_my', 'bx_shopify', 'create-shopify-entry', '_bx_shopify_menu_item_title_system_create_entry', '_bx_shopify_menu_item_title_create_entry', 'page.php?i=create-shopify-entry', '', '', 'plus', '', 2147483647, 1, 0, 0);

-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_submenu', '_bx_shopify_menu_title_submenu', 'bx_shopify_submenu', 'bx_shopify', 8, 0, 1, 'BxShopifyMenuSubmenu', 'modules/boonex/shopify/classes/BxShopifyMenuSubmenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_shopify_submenu', 'bx_shopify', '_bx_shopify_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_shopify_submenu', 'bx_shopify', 'shopify-home', '_bx_shopify_menu_item_title_system_entries_public', '_bx_shopify_menu_item_title_entries_public', 'page.php?i=shopify-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_shopify_submenu', 'bx_shopify', 'shopify-popular', '_bx_shopify_menu_item_title_system_entries_popular', '_bx_shopify_menu_item_title_entries_popular', 'page.php?i=shopify-popular', '', '', '', '', 2147483647, 1, 1, 2),
('bx_shopify_submenu', 'bx_shopify', 'shopify-search', '_bx_shopify_menu_item_title_system_entries_search', '_bx_shopify_menu_item_title_entries_search', 'page.php?i=shopify-search', '', '', '', '', 2147483647, 1, 1, 3),
('bx_shopify_submenu', 'bx_shopify', 'shopify-manage', '_bx_shopify_menu_item_title_system_entries_manage', '_bx_shopify_menu_item_title_entries_manage', 'page.php?i=shopify-manage', '', '', '', '', 2147483646, 1, 1, 4),
('bx_shopify_submenu', 'bx_shopify', 'shopify-settings', '_bx_shopify_menu_item_title_system_settings', '_bx_shopify_menu_item_title_settings', 'page.php?i=shopify-settings', '', '', '', '', 2147483646, 1, 1, 5),
('bx_shopify_submenu', 'bx_shopify', 'shopify-dashboard', '_bx_shopify_menu_item_title_system_dashboard', '_bx_shopify_menu_item_title_dashboard', 'https://{domain}/admin', '', '_blank', '', '', 2147483646, 1, 1, 6);

-- MENU: sub-menu for view entry
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_view_submenu', '_bx_shopify_menu_title_view_entry_submenu', 'bx_shopify_view_submenu', 'bx_shopify', 8, 0, 0, 'BxShopifyMenuView', 'modules/boonex/shopify/classes/BxShopifyMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_shopify_view_submenu', 'bx_shopify', '_bx_shopify_menu_set_title_view_entry_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_shopify_view_submenu', 'bx_shopify', 'view-shopify-entry', '_bx_shopify_menu_item_title_system_view_entry', '_bx_shopify_menu_item_title_view_entry_submenu_entry', 'page.php?i=view-shopify-entry&id={content_id}', '', '', '', '', 2147483647, 1, 0, 1),
('bx_shopify_view_submenu', 'bx_shopify', 'view-shopify-entry-comments', '_bx_shopify_menu_item_title_system_view_entry_comments', '_bx_shopify_menu_item_title_view_entry_submenu_comments', 'page.php?i=view-shopify-entry-comments&id={content_id}', '', '', '', '', 2147483647, 1, 0, 2);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_shopify_snippet_meta', 'bx_shopify', 15, 0, 1, 'BxShopifyMenuSnippetMeta', 'modules/boonex/shopify/classes/BxShopifyMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_shopify_snippet_meta', 'bx_shopify', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_shopify_snippet_meta', 'bx_shopify', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, 1, 0, 1, 1),
('bx_shopify_snippet_meta', 'bx_shopify', 'author', '_sys_menu_item_title_system_sm_author', '_sys_menu_item_title_sm_author', '', '', '', '', '', 2147483647, 1, 0, 1, 2),
('bx_shopify_snippet_meta', 'bx_shopify', 'category', '_sys_menu_item_title_system_sm_category', '_sys_menu_item_title_sm_category', '', '', '', '', '', 2147483647, 0, 0, 1, 3),
('bx_shopify_snippet_meta', 'bx_shopify', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, 0, 0, 1, 4),
('bx_shopify_snippet_meta', 'bx_shopify', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, 0, 0, 1, 5),
('bx_shopify_snippet_meta', 'bx_shopify', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, 0, 0, 1, 6);

-- MENU: profile stats
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_shopify', 'profile-stats-my-shopify', '_bx_shopify_menu_item_title_system_manage_my_entries', '_bx_shopify_menu_item_title_manage_my_entries', 'page.php?i=shopify-author&profile_id={member_id}', '', '_self', 'shopping-bag', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:41:"get_menu_addon_manage_tools_profile_stats";}', '', 2147483646, 1, 0, @iNotifMenuOrder + 1);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_shopify_menu_manage_tools', '_bx_shopify_menu_title_manage_tools', 'bx_shopify_menu_manage_tools', 'bx_shopify', 6, 0, 1, 'BxShopifyMenuManageTools', 'modules/boonex/shopify/classes/BxShopifyMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_shopify_menu_manage_tools', 'bx_shopify', '_bx_shopify_menu_set_title_manage_tools', 0);

--INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
--('bx_shopify_menu_manage_tools', 'bx_shopify', 'delete-with-content', '_bx_shopify_menu_item_title_system_delete_with_content', '_bx_shopify_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 128, 1, 0, 0);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_shopify', 'shopify-administration', '_bx_shopify_menu_item_title_system_admt_entries', '_bx_shopify_menu_item_title_admt_entries', 'page.php?i=shopify-administration', '', '_self', 'shopping-bag', 'a:2:{s:6:"module";s:10:"bx_shopify";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_shopify', 'shopify-author', '_bx_shopify_menu_item_title_system_view_entries_author', '_bx_shopify_menu_item_title_view_entries_author', 'page.php?i=shopify-author&profile_id={profile_id}', '', '', 'shopping-bag', '', 2147483647, 1, 0, 0),
('trigger_group_view_submenu', 'bx_shopify', 'shopify-context', '_bx_shopify_menu_item_title_system_view_entries_in_context', '_bx_shopify_menu_item_title_view_entries_in_context', 'page.php?i=shopify-context&profile_id={profile_id}', '', '', 'shopping-bag', '', 2147483647, 1, 0, 0);
 
-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_shopify_allow_view_to', 'bx_shopify', 'view', '_bx_shopify_form_entry_input_allow_view_to', '3', 'bx_shopify_entries', 'id', 'author', '', '');

-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_shopify', 'create entry', NULL, '_bx_shopify_acl_action_create_entry', '', 1, 3);
SET @iIdActionEntryCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_shopify', 'delete entry', NULL, '_bx_shopify_acl_action_delete_entry', '', 1, 3);
SET @iIdActionEntryDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_shopify', 'view entry', NULL, '_bx_shopify_acl_action_view_entry', '', 1, 0);
SET @iIdActionEntryView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_shopify', 'set thumb', NULL, '_bx_shopify_acl_action_set_thumb', '', 1, 3);
SET @iIdActionSetThumb = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_shopify', 'edit any entry', NULL, '_bx_shopify_acl_action_edit_any_entry', '', 1, 3);
SET @iIdActionEntryEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_shopify', 'delete any entry', NULL, '_bx_shopify_acl_action_delete_any_entry', '', 1, 3);
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
('bx_shopify', '_bx_shopify', @iSearchOrder + 1, 'BxShopifySearchResult', 'modules/boonex/shopify/classes/BxShopifySearchResult.php'),
('bx_shopify_cmts', '_bx_shopify_cmts', @iSearchOrder + 2, 'BxShopifyCmtsSearchResult', 'modules/boonex/shopify/classes/BxShopifyCmtsSearchResult.php');


-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('bx_shopify', 'bx_shopify', 'bx_shopify_meta_keywords', 'bx_shopify_meta_locations', 'bx_shopify_meta_mentions', '', '');


-- CATEGORY
INSERT INTO `sys_objects_category` (`object`, `module`, `search_object`, `form_object`, `list_name`, `table`, `field`, `join`, `where`, `override_class_name`, `override_class_file`) VALUES
('bx_shopify_cats', 'bx_shopify', 'bx_shopify', 'bx_shopify', 'bx_shopify_cats', 'bx_shopify_entries', 'cat', 'INNER JOIN `sys_profiles` ON (`sys_profiles`.`id` = `bx_shopify_entries`.`author`)', 'AND `sys_profiles`.`status` = ''active''', '', '');


-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_shopify', 'bx_shopify', '_bx_shopify', 'page.php?i=shopify-home', 'shopping-bag', 'SELECT COUNT(*) FROM `bx_shopify_entries` WHERE 1 AND `status` = ''active'' AND `status_admin` = ''active''', @iMaxOrderStats + 1);


-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_shopify_growth', '_bx_shopify_chart_growth', 'bx_shopify_entries', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_shopify_growth_speed', '_bx_shopify_chart_growth_speed', 'bx_shopify_entries', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');


-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_shopify_administration', 'Sql', 'SELECT * FROM `bx_shopify_entries` WHERE 1 ', 'bx_shopify_entries', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'title,text', '', 'like', 'reports', '', 192, 'BxShopifyGridAdministration', 'modules/boonex/shopify/classes/BxShopifyGridAdministration.php'),
('bx_shopify_common', 'Sql', 'SELECT * FROM `bx_shopify_entries` WHERE 1 ', 'bx_shopify_entries', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'title,text', '', 'like', '', '', 2147483647, 'BxShopifyGridCommon', 'modules/boonex/shopify/classes/BxShopifyGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_shopify_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_shopify_administration', 'switcher', '_bx_shopify_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_shopify_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_shopify_administration', 'title', '_bx_shopify_grid_column_title_adm_title', '25%', 0, '25', '', 4),
('bx_shopify_administration', 'added', '_bx_shopify_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_shopify_administration', 'author', '_bx_shopify_grid_column_title_adm_author', '20%', 0, '25', '', 6),
('bx_shopify_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_shopify_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_shopify_common', 'switcher', '_bx_shopify_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_shopify_common', 'title', '_bx_shopify_grid_column_title_adm_title', '40%', 0, '35', '', 3),
('bx_shopify_common', 'added', '_bx_shopify_grid_column_title_adm_added', '15%', 1, '25', '', 4),
('bx_shopify_common', 'status_admin', '_bx_shopify_grid_column_title_adm_status_admin', '15%', 0, '16', '', 5),
('bx_shopify_common', 'actions', '', '20%', 0, '', '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_shopify_administration', 'bulk', 'delete', '_bx_shopify_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_shopify_administration', 'bulk', 'clear_reports', '_bx_shopify_grid_action_title_adm_clear_reports', '', 0, 1, 2),
('bx_shopify_administration', 'single', 'edit', '_bx_shopify_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_shopify_administration', 'single', 'delete', '_bx_shopify_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_shopify_administration', 'single', 'settings', '_bx_shopify_grid_action_title_adm_more_actions', 'cog', 1, 0, 3),
('bx_shopify_administration', 'single', 'audit_content', '_bx_shopify_grid_action_title_adm_audit_content', 'search', 1, 0, 4),
('bx_shopify_administration', 'single', 'clear_reports', '_bx_shopify_grid_action_title_adm_clear_reports', 'eraser', 1, 0, 5),

('bx_shopify_common', 'bulk', 'delete', '_bx_shopify_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_shopify_common', 'single', 'edit', '_bx_shopify_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_shopify_common', 'single', 'delete', '_bx_shopify_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_shopify_common', 'single', 'settings', '_bx_shopify_grid_action_title_adm_more_actions', 'cog', 1, 0, 3);


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_shopify', 'BxShopifyAlertsResponse', 'modules/boonex/shopify/classes/BxShopifyAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('profile', 'delete', @iHandler);


-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_market', '_bx_market', 'bx_market@modules/boonex/market/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_market', '_bx_market', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_market_enable_auto_approve', 'on', @iCategId, '_bx_market_option_enable_auto_approve', 'checkbox', '', '', '', 0),
('bx_market_enable_no_payments', '', @iCategId, '_bx_market_option_enable_no_payments', 'checkbox', '', '', '', 1),
('bx_market_enable_recurring', 'on', @iCategId, '_bx_market_option_enable_recurring', 'checkbox', '', '', '', 2),
('bx_market_recurring_reserve', '4', @iCategId, '_bx_market_option_recurring_reserve', 'digit', '', '', '', 3),
('bx_market_summary_chars', '700', @iCategId, '_bx_market_option_summary_chars', 'digit', '', '', '', 10),
('bx_market_plain_summary_chars', '240', @iCategId, '_bx_market_option_plain_summary_chars', 'digit', '', '', '', 11),
('bx_market_per_page_browse', '12', @iCategId, '_bx_market_option_per_page_browse', 'digit', '', '', '', 20),
('bx_market_per_page_profile', '6', @iCategId, '_bx_market_option_per_page_profile', 'digit', '', '', '', 21),
('bx_market_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', 'digit', '', '', '', 23),
('bx_market_rss_num', '10', @iCategId, '_bx_market_option_rss_num', 'digit', '', '', '', 25),
('bx_market_searchable_fields', 'title,text', @iCategId, '_bx_market_option_searchable_fields', 'list', '', '', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:21:"get_searchable_fields";}', 30),
('bx_market_enable_icon', '', @iCategId, '_bx_market_option_enable_icon', 'checkbox', '', '', '', 40),
('bx_market_visible_categories', '10', @iCategId, '_bx_market_option_visible_categories', 'digit', '', '', '', 50);

-- PAGE: create entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_create_entry', '_bx_market_page_title_sys_create_entry', '_bx_market_page_title_create_entry', 'bx_market', 5, 2147483647, 1, 'create-product', 'page.php?i=create-product', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_market_create_entry', 1, 'bx_market', '_bx_market_page_block_title_create_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"entity_create";}', 0, 1, 1);


-- PAGE: edit entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_edit_entry', '_bx_market_page_title_sys_edit_entry', '_bx_market_page_title_edit_entry', 'bx_market', 5, 2147483647, 1, 'edit-product', '', '', '', '', 0, 1, 0, 'BxMarketPageEntry', 'modules/boonex/market/classes/BxMarketPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_market_edit_entry', 1, 'bx_market', '_bx_market_page_block_title_edit_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);


-- PAGE: delete entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_delete_entry', '_bx_market_page_title_sys_delete_entry', '_bx_market_page_title_delete_entry', 'bx_market', 5, 2147483647, 1, 'delete-product', '', '', '', '', 0, 1, 0, 'BxMarketPageEntry', 'modules/boonex/market/classes/BxMarketPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_market_delete_entry', 1, 'bx_market', '_bx_market_page_block_title_delete_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);


-- PAGE: download entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_download_entry', '_bx_market_page_title_sys_download_entry', '_bx_market_page_title_download_entry', 'bx_market', 5, 2147483647, 1, 'download-product', '', '', '', '', 0, 1, 0, 'BxMarketPageEntry', 'modules/boonex/market/classes/BxMarketPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_market_download_entry', 1, 'bx_market', '_bx_market_page_block_title_download_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"entity_download";}', 0, 0, 0);


-- PAGE: view entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_view_entry', '_bx_market_page_title_sys_view_entry', '_bx_market_page_title_view_entry', 'bx_market', 12, 2147483647, 1, 'view-product', '', '', '', '', 0, 1, 0, 'BxMarketPageEntry', 'modules/boonex/market/classes/BxMarketPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_market_view_entry', 1, 'bx_market', '', '_bx_market_page_block_title_entry_breadcrumb', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:17:"entity_breadcrumb";}', 0, 0, 1, 1),
('bx_market_view_entry', 2, 'bx_market', '', '_bx_market_page_block_title_entry_text', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:17:"entity_text_block";}', 0, 0, 1, 1),
('bx_market_view_entry', 2, 'bx_market', '', '_bx_market_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:18:"entity_all_actions";}', 0, 0, 1, 2),
('bx_market_view_entry', 2, 'bx_market', '', '_bx_market_page_block_title_entry_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"entity_actions";}', 0, 0, 0, 0),
('bx_market_view_entry', 2, 'bx_market', '', '_bx_market_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"entity_comments";}', 0, 0, 1, 3),
('bx_market_view_entry', 3, 'bx_market', '', '_bx_market_page_block_title_entry_author_entries', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:22:"entity_author_entities";}', 0, 0, 1, 6),
('bx_market_view_entry', 3, 'bx_market', '', '_bx_market_page_block_title_entry_social_sharing', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:21:"entity_social_sharing";}', 0, 0, 0, 0),
('bx_market_view_entry', 3, 'bx_market', '', '_bx_market_page_block_title_entry_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:11:"entity_info";}', 0, 0, 1, 2),
('bx_market_view_entry', 3, 'bx_market', '', '_bx_market_page_block_title_entry_rating', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"entity_rating";}', 0, 0, 1, 4),
('bx_market_view_entry', 3, 'bx_market', '', '_bx_market_page_block_title_entry_author', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"entity_author";}', 0, 0, 1, 3),
('bx_market_view_entry', 3, 'bx_market', '_bx_market_page_block_title_sys_entry_context', '_bx_market_page_block_title_entry_context', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_market\";s:6:\"method\";s:14:\"entity_context\";}', 0, 0, 1, 1),
('bx_market_view_entry', 3, 'bx_market', '', '_bx_market_page_block_title_entry_location', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"entity_location";}', 0, 0, 0, 0),
('bx_market_view_entry', 3, 'bx_market', '', '_bx_market_page_block_title_entry_location', 3, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"locations_map";s:6:"params";a:2:{i:0;s:9:"bx_market";i:1;s:4:"{id}";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 0, 1, 5),
('bx_market_view_entry', 3, 'bx_market', '', '_bx_market_page_block_title_entry_attachments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:18:"entity_attachments";}', 0, 0, 0, 0),
('bx_market_view_entry', 2, 'bx_market', '', '_bx_market_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_market\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);




-- PAGE: view entry comments
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_view_entry_comments', '_bx_market_page_title_sys_view_entry_comments', '_bx_market_page_title_view_entry_comments', 'bx_market', 5, 2147483647, 1, 'view-product-comments', '', '', '', '', 0, 1, 0, 'BxMarketPageEntry', 'modules/boonex/market/classes/BxMarketPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_view_entry_comments', 1, 'bx_market', '_bx_market_page_block_title_entry_comments', '_bx_market_page_block_title_entry_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"entity_comments";}', 0, 0, 1);


-- PAGE: view entry info
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_view_entry_info', '_bx_market_page_title_sys_view_entry_info', '_bx_market_page_title_view_entry_info', 'bx_market', 5, 2147483647, 1, 'view-product-info', '', '', '', '', 0, 1, 0, 'BxMarketPageEntry', 'modules/boonex/market/classes/BxMarketPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_view_entry_info', 1, 'bx_market', '_bx_market_page_block_title_entry_info', '_bx_market_page_block_title_entry_info_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:16:"entity_info_full";}', 0, 0, 1),
('bx_market_view_entry_info', 1, 'bx_market', '', '_bx_market_page_block_title_entry_text', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:17:"entity_text_block";}', 0, 0, 2);


-- PAGE: categories
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_categories', '_bx_market_page_title_sys_entries_categories', '_bx_market_page_title_entries_categories', 'bx_market', 5, 2147483647, 1, 'products-categories', 'page.php?i=products-categories', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_categories', 1, 'bx_market', '_bx_market_page_block_title_cats', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"categories_list";s:6:"params";a:2:{i:0;s:14:"bx_market_cats";i:1;a:1:{s:10:"show_empty";b:1;}}s:5:"class";s:20:"TemplServiceCategory";}', 0, 1, 1);


-- PAGE: entries by category
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_category', 'products-category', '_bx_market_page_title_sys_entries_by_category', '_bx_market_page_title_entries_by_category', 'bx_market', 1, 2147483647, 1, 'page.php?i=products-category', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_market_category', 1, 'bx_market', '_bx_market_page_block_title_cats', '_bx_market_page_block_title_cats', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"categories_list";s:6:"params";a:2:{i:0;s:14:"bx_market_cats";i:1;a:1:{s:10:"show_empty";b:1;}}s:5:"class";s:20:"TemplServiceCategory";}', 0, 0, 1, 1),
('bx_market_category', 2, 'bx_market', '_bx_market_page_block_title_sys_entries_by_category', '_bx_market_page_block_title_entries_by_category', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"browse_category";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 0, 1, 1);

-- PAGE: latest entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_latest', '_bx_market_page_title_sys_entries_latest', '_bx_market_page_title_entries_latest', 'bx_market', 5, 2147483647, 1, 'products-latest', 'page.php?i=products-latest', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_latest', 1, 'bx_market', '_bx_market_page_block_title_latest_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"browse_public";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 0, 1);


-- PAGE: featured entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_featured', '_bx_market_page_title_sys_entries_featured', '_bx_market_page_title_entries_featured', 'bx_market', 5, 2147483647, 1, 'products-featured', 'page.php?i=products-featured', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_featured', 1, 'bx_market', '_bx_market_page_block_title_featured_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"browse_featured";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 0, 1);


-- PAGE: popular entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_popular', '_bx_market_page_title_sys_entries_popular', '_bx_market_page_title_entries_popular', 'bx_market', 5, 2147483647, 1, 'products-popular', 'page.php?i=products-popular', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_popular', 1, 'bx_market', '_bx_market_page_block_title_popular_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"browse_popular";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 0, 1);


-- PAGE: top entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_top', '_bx_market_page_title_sys_entries_top', '_bx_market_page_title_entries_top', 'bx_market', 5, 2147483647, 1, 'products-top', 'page.php?i=products-top', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_top', 1, 'bx_market', '_bx_market_page_block_title_top_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:10:"browse_top";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 0, 1);


-- PAGE: updated entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_updated', '_bx_market_page_title_sys_entries_updated', '_bx_market_page_title_entries_updated', 'bx_market', 5, 2147483647, 1, 'products-updated', 'page.php?i=products-updated', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_updated', 1, 'bx_market', '_bx_market_page_block_title_updated_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"browse_updated";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 0, 1);


-- PAGE: entries of author
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_author', 'products-author', '_bx_market_page_title_sys_entries_of_author', '_bx_market_page_title_entries_of_author', 'bx_market', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxMarketPageAuthor', 'modules/boonex/market/classes/BxMarketPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_market_author', 1, 'bx_market', '', '_bx_market_page_block_title_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:18:"my_entries_actions";}', 0, 0, 1, 1),
('bx_market_author', 1, 'bx_market', '_bx_market_page_block_title_sys_favorites_of_author', '_bx_market_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"browse_favorite";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 1, 1, 2),
('bx_market_author', 1, 'bx_market', '_bx_market_page_block_title_sys_entries_of_author', '_bx_market_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"browse_author";}', 0, 0, 1, 3),
('bx_market_author', 1, 'bx_market', '_bx_market_page_block_title_sys_entries_in_context', '_bx_market_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"browse_context";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";i:0;a:1:{s:13:"empty_message";b:0;}}}', 0, 0, 1, 4);

-- PAGE: licenses administration
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_licenses_administration', '_bx_market_page_title_sys_licenses_administration', '_bx_market_page_title_licenses_administration', 'bx_market', 5, 192, 1, 'products-licenses-administration', '', '', '', '', 0, 1, 0, 'BxMarketPageLicenses', 'modules/boonex/market/classes/BxMarketPageLicenses.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_market_licenses_administration', 1, 'bx_market', '', '_bx_market_page_block_title_licenses_administration', 11, 192, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:29:"block_licenses_administration";}', 0, 0, 1, 0);

-- PAGE: profile's licenses
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_licenses', '_bx_market_page_title_sys_licenses', '_bx_market_page_title_licenses', 'bx_market', 5, 2147483647, 1, 'products-licenses', '', '', '', '', 0, 1, 0, 'BxMarketPageLicenses', 'modules/boonex/market/classes/BxMarketPageLicenses.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_market_licenses', 1, 'bx_market', '', '_bx_market_page_block_title_licenses_note', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:19:"block_licenses_note";}', 0, 0, 1, 0),
('bx_market_licenses', 1, 'bx_market', '', '_bx_market_page_block_title_licenses', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"block_licenses";}', 0, 0, 1, 1);

-- PAGE: entries in context

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_context', 'products-context', '_bx_market_page_title_sys_entries_in_context', '_bx_market_page_title_entries_in_context', 'bx_market', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxMarketPageAuthor', 'modules/boonex/market/classes/BxMarketPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_market_context', 1, 'bx_market', '_bx_market_page_block_title_sys_entries_in_context', '_bx_market_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_market\";s:6:\"method\";s:14:\"browse_context\";}', 0, 0, 1, 1);

-- PAGE: module home
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_home', 'products-home', '_bx_market_page_title_sys_home', '_bx_market_page_title_home', 'bx_market', 1, 2147483647, 1, 'page.php?i=products-home', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_market_home', 1, 'bx_market', '', '_bx_market_page_block_title_popular_keywords', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"keywords_cloud";s:6:"params";a:2:{i:0;s:9:"bx_market";i:1;s:9:"bx_market";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 1, 1, 0),
('bx_market_home', 1, 'bx_market', '', '_bx_market_page_block_title_cats', 11, 2147483647, 'menu', 'bx_market_categories', 0, 0, 1, 0),
('bx_market_home', 1, 'bx_market', '', '_bx_market_page_block_title_cats', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"categories_list";s:6:"params";a:2:{i:0;s:14:"bx_market_cats";i:1;a:1:{s:10:"show_empty";b:1;}}s:5:"class";s:20:"TemplServiceCategory";}', 0, 0, 0, 1),
('bx_market_home', 2, 'bx_market', '', '_bx_market_page_block_title_featured_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:7:"gallery";}}', 0, 1, 1, 0),
('bx_market_home', 2, 'bx_market', '', '_bx_market_page_block_title_latest_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"browse_public";s:6:"params";a:1:{i:0;s:7:"gallery";}}', 0, 1, 1, 1),
('bx_market_home', 2, 'bx_market', '', '_bx_market_page_block_title_popular_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"browse_popular";s:6:"params";a:2:{i:0;s:7:"gallery";i:1;b:0;}}', 0, 1, 1, 2),
('bx_market_home', 2, 'bx_market', '', '_bx_market_page_block_title_updated_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"browse_updated";s:6:"params";a:2:{i:0;s:7:"gallery";i:1;b:0;}}', 0, 1, 0, 3);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_search', '_bx_market_page_title_sys_entries_search', '_bx_market_page_title_entries_search', 'bx_market', 5, 2147483647, 1, 'products-search', 'page.php?i=products-search', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_market_search', 1, 'bx_market', '_bx_market_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:9:"bx_market";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_market_search', 1, 'bx_market', '_bx_market_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:9:"bx_market";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 2),
('bx_market_search', 1, 'bx_market', '_bx_market_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:14:"bx_market_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_market_search', 1, 'bx_market', '_bx_market_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:14:"bx_market_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: module manage own
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_manage', '_bx_market_page_title_sys_manage', '_bx_market_page_title_manage', 'bx_market', 5, 2147483647, 1, 'products-manage', 'page.php?i=products-manage', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_manage', 1, 'bx_market', '_bx_market_page_block_title_system_manage', '_bx_market_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:12:"manage_tools";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_administration', '_bx_market_page_title_sys_manage_administration', '_bx_market_page_title_manage', 'bx_market', 5, 192, 1, 'products-administration', 'page.php?i=products-administration', '', '', '', 0, 1, 0, 'BxMarketPageBrowse', 'modules/boonex/market/classes/BxMarketPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_market_administration', 1, 'bx_market', '_bx_market_page_block_title_system_manage_administration', '_bx_market_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);

-- PAGE: add block to homepage
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', 1, 'bx_market', '_bx_market_page_block_title_latest_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"browse_public";s:6:"params";a:2:{i:0;b:0;i:1;b:0;}}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 3;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_market', '_bx_market_page_block_title_sys_view_profile', '_bx_market_page_block_title_view_profile', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"browse_author";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:2:{s:8:"per_page";s:26:"bx_market_per_page_profile";s:13:"empty_message";b:0;}}}', 0, 0, 0);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('', 0, 'bx_market', '', '_bx_market_page_block_title_latest_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"browse_public";s:6:"params";a:1:{s:9:"unit_view";s:8:"extended";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 1),
('', 0, 'bx_market', '', '_bx_market_page_block_title_latest_entries_view_full', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:13:"browse_public";s:6:"params";a:1:{i:0;s:4:"full";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, 'bx_market', '', '_bx_market_page_block_title_popular_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"browse_popular";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 3),
('', 0, 'bx_market', '', '_bx_market_page_block_title_popular_entries_view_full', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"browse_popular";s:6:"params";a:1:{i:0;s:4:"full";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 4),
('', 0, 'bx_market', '', '_bx_market_page_block_title_featured_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{s:9:"unit_view";s:8:"extended";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 5),
('', 0, 'bx_market', '', '_bx_market_page_block_title_featured_entries_view_full', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:4:"full";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 6),
('', 0, 'bx_market', '', '_bx_market_page_block_title_updated_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"browse_updated";s:6:"params";a:1:{s:9:"unit_view";s:8:"extended";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 7),
('', 0, 'bx_market', '', '_bx_market_page_block_title_updated_entries_view_full', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_market";s:6:"method";s:14:"browse_updated";s:6:"params";a:1:{i:0;s:4:"full";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 8),
('', 0, 'bx_market', '_bx_market_page_block_title_sys_recent_entries_view_showcase', '_bx_market_page_block_title_recent_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_market\";s:6:\"method\";s:13:\"browse_public\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 9),
('', 0, 'bx_market', '_bx_market_page_block_title_sys_popular_entries_view_showcase', '_bx_market_page_block_title_popular_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_market\";s:6:\"method\";s:14:\"browse_popular\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 10),
('', 0, 'bx_market', '_bx_market_page_block_title_sys_featured_entries_view_showcase', '_bx_market_page_block_title_featured_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_market\";s:6:\"method\";s:15:\"browse_featured\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"showcase\";s:13:\"empty_message\";b:0;s:13:\"ajax_paginate\";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 11);


-- MENU: add to site menu
SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_market', 'products-home', '_bx_market_menu_item_title_system_entries_home', '_bx_market_menu_item_title_entries_home', 'page.php?i=products-home', '', '', 'shopping-cart', 'bx_market_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu
SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_market', 'products-home', '_bx_market_menu_item_title_system_entries_home', '_bx_market_menu_item_title_entries_home', 'page.php?i=products-home', '', '', 'shopping-cart', 'bx_market_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: add to "add content" menu
SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_market', 'create-product', '_bx_market_menu_item_title_system_create_entry', '_bx_market_menu_item_title_create_entry', 'page.php?i=create-product', '', '', 'shopping-cart', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);


-- MENU: actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_view', '_bx_market_menu_title_view_entry', 'bx_market_view', 'bx_market', 9, 0, 1, 'BxMarketMenuView', 'modules/boonex/market/classes/BxMarketMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_view', 'bx_market', '_bx_market_menu_set_title_view_entry', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('bx_market_view', 'bx_market', 'download', '_bx_market_menu_item_title_system_download', '_bx_market_menu_item_title_download', 'page.php?i=download-product&id={content_id}', '', '', 'download', '', 0, 2147483647, 1, 0, 10),
('bx_market_view', 'bx_market', 'add-to-cart', '_bx_market_menu_item_title_system_add_to_cart', '{add_to_cart_title}', 'javascript:void(0);', 'javascript:{add_to_cart_onclick}', '', 'cart-plus', '', 0, 2147483647, 1, 0, 20),
('bx_market_view', 'bx_market', 'subscribe', '_bx_market_menu_item_title_system_subscribe', '{subscribe_title}', 'javascript:void(0);', 'javascript:{subscribe_onclick}', '', 'credit-card', '', 0, 2147483647, 1, 0, 30),
('bx_market_view', 'bx_market', 'unhide-product', '_bx_market_menu_item_title_system_unhide_entry', '_bx_market_menu_item_title_unhide_entry', 'javascript:void(0);', 'javascript:{js_object}.perform(this, ''unhide-product'', {content_id});', '', 'play-circle', '', 0, 2147483647, 1, 0, 40),
('bx_market_view', 'bx_market', 'approve', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 0, 2147483647, 1, 0, 50),
('bx_market_view', 'bx_market', 'product-more', '_bx_market_menu_item_title_system_product_more', '_bx_market_menu_item_title_product_more', 'javascript:void(0)', 'bx_menu_popup(''bx_market_view_more'', this, {}, {id:{content_id}});', '', 'cog', 'bx_market_view_more', 1, 2147483647, 1, 0, 9999);

-- MENU: actions more menu for view entry
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_view_more', '_bx_market_menu_title_view_entry_more', 'bx_market_view_more', 'bx_market', 6, 0, 1, 'BxMarketMenuView', 'modules/boonex/market/classes/BxMarketMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_view_more', 'bx_market', '_bx_market_menu_set_title_view_entry_more', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_market_view_more', 'bx_market', 'hide-product', '_bx_market_menu_item_title_system_hide_entry', '_bx_market_menu_item_title_hide_entry', 'javascript:void(0);', 'javascript:{js_object}.perform(this, ''hide-product'', {content_id});', '', 'stop-circle', '', 2147483647, 1, 0, 10),
('bx_market_view_more', 'bx_market', 'edit-product', '_bx_market_menu_item_title_system_edit_entry', '_bx_market_menu_item_title_edit_entry', 'page.php?i=edit-product&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 1, 0, 20),
('bx_market_view_more', 'bx_market', 'delete-product', '_bx_market_menu_item_title_system_delete_entry', '_bx_market_menu_item_title_delete_entry', 'page.php?i=delete-product&id={content_id}', '', '', 'remove', '', 2147483647, 1, 0, 30);

-- MENU: all actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_view_actions', '_sys_menu_title_view_actions', 'bx_market_view_actions', 'bx_market', 15, 0, 1, 'BxMarketMenuViewActions', 'modules/boonex/market/classes/BxMarketMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_view_actions', 'bx_market', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_market_view_actions', 'bx_market', 'download', '_bx_market_menu_item_title_system_download', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_market_view_actions', 'bx_market', 'add-to-cart', '_bx_market_menu_item_title_system_add_to_cart', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_market_view_actions', 'bx_market', 'subscribe', '_bx_market_menu_item_title_system_subscribe', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_market_view_actions', 'bx_market', 'unhide-product', '_bx_market_menu_item_title_system_unhide_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_market_view_actions', 'bx_market', 'hide-product', '_bx_market_menu_item_title_system_hide_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 50),
('bx_market_view_actions', 'bx_market', 'edit-product', '_bx_market_menu_item_title_system_edit_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 60),
('bx_market_view_actions', 'bx_market', 'delete-product', '_bx_market_menu_item_title_system_delete_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 70),
('bx_market_view_actions', 'bx_market', 'approve', '_sys_menu_item_title_system_va_approve', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 80),
('bx_market_view_actions', 'bx_market', 'set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_market'', content_id: {content_id}});', '', 'check-circle', '', '', 0, 2147483647, 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 90),
('bx_market_view_actions', 'bx_market', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_market_view_actions', 'bx_market', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_market_view_actions', 'bx_market', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 220),
('bx_market_view_actions', 'bx_market', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 225),
('bx_market_view_actions', 'bx_market', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 230),
('bx_market_view_actions', 'bx_market', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 240),
('bx_market_view_actions', 'bx_market', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 250),
('bx_market_view_actions', 'bx_market', 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 260),
('bx_market_view_actions', 'bx_market', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_market_view_actions', 'bx_market', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', '', 0, 2147483647, '', 1, 0, 280),
('bx_market_view_actions', 'bx_market', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_market&content_id={content_id}', '', '', 'history', '', '', 0, 192, '', 1, 0, 290),
('bx_market_view_actions', 'bx_market', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_market_view_actions', 'bx_market', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);

-- MENU: actions menu for my entries
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_my', '_bx_market_menu_title_entries_my', 'bx_market_my', 'bx_market', 9, 0, 1, 'BxMarketMenu', 'modules/boonex/market/classes/BxMarketMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_my', 'bx_market', '_bx_market_menu_set_title_entries_my', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_market_my', 'bx_market', 'create-product', '_bx_market_menu_item_title_system_create_entry', '_bx_market_menu_item_title_create_entry', 'page.php?i=create-product', '', '', 'plus', '', 2147483647, 1, 0, 0);

-- MENU: actions menu for snippet
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_snippet', '_bx_market_menu_title_snippet', 'bx_market_snippet', 'bx_market', 17, 0, 1, 'BxMarketMenuSnippetActions', 'modules/boonex/market/classes/BxMarketMenuSnippetActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_snippet', 'bx_market', '_bx_market_menu_set_title_snippet', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_market_snippet', 'bx_market', 'snippet-more', '_bx_market_menu_item_title_system_snippet_more', '_bx_market_menu_item_title_snippet_more', 'javascript:void(0)', 'bx_menu_popup(''bx_market_snippet_more'', this, {''id'':''bx_market_snippet_{content_id}''}, {id:{content_id}});', '', 'ellipsis-v', '', 'bx_market_snippet_more', 1, 2147483647, 1, 0, 0, 1);

-- MENU: actions more menu for snippet actions menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_market_snippet_more', '_bx_market_menu_title_snippet_more', 'bx_market_snippet_more', 'bx_market', 4, 0, 1, 'BxMarketMenuView', 'modules/boonex/market/classes/BxMarketMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
('bx_market_snippet_more', 'bx_market', '_bx_market_menu_set_title_snippet_more', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('bx_market_snippet_more', 'bx_market', 'download', '_bx_market_menu_item_title_system_download', '_bx_market_menu_item_title_download', 'page.php?i=download-product&id={content_id}', '', '', 'download', '', 0, 2147483647, 1, 0, 10),
('bx_market_snippet_more', 'bx_market', 'add-to-cart', '_bx_market_menu_item_title_system_add_to_cart', '{add_to_cart_title}', 'javascript:void(0);', 'javascript:{add_to_cart_onclick}', '', 'cart-plus', '', 0, 2147483647, 1, 0, 20),
('bx_market_snippet_more', 'bx_market', 'subscribe', '_bx_market_menu_item_title_system_subscribe', '{subscribe_title}', 'javascript:void(0);', 'javascript:{subscribe_onclick}', '', 'credit-card', '', 0, 2147483647, 1, 0, 30);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_market_snippet_meta', 'bx_market', 15, 0, 1, 'BxMarketMenuSnippetMeta', 'modules/boonex/market/classes/BxMarketMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_snippet_meta', 'bx_market', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_market_snippet_meta', 'bx_market', 'author', '_sys_menu_item_title_system_sm_author', '_sys_menu_item_title_sm_author', '', '', '', '', '', 2147483647, 1, 0, 1, 1),
('bx_market_snippet_meta', 'bx_market', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, 0, 0, 1, 2),
('bx_market_snippet_meta', 'bx_market', 'category', '_sys_menu_item_title_system_sm_category', '_sys_menu_item_title_sm_category', '', '', '', '', '', 2147483647, 0, 0, 1, 3),
('bx_market_snippet_meta', 'bx_market', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, 0, 0, 1, 4),
('bx_market_snippet_meta', 'bx_market', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, 0, 0, 1, 5),
('bx_market_snippet_meta', 'bx_market', 'votes', '_sys_menu_item_title_system_sm_votes', '_sys_menu_item_title_sm_votes', '', '', '', '', '', 2147483647, 0, 0, 1, 6),
('bx_market_snippet_meta', 'bx_market', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, 0, 0, 1, 7);

-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_submenu', '_bx_market_menu_title_submenu', 'bx_market_submenu', 'bx_market', 18, 0, 1, 'BxMarketMenuSubmenu', 'modules/boonex/market/classes/BxMarketMenuSubmenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_submenu', 'bx_market', '_bx_market_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_market_submenu', 'bx_market', 'products-home', '_bx_market_menu_item_title_system_entries_public', '_bx_market_menu_item_title_entries_public', 'page.php?i=products-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_market_submenu', 'bx_market', 'products-latest', '_bx_market_menu_item_title_system_entries_latest', '_bx_market_menu_item_title_entries_latest', 'page.php?i=products-latest', '', '', '', '', 2147483647, 1, 1, 2),
('bx_market_submenu', 'bx_market', 'products-featured', '_bx_market_menu_item_title_system_entries_featured', '_bx_market_menu_item_title_entries_featured', 'page.php?i=products-featured', '', '', '', '', 2147483647, 1, 1, 3),
('bx_market_submenu', 'bx_market', 'products-popular', '_bx_market_menu_item_title_system_entries_popular', '_bx_market_menu_item_title_entries_popular', 'page.php?i=products-popular', '', '', '', '', 2147483647, 1, 1, 4),
('bx_market_submenu', 'bx_market', 'products-top', '_bx_market_menu_item_title_system_entries_top', '_bx_market_menu_item_title_entries_top', 'page.php?i=products-top', '', '', '', '', 2147483647, 1, 1, 5),
('bx_market_submenu', 'bx_market', 'products-updated', '_bx_market_menu_item_title_system_entries_updated', '_bx_market_menu_item_title_entries_updated', 'page.php?i=products-updated', '', '', '', '', 2147483647, 1, 1, 6),
('bx_market_submenu', 'bx_market', 'products-categories', '_bx_market_menu_item_title_system_entries_categories', '_bx_market_menu_item_title_entries_categories', 'page.php?i=products-categories', '', '', '', '', 2147483647, 1, 1, 7),
('bx_market_submenu', 'bx_market', 'products-search', '_bx_market_menu_item_title_system_entries_search', '_bx_market_menu_item_title_entries_search', 'page.php?i=products-search', '', '', '', '', 2147483647, 1, 1, 8),
('bx_market_submenu', 'bx_market', 'products-manage', '_bx_market_menu_item_title_system_entries_manage', '_bx_market_menu_item_title_entries_manage', 'page.php?i=products-manage', '', '', '', '', 2147483646, 1, 1, 9),
('bx_market_submenu', 'bx_market', 'more-auto', '_bx_market_menu_item_title_system_more_auto', '_bx_market_menu_item_title_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', 2147483647, 1, 0, 9999);

-- MENU: sub-menu for view entry
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_view_submenu', '_bx_market_menu_title_view_entry_submenu', 'bx_market_view_submenu', 'bx_market', 8, 0, 1, 'BxMarketMenuView', 'modules/boonex/market/classes/BxMarketMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_view_submenu', 'bx_market', '_bx_market_menu_set_title_view_entry_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_market_view_submenu', 'bx_market', 'view-product', '_bx_market_menu_item_title_system_view_entry_submenu_entry', '_bx_market_menu_item_title_view_entry_submenu_entry', 'page.php?i=view-product&id={content_id}', '', '', '', '', 2147483647, 1, 0, 1),
('bx_market_view_submenu', 'bx_market', 'view-product-info', '_bx_market_menu_item_title_system_view_entry_submenu_info', '_bx_market_menu_item_title_view_entry_submenu_info', 'page.php?i=view-product-info&id={content_id}', '', '', '', '', 2147483647, 1, 0, 2),
('bx_market_view_submenu', 'bx_market', 'view-product-comments', '_bx_market_menu_item_title_system_view_entry_submenu_comments', '_bx_market_menu_item_title_view_entry_submenu_comments', 'page.php?i=view-product-comments&id={content_id}', '', '', '', '', 2147483647, 1, 0, 3);

-- MENU: licenses submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_licenses_submenu', '_bx_market_menu_title_licenses_submenu', 'bx_market_licenses_submenu', 'bx_market', 6, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_licenses_submenu', 'bx_market', '_bx_market_menu_set_title_licenses_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_market_licenses_submenu', 'bx_market', 'products-licenses-administration', '_bx_market_menu_item_title_system_products_licenses_administration', '_bx_market_menu_item_title_products_licenses_administration', 'page.php?i=products-licenses-administration', '', '_self', '', '', '', 192, 1, 0, 1, 1),
('bx_market_licenses_submenu', 'bx_market', 'products-licenses', '_bx_market_menu_item_title_system_products_licenses', '_bx_market_menu_item_title_products_licenses', 'page.php?i=products-licenses', '', '_self', '', '', '', 2147483646, 1, 0, 1, 2);

-- MENU: categories
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_categories', '_bx_market_menu_title_categories', '', 'bx_market', 21, 0, 1, 'BxMarketMenuCategories', 'modules/boonex/market/classes/BxMarketMenuCategories.php');

-- MENU: profile stats
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_market', 'profile-stats-my-market', '_bx_market_menu_item_title_system_manage_my_products', '_bx_market_menu_item_title_manage_my_products', 'page.php?i=products-author&profile_id={member_id}', '', '_self', 'shopping-cart', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:41:"get_menu_addon_manage_tools_profile_stats";}', '', 2147483646, 1, 0, @iNotifMenuOrder + 1);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_menu_manage_tools', '_bx_market_menu_title_manage_tools', 'bx_market_menu_manage_tools', 'bx_market', 6, 0, 1, 'BxMarketMenuManageTools', 'modules/boonex/market/classes/BxMarketMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_market_menu_manage_tools', 'bx_market', '_bx_market_menu_set_title_manage_tools', 0);

--INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
--('bx_market_menu_manage_tools', 'bx_market', 'delete-with-content', '_bx_market_menu_item_title_system_delete_with_content', '_bx_market_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 128, 1, 0, 0);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_market', 'products-administration', '_bx_market_menu_item_title_system_admt_products', '_bx_market_menu_item_title_admt_products', 'page.php?i=products-administration', '', '_self', 'shopping-cart', 'a:2:{s:6:"module";s:9:"bx_market";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_market', 'products-author', '_bx_market_menu_item_title_system_view_entries_author', '_bx_market_menu_item_title_view_entries_author', 'page.php?i=products-author&profile_id={profile_id}', '', '', 'shopping-cart', '', 2147483647, 1, 0, 0),
('trigger_group_view_submenu', 'bx_market', 'products-context', '_bx_market_menu_item_title_system_view_entries_in_context', '_bx_market_menu_item_title_view_entries_in_context', 'page.php?i=products-context&profile_id={profile_id}', '', '', 'shopping-cart', '', 2147483647, 1, 0, 0);

-- MENU: account dashboard
SET @iMoAccountDashboard = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard' LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('sys_account_dashboard', 'bx_market', 'dashboard-licenses', '_bx_market_menu_item_title_system_licenses', '_bx_market_menu_item_title_licenses', 'page.php?i=products-licenses', '', '', 'certificate col-green2', '', '', 2147483646, 1, 0, 1, @iMoAccountDashboard + 1);


-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `spaces`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_market_allow_view_to', 'bx_market', 'view', '_bx_market_form_entry_input_allow_view_to', '3', 'all', 'bx_market_products', 'id', 'author', '', ''),
('bx_market_allow_purchase_to', 'bx_market', 'purchase', '_bx_market_form_entry_input_allow_purchase_to', '3', '', 'bx_market_products', 'id', 'author', '', ''),
('bx_market_allow_comment_to', 'bx_market', 'comment', '_bx_market_form_entry_input_allow_comment_to', 'c', '', 'bx_market_products', 'id', 'author', 'BxMarketPrivacy', 'modules/boonex/market/classes/BxMarketPrivacy.php'),
('bx_market_allow_vote_to', 'bx_market', 'vote', '_bx_market_form_entry_input_allow_vote_to', 'c', '', 'bx_market_products', 'id', 'author', 'BxMarketPrivacy', 'modules/boonex/market/classes/BxMarketPrivacy.php'),
('bx_market_allow_view_favorite_list', 'bx_market', 'view_favorite_list', '_bx_market_form_entry_input_allow_view_favorite_list', '3', 'all', 'bx_market_favorites_lists', 'id', 'author_id', '', '');


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_market', 'create entry', NULL, '_bx_market_acl_action_create_entry', '', 1, 3);
SET @iIdActionEntryCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_market', 'delete entry', NULL, '_bx_market_acl_action_delete_entry', '', 1, 3);
SET @iIdActionEntryDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_market', 'download entry', NULL, '_bx_market_acl_action_download_entry', '', 1, 0);
SET @iIdActionEntryDownload = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_market', 'view entry', NULL, '_bx_market_acl_action_view_entry', '', 1, 0);
SET @iIdActionEntryView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_market', 'set thumb', NULL, '_bx_market_acl_action_set_thumb', '', 1, 3);
SET @iIdActionSetThumb = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_market', 'set cover', NULL, '_bx_market_acl_action_set_cover', '', 1, 3);
SET @iIdActionSetCover = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_market', 'set subentries', NULL, '_bx_market_acl_action_set_subentries', '', 1, 3);
SET @iIdActionSetSubentries = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_market', 'edit any entry', NULL, '_bx_market_acl_action_edit_any_entry', '', 1, 3);
SET @iIdActionEntryEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_market', 'delete any entry', NULL, '_bx_market_acl_action_delete_any_entry', '', 1, 3);
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

-- entry download
(@iUnauthenticated, @iIdActionEntryDownload),
(@iAccount, @iIdActionEntryDownload),
(@iStandard, @iIdActionEntryDownload),
(@iUnconfirmed, @iIdActionEntryDownload),
(@iPending, @iIdActionEntryDownload),
(@iModerator, @iIdActionEntryDownload),
(@iAdministrator, @iIdActionEntryDownload),
(@iPremium, @iIdActionEntryDownload),

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

-- set entry cover
(@iStandard, @iIdActionSetCover),
(@iModerator, @iIdActionSetCover),
(@iAdministrator, @iIdActionSetCover),
(@iPremium, @iIdActionSetCover),

-- set entry subentries
(@iStandard, @iIdActionSetSubentries),
(@iModerator, @iIdActionSetSubentries),
(@iAdministrator, @iIdActionSetSubentries),
(@iPremium, @iIdActionSetSubentries),

-- edit any entry
(@iModerator, @iIdActionEntryEditAny),
(@iAdministrator, @iIdActionEntryEditAny),

-- delete any entry
(@iAdministrator, @iIdActionEntryDeleteAny);

-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_market', '_bx_market', @iSearchOrder + 1, 'BxMarketSearchResult', 'modules/boonex/market/classes/BxMarketSearchResult.php'),
('bx_market_cmts', '_bx_market_cmts', @iSearchOrder + 2, 'BxMarketCmtsSearchResult', 'modules/boonex/market/classes/BxMarketCmtsSearchResult.php');

-- CONNECTIONS
INSERT INTO `sys_objects_connection` (`object`, `table`, `profile_initiator`, `profile_content`, `type`, `override_class_name`, `override_class_file`) VALUES
('bx_market_subentries', 'bx_market_subproducts', 0, 0, 'one-way', '', '');


-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('bx_market', 'bx_market', 'bx_market_meta_keywords', 'bx_market_meta_locations', 'bx_market_meta_mentions', '', '');

-- CATEGORY
INSERT INTO `sys_objects_category` (`object`, `module`, `search_object`, `form_object`, `list_name`, `table`, `field`, `join`, `where`, `override_class_name`, `override_class_file`) VALUES
('bx_market_cats', 'bx_market', 'bx_market', 'bx_market', 'bx_market_cats', 'bx_market_products', 'cat', 'INNER JOIN `sys_profiles` ON (`sys_profiles`.`id` = `bx_market_products`.`author`)', 'AND `sys_profiles`.`status` = ''active''', '', '');

-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_market', 'bx_market', '_bx_market', 'page.php?i=products-home', 'shopping-cart', 'SELECT COUNT(*) FROM `bx_market_products` WHERE 1 AND `status` = ''active'' AND `status_admin` = ''active''', @iMaxOrderStats + 1);

-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_market_growth', '_bx_market_chart_growth', 'bx_market_products', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_market_growth_speed', '_bx_market_chart_growth_speed', 'bx_market_products', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_market_administration', 'Sql', 'SELECT * FROM `bx_market_products` WHERE 1 ', 'bx_market_products', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'title,text', '', 'like', 'reports', '', 192, 'BxMarketGridAdministration', 'modules/boonex/market/classes/BxMarketGridAdministration.php'),
('bx_market_common', 'Sql', 'SELECT * FROM `bx_market_products` WHERE 1 ', 'bx_market_products', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'title,text', '', 'like', '', '', 2147483647, 'BxMarketGridCommon', 'modules/boonex/market/classes/BxMarketGridCommon.php'),

-- GRIDS: Licenses
('bx_market_licenses_administration', 'Sql', 'SELECT `tl`.`id` AS `id`, `tl`.`profile_id` AS `profile_id`, `tl`.`product_id` AS `product_id`, `tp`.`title` AS `product`, `tl`.`order` AS `transaction`, `tl`.`license` AS `license`, `tl`.`type` AS `type`, `tl`.`domain` AS `domain`, `tl`.`added` AS `added`, `tl`.`expired` AS `expired` FROM `bx_market_licenses` AS `tl` LEFT JOIN `bx_market_products` AS `tp` ON `tl`.`product_id`=`tp`.`id` LEFT JOIN `sys_profiles` AS `tup` ON `tl`.`profile_id`=`tup`.`id` LEFT JOIN `sys_accounts` AS `tua` ON `tup`.`account_id`=`tua`.`id` WHERE 1 ', 'bx_market_licenses', 'id', 'added', '', '', 20, NULL, 'start', '', 'tp`.`title,tl`.`order,tl`.`license,tl`.`type,tl`.`domain,tua`.`name,tua`.`email', '', 'like', '', '', 192, 'BxMarketGridLicensesAdministration', 'modules/boonex/market/classes/BxMarketGridLicensesAdministration.php'),
('bx_market_licenses', 'Sql', 'SELECT `tl`.`id` AS `id`, `tl`.`profile_id` AS `profile_id`, `tl`.`product_id` AS `product_id`, `tp`.`title` AS `product`, `tl`.`order` AS `transaction`, `tl`.`license` AS `license`, `tl`.`type` AS `type`, `tl`.`domain` AS `domain`, `tl`.`added` AS `added`, `tl`.`expired` AS `expired` FROM `bx_market_licenses` AS `tl` LEFT JOIN `bx_market_products` AS `tp` ON `tl`.`product_id`=`tp`.`id` WHERE 1 ', 'bx_market_licenses', 'id', 'added', '', '', 20, NULL, 'start', '', 'tp`.`title,tl`.`order,tl`.`license,tl`.`type,tl`.`domain', '', 'like', '', '', 2147483647, 'BxMarketGridLicenses', 'modules/boonex/market/classes/BxMarketGridLicenses.php');


INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_market_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_market_administration', 'switcher', '_bx_market_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_market_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_market_administration', 'title', '_bx_market_grid_column_title_adm_title', '25%', 0, '', '', 4),
('bx_market_administration', 'added', '_bx_market_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_market_administration', 'author', '_bx_market_grid_column_title_adm_author', '20%', 0, '25', '', 6),
('bx_market_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_market_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_market_common', 'switcher', '_bx_market_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_market_common', 'title', '_bx_market_grid_column_title_adm_title', '40%', 0, '', '', 3),
('bx_market_common', 'added', '_bx_market_grid_column_title_adm_added', '15%', 1, '25', '', 4),
('bx_market_common', 'status_admin', '_bx_market_grid_column_title_adm_status_admin', '15%', 0, '16', '', 5),
('bx_market_common', 'actions', '', '20%', 0, '', '', 6),

('bx_market_licenses_administration', 'profile_id', '_bx_market_grid_column_title_lcs_profile_id', '10%', 0, '28', '', 1),
('bx_market_licenses_administration', 'product', '_bx_market_grid_column_title_lcs_product', '15%', 0, '28', '', 2),
('bx_market_licenses_administration', 'transaction', '_bx_market_grid_column_title_lcs_transaction', '10%', 0, '32', '', 3),
('bx_market_licenses_administration', 'license', '_bx_market_grid_column_title_lcs_license', '10%', 0, '8', '', 4),
('bx_market_licenses_administration', 'type', '_bx_market_grid_column_title_lcs_type', '5%', 1, '12', '', 5),
('bx_market_licenses_administration', 'domain', '_bx_market_grid_column_title_lcs_domain', '10%', 0, '18', '', 6),
('bx_market_licenses_administration', 'added', '_bx_market_grid_column_title_lcs_added', '10%', 1, '25', '', 7),
('bx_market_licenses_administration', 'expired', '_bx_market_grid_column_title_lcs_expired', '10%', 1, '25', '', 8),
('bx_market_licenses_administration', 'actions', '', '20%', 0, '', '', 9),

('bx_market_licenses', 'product', '_bx_market_grid_column_title_lcs_product', '20%', 0, '28', '', 1),
('bx_market_licenses', 'transaction', '_bx_market_grid_column_title_lcs_transaction', '10%', 0, '32', '', 2),
('bx_market_licenses', 'license', '_bx_market_grid_column_title_lcs_license', '10%', 0, '8', '', 3),
('bx_market_licenses', 'type', '_bx_market_grid_column_title_lcs_type', '10%', 1, '12', '', 4),
('bx_market_licenses', 'domain', '_bx_market_grid_column_title_lcs_domain', '20%', 0, '18', '', 5),
('bx_market_licenses', 'added', '_bx_market_grid_column_title_lcs_added', '10%', 1, '25', '', 6),
('bx_market_licenses', 'expired', '_bx_market_grid_column_title_lcs_expired', '10%', 1, '25', '', 7),
('bx_market_licenses', 'actions', '', '10%', 0, '', '', 8);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_market_administration', 'bulk', 'delete', '_bx_market_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_market_administration', 'bulk', 'clear_reports', '_bx_market_grid_action_title_adm_clear_reports', '', 0, 1, 2),
('bx_market_administration', 'single', 'edit', '_bx_market_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_market_administration', 'single', 'delete', '_bx_market_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_market_administration', 'single', 'settings', '_bx_market_grid_action_title_adm_more_actions', 'cog', 1, 0, 3),
('bx_market_administration', 'single', 'audit_content', '_bx_market_grid_action_title_adm_audit_content', 'search', 1, 0, 4),
('bx_market_administration', 'single', 'clear_reports', '_bx_market_grid_action_title_adm_clear_reports', 'eraser', 1, 0, 5),

('bx_market_common', 'bulk', 'delete', '_bx_market_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_market_common', 'single', 'edit', '_bx_market_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_market_common', 'single', 'delete', '_bx_market_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_market_common', 'single', 'settings', '_bx_market_grid_action_title_adm_more_actions', 'cog', 1, 0, 3),

('bx_market_licenses_administration', 'single', 'edit', '_bx_market_grid_action_title_lcs_edit', 'pencil-alt', 1, 0, 1),
('bx_market_licenses_administration', 'single', 'reset', '_bx_market_grid_action_title_lcs_reset', 'eraser', 1, 1, 2),
('bx_market_licenses_administration', 'single', 'delete', '_bx_market_grid_action_title_lcs_delete', 'remove', 1, 1, 3),
('bx_market_licenses', 'single', 'reset', '_bx_market_grid_action_title_lcs_reset', 'eraser', 1, 1, 1);


-- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_market_html5', 1, 'BxMarketUploaderHTML5', 'modules/boonex/market/classes/BxMarketUploaderHTML5.php');


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_market', 'BxMarketAlertsResponse', 'modules/boonex/market/classes/BxMarketAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('bx_market_files', 'file_deleted', @iHandler),
('bx_market_files', 'file_downloaded', @iHandler),
('bx_market_photos', 'file_deleted', @iHandler),
('profile', 'delete', @iHandler);


-- CRON
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_market_pruning', '0 0 * * *', 'BxMarketCronPruning', 'modules/boonex/market/classes/BxMarketCronPruning.php', '');


-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES 
('bx_market', '_bx_market_et_txt_name_purchased', 'bx_market_purchased', '_bx_market_et_txt_subject_purchased', '_bx_market_et_txt_body_purchased');

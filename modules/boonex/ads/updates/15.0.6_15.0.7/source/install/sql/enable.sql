
-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_ads', '_bx_ads', 'bx_ads@modules/boonex/ads/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_ads', '_bx_ads', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_ads_enable_auto_approve', 'on', @iCategId, '_bx_ads_option_enable_auto_approve', 'checkbox', '', '', '', 0),
('bx_ads_enable_sources', '', @iCategId, '_bx_ads_option_enable_sources', 'checkbox', '', '', '', 1),
('bx_ads_enable_auction', '', @iCategId, '_bx_ads_option_enable_auction', 'checkbox', '', '', '', 2),
('bx_ads_internal_interested_notification', '', @iCategId, '_bx_ads_option_internal_interested_notification', 'checkbox', '', '', '', 4),

('bx_ads_summary_chars', '700', @iCategId, '_bx_ads_option_summary_chars', 'digit', '', '', '', 10),
('bx_ads_plain_summary_chars', '240', @iCategId, '_bx_ads_option_plain_summary_chars', 'digit', '', '', '', 12),

('bx_ads_per_page_browse', '12', @iCategId, '_bx_ads_option_per_page_browse', 'digit', '', '', '', 20),
('bx_ads_per_page_profile', '6', @iCategId, '_bx_ads_option_per_page_profile', 'digit', '', '', '', 22),
('bx_ads_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', 'digit', '', '', '', 24),
('bx_ads_per_page_for_favorites_lists', '5', @iCategId, '_bx_ads_option_per_page_for_favorites_lists', 'digit', '', '', '', 26),
('bx_ads_rss_num', '10', @iCategId, '_bx_ads_option_rss_num', 'digit', '', '', '', 28),

('bx_ads_searchable_fields', 'title,text', @iCategId, '_bx_ads_option_searchable_fields', 'list', '', '', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:21:"get_searchable_fields";}', 30),

('bx_ads_lifetime', '30', @iCategId, '_bx_ads_option_lifetime', 'digit', '', '', '', 40),
('bx_ads_offer_lifetime', '72', @iCategId, '_bx_ads_option_offer_lifetime', 'digit', '', '', '', 41),

('bx_ads_enable_promotion', '', @iCategId, '_bx_ads_option_enable_promotion', 'checkbox', '', '', '', 50),
('bx_ads_promotion_cpm', '1', @iCategId, '_bx_ads_option_promotion_cpm', 'digit', '', '', '', 51);


-- PAGE: create entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_create_entry', '_bx_ads_page_title_sys_create_entry', '_bx_ads_page_title_create_entry', 'bx_ads', 5, 2147483647, 1, 'create-ad', 'page.php?i=create-ad', '', '', '', 0, 1, 0, 'BxAdsPageBrowse', 'modules/boonex/ads/classes/BxAdsPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_ads_create_entry', 1, 'bx_ads', '_bx_ads_page_block_title_create_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"entity_create";}', 0, 1, 1);

-- PAGE: edit entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_edit_entry', '_bx_ads_page_title_sys_edit_entry', '_bx_ads_page_title_edit_entry', 'bx_ads', 5, 2147483647, 1, 'edit-ad', '', '', '', '', 0, 1, 0, 'BxAdsPageEntry', 'modules/boonex/ads/classes/BxAdsPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_ads_edit_entry', 1, 'bx_ads', '_bx_ads_page_block_title_edit_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);

-- PAGE: edit entry budget
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_edit_entry_budget', '_bx_ads_page_title_sys_edit_entry_budget', '_bx_ads_page_title_edit_entry_budget', 'bx_ads', 5, 2147483647, 1, 'edit-ad-budget', '', '', '', '', 0, 1, 0, 'BxAdsPageEntry', 'modules/boonex/ads/classes/BxAdsPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_ads_edit_entry_budget', 1, 'bx_ads', '_bx_ads_page_block_title_edit_entry_budget', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:18:"entity_edit_budget";}', 0, 0, 0);


-- PAGE: delete entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_delete_entry', '_bx_ads_page_title_sys_delete_entry', '_bx_ads_page_title_delete_entry', 'bx_ads', 5, 2147483647, 1, 'delete-ad', '', '', '', '', 0, 1, 0, 'BxAdsPageEntry', 'modules/boonex/ads/classes/BxAdsPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_ads_delete_entry', 1, 'bx_ads', '_bx_ads_page_block_title_delete_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);

-- PAGE: view entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_view_entry', '_bx_ads_page_title_sys_view_entry', '_bx_ads_page_title_view_entry', 'bx_ads', 12, 2147483647, 1, 'view-ad', '', '', '', '', 0, 1, 0, 'BxAdsPageEntry', 'modules/boonex/ads/classes/BxAdsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_view_entry', 1, 'bx_ads', '', '_bx_ads_page_block_title_entry_breadcrumb', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:17:"entity_breadcrumb";}', 0, 0, 1, 1),
('bx_ads_view_entry', 2, 'bx_ads', '', '_bx_ads_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"entity_comments";}', 0, 0, 0, 0),
('bx_ads_view_entry', 2, 'bx_ads', '', '_bx_ads_page_block_title_entry_author', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"entity_author";}', 0, 0, 1, 1),
('bx_ads_view_entry', 2, 'bx_ads', '', '_bx_ads_page_block_title_entry_text', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:17:"entity_text_block";}', 0, 0, 1, 10),
('bx_ads_view_entry', 2, 'bx_ads', '', '_bx_ads_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:18:"entity_all_actions";}', 0, 0, 1, 20),
('bx_ads_view_entry', 2, 'bx_ads', '', '_bx_ads_page_block_title_entry_attachments', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:18:"entity_attachments";}', 0, 0, 1, 30),
('bx_ads_view_entry', 2, 'bx_ads', '', '_bx_ads_page_block_title_entry_reviews', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"entity_reviews";}', 0, 0, 1, 50),
('bx_ads_view_entry', 3, 'bx_ads', '', '_bx_ads_page_block_title_entry_location', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"entity_location";}', 0, 0, 0, 0),
('bx_ads_view_entry', 3, 'bx_ads', '', '_bx_ads_page_block_title_entry_offer_accepted', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:21:"entity_offer_accepted";s:6:"params";a:1:{i:0;s:4:"{id}";}}', 0, 0, 1, 10),
('bx_ads_view_entry', 3, 'bx_ads', '_bx_ads_page_block_title_sys_entry_context', '_bx_ads_page_block_title_entry_context', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"entity_context";}', 0, 0, 1, 20),
('bx_ads_view_entry', 3, 'bx_ads', '', '_bx_ads_page_block_title_entry_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:11:"entity_info";}', 0, 0, 1, 30),
('bx_ads_view_entry', 3, 'bx_ads', '', '_bx_ads_page_block_title_entry_reviews_rating', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:21:"entity_reviews_rating";}', 0, 0, 1, 40),
('bx_ads_view_entry', 3, 'bx_ads', '', '_bx_ads_page_block_title_entry_location', 3, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"locations_map";s:6:"params";a:2:{i:0;s:6:"bx_ads";i:1;s:4:"{id}";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 0, 1, 50),
('bx_ads_view_entry', 2, 'bx_ads', '', '_bx_ads_page_block_title_entry_polls', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:12:"entity_polls";}', 0, 0, 1, 60),
('bx_ads_view_entry', 3, 'bx_ads', '', '_bx_ads_page_block_title_featured_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 0, 1, 70),
('bx_ads_view_entry', 4, 'bx_ads', '', '_bx_ads_page_block_title_entry_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"entity_actions";}', 0, 0, 0, 0),
('bx_ads_view_entry', 4, 'bx_ads', '', '_bx_ads_page_block_title_entry_social_sharing', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:21:"entity_social_sharing";}', 0, 0, 0, 0),
('bx_ads_view_entry', 2, 'bx_ads', '', '_bx_ads_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:6:\"bx_ads\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);

-- PAGE: view entry comments
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_view_entry_comments', '_bx_ads_page_title_sys_view_entry_comments', '_bx_ads_page_title_view_entry_comments', 'bx_ads', 5, 2147483647, 1, 'view-ad-comments', '', '', '', '', 0, 1, 0, 'BxAdsPageEntry', 'modules/boonex/ads/classes/BxAdsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_ads_view_entry_comments', 1, 'bx_ads', '_bx_ads_page_block_title_entry_comments', '_bx_ads_page_block_title_entry_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"entity_comments";}', 0, 0, 1);

-- PAGE: view entry promotion
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_view_entry_promotion', '_bx_ads_page_title_sys_view_entry_promotion', '_bx_ads_page_title_view_entry_promotion', 'bx_ads', 12, 2147483647, 1, 'view-ad-promotion', '', '', '', '', 0, 1, 0, 'BxAdsPageEntry', 'modules/boonex/ads/classes/BxAdsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_ads_view_entry_promotion', 2, 'bx_ads', '_bx_ads_page_block_title_sys_entry_promotion_growth', '_bx_ads_page_block_title_entry_promotion_growth', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:23:"entity_promotion_growth";}', 0, 0, 1),
('bx_ads_view_entry_promotion', 3, 'bx_ads', '_bx_ads_page_block_title_sys_entry_promotion_summary', '_bx_ads_page_block_title_entry_promotion_summary', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:24:"entity_promotion_summary";}', 0, 0, 1),
('bx_ads_view_entry_promotion', 3, 'bx_ads', '_bx_ads_page_block_title_sys_entry_promotion_roi', '_bx_ads_page_block_title_entry_promotion_roi', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:20:"entity_promotion_roi";}', 0, 0, 2);

-- PAGE: popular entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_popular', '_bx_ads_page_title_sys_entries_popular', '_bx_ads_page_title_entries_popular', 'bx_ads', 5, 2147483647, 1, 'ads-popular', 'page.php?i=ads-popular', '', '', '', 0, 1, 0, 'BxAdsPageBrowse', 'modules/boonex/ads/classes/BxAdsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_ads_popular', 1, 'bx_ads', '_bx_ads_page_block_title_popular_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"browse_popular";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);

-- PAGE: recently updated entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_updated', '_bx_ads_page_title_sys_entries_updated', '_bx_ads_page_title_entries_updated', 'bx_ads', 5, 2147483647, 1, 'ads-updated', 'page.php?i=ads-updated', '', '', '', 0, 1, 0, 'BxAdsPageBrowse', 'modules/boonex/ads/classes/BxAdsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_ads_updated', 1, 'bx_ads', '_bx_ads_page_block_title_updated_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"browse_updated";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);

-- PAGE:  entries' categories 
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_categories', '_bx_ads_page_title_sys_entries_categories', '_bx_ads_page_title_entries_categories', 'bx_ads', 1, 2147483647, 1, 'ads-categories', 'page.php?i=ads-categories', '', '', '', 0, 1, 0, 'BxAdsPageBrowse', 'modules/boonex/ads/classes/BxAdsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_categories', 1, 'bx_ads', '', '_bx_ads_page_block_title_categories', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"categories_list";s:6:"params";a:1:{i:0;a:1:{s:10:"show_empty";b:1;}}}', 0, 0, 1, 1),
('bx_ads_categories', 2, 'bx_ads', '', '_bx_ads_page_block_title_entries_by_category', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"browse_category";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1, 1);

-- PAGE: entries of author
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_author', 'ads-author', '_bx_ads_page_title_sys_entries_of_author', '_bx_ads_page_title_entries_of_author', 'bx_ads', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxAdsPageAuthor', 'modules/boonex/ads/classes/BxAdsPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_author', 1, 'bx_ads', '', '_bx_ads_page_block_title_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:18:"my_entries_actions";}', 0, 0, 1, 1),
('bx_ads_author', 1, 'bx_ads', '_bx_ads_page_block_title_sys_favorites_of_author', '_bx_ads_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:21:"browse_favorite_lists";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1, 2),
('bx_ads_author', 1, 'bx_ads', '_bx_ads_page_block_title_sys_entries_of_author', '_bx_ads_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"browse_author";}', 0, 0, 1, 3),
('bx_ads_author', 1, 'bx_ads', '_bx_ads_page_block_title_sys_entries_in_context', '_bx_ads_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"browse_context";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";i:0;a:1:{s:13:"empty_message";b:0;}}}', 0, 0, 1, 4);


-- PAGE: favorites by list
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_favorites', '_bx_ads_page_title_sys_entries_favorites', '_bx_ads_page_title_entries_favorites', 'bx_ads', 12, 2147483647, 1, 'ads-favorites', 'page.php?i=ads-favorites', '', '', '', 0, 1, 0, 'BxAdsPageListEntry', 'modules/boonex/ads/classes/BxAdsPageListEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_ads_favorites', 2, 'bx_ads', '_bx_ads_page_block_title_favorites_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"browse_favorite";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1),
('bx_ads_favorites', 3, 'bx_ads', '_bx_ads_page_block_title_favorites_entries_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:19:"favorites_list_info";}', 0, 0, 0),
('bx_ads_favorites', 3, 'bx_ads', '_bx_ads_page_block_title_favorites_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:22:"favorites_list_actions";}', 0, 0, 1);


-- PAGE: entries in context
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_context', 'ads-context', '_bx_ads_page_title_sys_entries_in_context', '_bx_ads_page_title_entries_in_context', 'bx_ads', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxAdsPageAuthor', 'modules/boonex/ads/classes/BxAdsPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_context', 1, 'bx_ads', '_bx_ads_page_block_title_sys_entries_in_context', '_bx_ads_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"browse_context";}', 0, 0, 1, 1);

-- PAGE: module home
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_home', 'ads-home', '_bx_ads_page_title_sys_home', '_bx_ads_page_title_home', 'bx_ads', 2, 2147483647, 1, 'page.php?i=ads-home', '', '', '', 0, 1, 0, 'BxAdsPageBrowse', 'modules/boonex/ads/classes/BxAdsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_home', 1, 'bx_ads', '', '_bx_ads_page_block_title_featured_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, 1, 0),
('bx_ads_home', 1, 'bx_ads', '', '_bx_ads_page_block_title_recent_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"browse_public";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, 1, 1),
('bx_ads_home', 2, 'bx_ads', '', '_bx_ads_page_block_title_popular_keywords', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"keywords_cloud";s:6:"params";a:2:{i:0;s:6:"bx_ads";i:1;s:6:"bx_ads";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 1, 1, 0),
('bx_ads_home', 2, 'bx_ads', '', '_bx_ads_page_block_title_categories', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"categories_list";s:6:"params";a:1:{i:0;a:1:{s:10:"show_empty";b:1;}}}', 0, 1, 1, 1);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_search', '_bx_ads_page_title_sys_entries_search', '_bx_ads_page_title_entries_search', 'bx_ads', 5, 2147483647, 1, 'ads-search', 'page.php?i=ads-search', '', '', '', 0, 1, 0, 'BxAdsPageBrowse', 'modules/boonex/ads/classes/BxAdsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_search', 1, 'bx_ads', '_bx_ads_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:6:"bx_ads";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_ads_search', 1, 'bx_ads', '_bx_ads_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:6:"bx_ads";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 2),
('bx_ads_search', 1, 'bx_ads', '_bx_ads_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:11:"bx_ads_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_ads_search', 1, 'bx_ads', '_bx_ads_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:11:"bx_ads_cmts";s:10:"show_empty";b:1;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: module manage own
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_manage', '_bx_ads_page_title_sys_manage', '_bx_ads_page_title_manage', 'bx_ads', 5, 2147483647, 1, 'ads-manage', 'page.php?i=ads-manage', '', '', '', 0, 1, 0, 'BxAdsPageBrowse', 'modules/boonex/ads/classes/BxAdsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_ads_manage', 1, 'bx_ads', '_bx_ads_page_block_title_system_manage', '_bx_ads_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:12:"manage_tools";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_administration', '_bx_ads_page_title_sys_manage_administration', '_bx_ads_page_title_manage', 'bx_ads', 5, 192, 1, 'ads-administration', 'page.php?i=ads-administration', '', '', '', 0, 1, 0, 'BxAdsPageBrowse', 'modules/boonex/ads/classes/BxAdsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_ads_administration', 1, 'bx_ads', '_bx_ads_page_block_title_system_manage_administration', '_bx_ads_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}}', 0, 1, 0);

-- PAGE: module sources
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_sources', '_bx_ads_page_title_sys_sources', '_bx_ads_page_title_sources', 'bx_ads', 5, 2147483646, 1, 'ads-sources', 'page.php?i=ads-sources', '', '', '', 0, 1, 0, 'BxAdsPageBrowse', 'modules/boonex/ads/classes/BxAdsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_ads_sources', 1, 'bx_ads', '_bx_ads_page_block_title_system_sources_details', '_bx_ads_page_block_title_sources_details', 11, 2147483646, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:21:"block_sources_details";}}', 0, 1, 0);

-- PAGE: manage own licenses
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_licenses', '_bx_ads_page_title_sys_licenses', '_bx_ads_page_title_licenses', 'bx_ads', 5, 2147483647, 1, 'ads-licenses', '', '', '', '', 0, 1, 0, 'BxAdsPageLicenses', 'modules/boonex/ads/classes/BxAdsPageLicenses.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_licenses', 1, 'bx_ads', '', '_bx_ads_page_block_title_licenses_note', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:19:"block_licenses_note";}', 0, 0, 1, 0),
('bx_ads_licenses', 1, 'bx_ads', '', '_bx_ads_page_block_title_licenses', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"block_licenses";}', 0, 0, 1, 1);

-- PAGE: manage all licenses
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_licenses_administration', '_bx_ads_page_title_sys_licenses_administration', '_bx_ads_page_title_licenses_administration', 'bx_ads', 5, 192, 1, 'ads-licenses-administration', '', '', '', '', 0, 1, 0, 'BxAdsPageLicenses', 'modules/boonex/ads/classes/BxAdsPageLicenses.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_licenses_administration', 1, 'bx_ads', '', '_bx_ads_page_block_title_licenses_administration', 11, 192, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:29:"block_licenses_administration";}', 0, 0, 1, 0);

-- PAGE: view offers for entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_offers', '_bx_ads_page_title_sys_offers', '_bx_ads_page_title_offers', 'bx_ads', 5, 2147483647, 1, 'view-ad-offers', '', '', '', '', 0, 1, 0, 'BxAdsPageOffers', 'modules/boonex/ads/classes/BxAdsPageOffers.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_offers', 1, 'bx_ads', '', '_bx_ads_page_block_title_entry_breadcrumb', 13, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:17:"entity_breadcrumb";s:6:"params";a:1:{i:0;s:4:"{id}";}}', 0, 0, 1, 1),
('bx_ads_offers', 1, 'bx_ads', '', '_bx_ads_page_block_title_offers', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"entity_offers";s:6:"params";a:1:{i:0;s:4:"{id}";}}', 0, 0, 1, 2);

-- PAGE: view all offers
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_offers_all', '_bx_ads_page_title_sys_offers_all', '_bx_ads_page_title_offers_all', 'bx_ads', 5, 2147483647, 1, 'ads-offers', '', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_ads_offers_all', 1, 'bx_ads', '', '_bx_ads_page_block_title_offers_all', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:6:"offers";}', 0, 0, 1, 1);

-- PAGE: add block to homepage
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', 1, 'bx_ads', '_bx_ads_page_block_title_recent_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"browse_public";s:6:"params";a:2:{i:0;b:0;i:1;b:0;}}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 3;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_ads', '_bx_ads_page_block_title_sys_my_entries', '_bx_ads_page_block_title_my_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"browse_author";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:2:{s:8:"per_page";s:23:"bx_ads_per_page_profile";s:13:"empty_message";b:0;}}}', 0, 0, 0);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system` , `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('', 0, 'bx_ads', '', '_bx_ads_page_block_title_recent_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"browse_public";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 1),

('', 0, 'bx_ads', '', '_bx_ads_page_block_title_recent_entries_view_full', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"browse_public";s:6:"params";a:1:{i:0;s:4:"full";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 2),
('', 0, 'bx_ads', '', '_bx_ads_page_block_title_popular_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"browse_popular";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 3),
('', 0, 'bx_ads', '', '_bx_ads_page_block_title_popular_entries_view_full', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"browse_popular";s:6:"params";a:1:{i:0;s:4:"full";}}', 0, 1, IFNULL(@iBlockOrder, 0) + 4),
('', 0, 'bx_ads', '_bx_ads_page_block_title_sys_recent_entries_view_showcase', '_bx_ads_page_block_title_recent_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:13:"browse_public";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 5),
('', 0, 'bx_ads', '_bx_ads_page_block_title_sys_popular_entries_view_showcase', '_bx_ads_page_block_title_popular_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:14:"browse_popular";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 6),
('', 0, 'bx_ads', '_bx_ads_page_block_title_sys_featured_entries_view_showcase', '_bx_ads_page_block_title_featured_entries_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:15:"browse_featured";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}', 0, 1, IFNULL(@iBlockOrder, 0) + 7);


-- MENU: add to site menu
SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_ads', 'ads-home', '_bx_ads_menu_item_title_system_entries_home', '_bx_ads_menu_item_title_entries_home', 'page.php?i=ads-home', '', '', 'ad', 'bx_ads_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu
SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_ads', 'ads-home', '_bx_ads_menu_item_title_system_entries_home', '_bx_ads_menu_item_title_entries_home', 'page.php?i=ads-home', '', '', 'ad', 'bx_ads_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: add to "add content" menu
SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_ads', 'create-ad', '_bx_ads_menu_item_title_system_create_entry', '_bx_ads_menu_item_title_create_entry', 'page.php?i=create-ad', '', '', 'ad', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: create ad form attachments (link, photo, video, etc)
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_entry_attachments', '_bx_ads_menu_title_entry_attachments', 'bx_ads_entry_attachments', 'bx_ads', 23, 0, 1, 'BxAdsMenuAttachments', 'modules/boonex/ads/classes/BxAdsMenuAttachments.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_ads_entry_attachments', 'bx_ads', '_bx_ads_menu_set_title_entry_attachments', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_ads_entry_attachments', 'bx_ads', 'photo_simple', '_bx_ads_menu_item_title_system_cpa_photo_simple', '_bx_ads_menu_item_title_cpa_photo_simple', 'javascript:void(0)', 'javascript:{js_object_uploader_photos_simple}.showUploaderForm();', '_self', 'camera', '', '', 2147483647, '', 0, 0, 1, 1),
('bx_ads_entry_attachments', 'bx_ads', 'photo_html5', '_bx_ads_menu_item_title_system_cpa_photo_html5', '_bx_ads_menu_item_title_cpa_photo_html5', 'javascript:void(0)', 'javascript:{js_object_uploader_photos_html5}.showUploaderForm();', '_self', 'camera', '', '', 2147483647, '', 1, 0, 1, 2),
('bx_ads_entry_attachments', 'bx_ads', 'video_simple', '_bx_ads_menu_item_title_system_cpa_video_simple', '_bx_ads_menu_item_title_cpa_video_simple', 'javascript:void(0)', 'javascript:{js_object_uploader_videos_simple}.showUploaderForm();', '_self', 'video', '', '', 2147483647, '', 0, 0, 1, 3),
('bx_ads_entry_attachments', 'bx_ads', 'video_html5', '_bx_ads_menu_item_title_system_cpa_video_html5', '_bx_ads_menu_item_title_cpa_video_html5', 'javascript:void(0)', 'javascript:{js_object_uploader_videos_html5}.showUploaderForm();', '_self', 'video', '', '', 2147483647, '', 1, 0, 1, 4),
('bx_ads_entry_attachments', 'bx_ads', 'record_video', '_bx_ads_menu_item_title_system_cpa_video_record', '_bx_ads_menu_item_title_cpa_video_record', 'javascript:void(0)', 'javascript:{js_object_uploader_videos_record_video}.showUploaderForm();', '_self', 'fas circle', '', '', 2147483647, '', 1, 0, 1, 5),
('bx_ads_entry_attachments', 'bx_ads', 'file_simple', '_bx_ads_menu_item_title_system_cpa_file_simple', '_bx_ads_menu_item_title_cpa_file_simple', 'javascript:void(0)', 'javascript:{js_object_uploader_files_simple}.showUploaderForm();', '_self', 'file', '', '', 2147483647, '', 0, 0, 1, 6),
('bx_ads_entry_attachments', 'bx_ads', 'file_html5', '_bx_ads_menu_item_title_system_cpa_file_html5', '_bx_ads_menu_item_title_cpa_file_html5', 'javascript:void(0)', 'javascript:{js_object_uploader_files_html5}.showUploaderForm();', '_self', 'file', '', '', 2147483647, '', 1, 0, 1, 7),
('bx_ads_entry_attachments', 'bx_ads', 'poll', '_bx_ads_menu_item_title_system_cpa_poll', '_bx_ads_menu_item_title_cpa_poll', 'javascript:void(0)', 'javascript:{js_object}.showPollForm(this);', '_self', 'tasks', '', '', 2147483647, '', 1, 0, 1, 7),
('bx_ads_entry_attachments', 'bx_ads', 'link', '_bx_ads_menu_item_title_system_cpa_link', '_bx_ads_menu_item_title_cpa_link', 'javascript:void(0)', 'javascript:{js_object_link}.showAttachLink(this);', '_self', 'link', '', '', 2147483647, '', 1, 0, 1, 8);

-- MENU: actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_view', '_bx_ads_menu_title_view_entry', 'bx_ads_view', 'bx_ads', 9, 0, 1, 'BxAdsMenuView', 'modules/boonex/ads/classes/BxAdsMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_ads_view', 'bx_ads', '_bx_ads_menu_set_title_view_entry', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_ads_view', 'bx_ads', 'interested', '_bx_ads_menu_item_title_system_interested_entry', '_bx_ads_menu_item_title_interested_entry', 'javascript:void(0)', 'javascript:{js_object}.interested(this, {content_id})', '', 'map-marker', '', 2147483646, 1, 0, 10),
('bx_ads_view', 'bx_ads', 'add-to-cart', '_bx_ads_menu_item_title_system_add_to_cart', '{add_to_cart_title}', 'javascript:void(0);', 'javascript:{add_to_cart_onclick}', '', 'cart-plus', '', 2147483647, 1, 0, 15),
('bx_ads_view', 'bx_ads', 'make-offer', '_bx_ads_menu_item_title_system_make_offer', '_bx_ads_menu_item_title_make_offer', 'javascript:void(0);', 'javascript:{js_object}.makeOffer(this, {content_id})', '', 'hand-holding-usd', '', 2147483647, 1, 0, 16),
('bx_ads_view', 'bx_ads', 'view-offers', '_bx_ads_menu_item_title_system_view_offers', '_bx_ads_menu_item_title_view_offers', 'page.php?i=view-ad-offers&id={content_id}', '', '', 'handshake', '', 2147483647, 1, 0, 17),
('bx_ads_view', 'bx_ads', 'edit-ad', '_bx_ads_menu_item_title_system_edit_entry', '_bx_ads_menu_item_title_edit_entry', 'page.php?i=edit-ad&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 1, 0, 20),
('bx_ads_view', 'bx_ads', 'edit-ad-budget', '_bx_ads_menu_item_title_system_edit_entry_budget', '_bx_ads_menu_item_title_edit_entry_budget', 'page.php?i=edit-ad-budget&id={content_id}', '', '', 'pencil-ruler', '', 2147483647, 1, 0, 21),
('bx_ads_view', 'bx_ads', 'view-ad-promotion', '_bx_ads_menu_item_title_system_view_promotion', '_bx_ads_menu_item_title_view_promotion', 'page.php?i=view-ad-promotion&id={content_id}', '', '', 'chart-pie', '', 2147483647, 1, 0, 22),
('bx_ads_view', 'bx_ads', 'delete-ad', '_bx_ads_menu_item_title_system_delete_entry', '_bx_ads_menu_item_title_delete_entry', 'page.php?i=delete-ad&id={content_id}', '', '', 'remove', '', 2147483647, 1, 0, 30),
('bx_ads_view', 'bx_ads', 'approve', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this,  ''{module_uri}'', {content_id});', '', 'check', '', 2147483647, 1, 0, 40),
('bx_ads_view', 'bx_ads', 'shipped', '_bx_ads_menu_item_title_system_mark_shipped', '_bx_ads_menu_item_title_mark_shipped', 'javascript:void(0)', 'javascript:{js_object}.shipped(this, {content_id})', '', 'truck', '', 2147483647, 1, 0, 50),
('bx_ads_view', 'bx_ads', 'received', '_bx_ads_menu_item_title_system_mark_received', '_bx_ads_menu_item_title_mark_received', 'javascript:void(0)', 'javascript:{js_object}.received(this, {content_id})', '', 'clipboard-check', '', 2147483647, 1, 0, 55);

-- MENU: all actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_view_actions', '_sys_menu_title_view_actions', 'bx_ads_view_actions', 'bx_ads', 15, 0, 1, 'BxAdsMenuViewActions', 'modules/boonex/ads/classes/BxAdsMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_ads_view_actions', 'bx_ads', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_ads_view_actions', 'bx_ads', 'interested', '_bx_ads_menu_item_title_system_interested_entry', '', '', '', '', '', '', '', 0, 2147483646, '', 1, 0, 10),
('bx_ads_view_actions', 'bx_ads', 'add-to-cart', '_bx_ads_menu_item_title_system_add_to_cart', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 15),
('bx_ads_view_actions', 'bx_ads', 'make-offer', '_bx_ads_menu_item_title_system_make_offer', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 16),
('bx_ads_view_actions', 'bx_ads', 'view-offers', '_bx_ads_menu_item_title_system_view_offers', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 17),
('bx_ads_view_actions', 'bx_ads', 'edit-ad', '_bx_ads_menu_item_title_system_edit_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_ads_view_actions', 'bx_ads', 'edit-ad-budget', '_bx_ads_menu_item_title_system_edit_entry_budget', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 21),
('bx_ads_view_actions', 'bx_ads', 'view-ad-promotion', '_bx_ads_menu_item_title_system_view_promotion', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 22),
('bx_ads_view_actions', 'bx_ads', 'delete-ad', '_bx_ads_menu_item_title_system_delete_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_ads_view_actions', 'bx_ads', 'approve', '_sys_menu_item_title_system_va_approve', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_ads_view_actions', 'bx_ads', 'set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_ads'', content_id: {content_id}});', '', 'check-circle', '', '', 0, 2147483647, 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 45),
('bx_ads_view_actions', 'bx_ads', 'shipped', '_bx_ads_menu_item_title_system_mark_shipped', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 50),
('bx_ads_view_actions', 'bx_ads', 'received', '_bx_ads_menu_item_title_system_mark_received', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 55),
('bx_ads_view_actions', 'bx_ads', 'review', '_bx_ads_menu_item_title_system_review_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 190),
('bx_ads_view_actions', 'bx_ads', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_ads_view_actions', 'bx_ads', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_ads_view_actions', 'bx_ads', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 220),
('bx_ads_view_actions', 'bx_ads', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 225),
('bx_ads_view_actions', 'bx_ads', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 230),
('bx_ads_view_actions', 'bx_ads', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 240),
('bx_ads_view_actions', 'bx_ads', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 250),
('bx_ads_view_actions', 'bx_ads', 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 260),
('bx_ads_view_actions', 'bx_ads', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_ads_view_actions', 'bx_ads', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', '', 0, 2147483647, '', 1, 0, 280),
('bx_ads_view_actions', 'bx_ads', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_courses&content_id={content_id}', '', '', 'history', '', '', 0, 192, '', 1, 0, 290),
('bx_ads_view_actions', 'bx_ads', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_ads_view_actions', 'bx_ads', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);

-- MENU: actions menu for my entries
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_my', '_bx_ads_menu_title_entries_my', 'bx_ads_my', 'bx_ads', 9, 0, 1, 'BxAdsMenu', 'modules/boonex/ads/classes/BxAdsMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_ads_my', 'bx_ads', '_bx_ads_menu_set_title_entries_my', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_ads_my', 'bx_ads', 'create-ad', '_bx_ads_menu_item_title_system_create_entry', '_bx_ads_menu_item_title_create_entry', 'page.php?i=create-ad', '', '', 'plus', '', 2147483647, 1, 0, 0);


-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_submenu', '_bx_ads_menu_title_submenu', 'bx_ads_submenu', 'bx_ads', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_ads_submenu', 'bx_ads', '_bx_ads_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_ads_submenu', 'bx_ads', 'ads-home', '_bx_ads_menu_item_title_system_entries_public', '_bx_ads_menu_item_title_entries_public', 'page.php?i=ads-home', '', '', '', '', 2147483647, '', 1, 1, 1),
('bx_ads_submenu', 'bx_ads', 'ads-popular', '_bx_ads_menu_item_title_system_entries_popular', '_bx_ads_menu_item_title_entries_popular', 'page.php?i=ads-popular', '', '', '', '', 2147483647, '', 1, 1, 2),
('bx_ads_submenu', 'bx_ads', 'ads-categories', '_bx_ads_menu_item_title_system_entries_categories', '_bx_ads_menu_item_title_entries_categories', 'page.php?i=ads-categories', '', '', '', '', 2147483647, '', 1, 1, 3),
('bx_ads_submenu', 'bx_ads', 'ads-search', '_bx_ads_menu_item_title_system_entries_search', '_bx_ads_menu_item_title_entries_search', 'page.php?i=ads-search', '', '', '', '', 2147483647, '', 1, 1, 4),
('bx_ads_submenu', 'bx_ads', 'ads-manage', '_bx_ads_menu_item_title_system_entries_manage', '_bx_ads_menu_item_title_entries_manage', 'page.php?i=ads-manage', '', '', '', '', 2147483646, '', 1, 1, 5),
('bx_ads_submenu', 'bx_ads', 'ads-sources', '_bx_ads_menu_item_title_system_sources', '_bx_ads_menu_item_title_sources', 'page.php?i=ads-sources', '', '', '', '', 2147483646, 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:20:"is_sources_avaliable";}', 1, 1, 6);

-- MENU: sub-menu for view entry
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_view_submenu', '_bx_ads_menu_title_view_entry_submenu', 'bx_ads_view_submenu', 'bx_ads', 8, 0, 1, 'BxAdsMenuView', 'modules/boonex/ads/classes/BxAdsMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_ads_view_submenu', 'bx_ads', '_bx_ads_menu_set_title_view_entry_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_ads_view_submenu', 'bx_ads', 'view-ad', '_bx_ads_menu_item_title_system_view_entry', '_bx_ads_menu_item_title_view_entry_submenu_entry', 'page.php?i=view-ad&id={content_id}', '', '', '', '', 2147483647, 0, 0, 1),
('bx_ads_view_submenu', 'bx_ads', 'view-ad-comments', '_bx_ads_menu_item_title_system_view_entry_comments', '_bx_ads_menu_item_title_view_entry_submenu_comments', 'page.php?i=view-ad-comments&id={content_id}', '', '', '', '', 2147483647, 0, 0, 2),
('bx_ads_view_submenu', 'bx_ads', 'view-ad-promotion', '_bx_ads_menu_item_title_system_view_entry_promotion', '_bx_ads_menu_item_title_view_entry_submenu_promotion', 'page.php?i=view-ad-promotion&id={content_id}', '', '', '', '', 2147483647, 0, 0, 3);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_ads_snippet_meta', 'bx_ads', 15, 0, 1, 'BxAdsMenuSnippetMeta', 'modules/boonex/ads/classes/BxAdsMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_ads_snippet_meta', 'bx_ads', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_ads_snippet_meta', 'bx_ads', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, 1, 0, 1, 1),
('bx_ads_snippet_meta', 'bx_ads', 'author', '_sys_menu_item_title_system_sm_author', '_sys_menu_item_title_sm_author', '', '', '', '', '', 2147483647, 1, 0, 1, 2),
('bx_ads_snippet_meta', 'bx_ads', 'category', '_sys_menu_item_title_system_sm_category', '_sys_menu_item_title_sm_category', '', '', '', '', '', 2147483647, 1, 0, 1, 3),
('bx_ads_snippet_meta', 'bx_ads', 'price', '_bx_ads_menu_item_title_system_sm_price', '_bx_ads_menu_item_title_sm_price', '', '', '', '', '', 2147483647, 1, 0, 1, 4),
('bx_ads_snippet_meta', 'bx_ads', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, 0, 0, 1, 5),
('bx_ads_snippet_meta', 'bx_ads', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, 0, 0, 1, 6),
('bx_ads_snippet_meta', 'bx_ads', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, 0, 0, 1, 7);

-- MENU: licenses submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_licenses_submenu', '_bx_ads_menu_title_licenses_submenu', 'bx_ads_licenses_submenu', 'bx_ads', 6, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_ads_licenses_submenu', 'bx_ads', '_bx_ads_menu_set_title_licenses_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_ads_licenses_submenu', 'bx_ads', 'ads-licenses-administration', '_bx_ads_menu_item_title_system_ads_licenses_administration', '_bx_ads_menu_item_title_ads_licenses_administration', 'page.php?i=ads-licenses-administration', '', '_self', '', '', '', 192, 1, 0, 1, 1),
('bx_ads_licenses_submenu', 'bx_ads', 'ads-licenses', '_bx_ads_menu_item_title_system_ads_licenses', '_bx_ads_menu_item_title_ads_licenses', 'page.php?i=ads-licenses', '', '_self', '', '', '', 2147483646, 1, 0, 1, 2);

-- MENU: notifications menu in account popup
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_account_notifications' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_account_notifications', 'bx_ads', 'notifications-ads-offers', '_bx_ads_menu_item_title_system_offers_all', '_bx_ads_menu_item_title_offers_all', 'page.php?i=ads-offers', '', '', 'ad', 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:16:"get_offers_count";s:6:"params";a:1:{i:0;s:8:"awaiting";}}', '', 2147483646, '', 1, 0, @iNotifMenuOrder + 1);

-- MENU: profile stats
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_ads', 'profile-stats-my-ads', '_bx_ads_menu_item_title_system_manage_my_posts', '_bx_ads_menu_item_title_manage_my_posts', 'page.php?i=ads-author&profile_id={member_id}', '', '_self', 'ad', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:41:"get_menu_addon_manage_tools_profile_stats";}', '', 2147483646, 1, 0, @iNotifMenuOrder + 1);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_ads_menu_manage_tools', '_bx_ads_menu_title_manage_tools', 'bx_ads_menu_manage_tools', 'bx_ads', 6, 0, 1, 'BxAdsMenuManageTools', 'modules/boonex/ads/classes/BxAdsMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_ads_menu_manage_tools', 'bx_ads', '_bx_ads_menu_set_title_manage_tools', 0);

--INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
--('bx_ads_menu_manage_tools', 'bx_ads', 'delete-with-content', '_bx_ads_menu_item_title_system_delete_with_content', '_bx_ads_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 128, 1, 0, 0);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_ads', 'ads-administration', '_bx_ads_menu_item_title_system_admt_ads', '_bx_ads_menu_item_title_admt_ads', 'page.php?i=ads-administration', '', '_self', 'ad', 'a:2:{s:6:"module";s:6:"bx_ads";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- MENU: account dashboard
SET @iDashboardMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard' LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('sys_account_dashboard', 'bx_ads', 'dashboard-ads-licenses', '_bx_ads_menu_item_title_system_licenses', '_bx_ads_menu_item_title_licenses', 'page.php?i=ads-licenses', '', '', 'ad', '', '', 2147483646, 1, 0, 1, @iDashboardMenuOrder + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_ads', 'ads-author', '_bx_ads_menu_item_title_system_view_entries_author', '_bx_ads_menu_item_title_view_entries_author', 'page.php?i=ads-author&profile_id={profile_id}', '', '', 'ad', '', 2147483647, 1, 0, 0),
('trigger_group_view_submenu', 'bx_ads', 'ads-context', '_bx_ads_menu_item_title_system_view_entries_in_context', '_bx_ads_menu_item_title_view_entries_in_context', 'page.php?i=ads-context&profile_id={profile_id}', '', '', 'ad', '', 2147483647, 1, 0, 0);


-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_ads_allow_view_to', 'bx_ads', 'view', '_bx_ads_form_entry_input_allow_view_to', '3', 'bx_ads_entries', 'id', 'author', '', ''),
('bx_ads_allow_view_favorite_list', 'bx_ads', 'view_favorite_list', '_bx_ads_form_entry_input_allow_view_favorite_list', '3', 'bx_ads_favorites_lists', 'id', 'author_id', '', '');


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_ads', 'create entry', NULL, '_bx_ads_acl_action_create_entry', '', 1, 3);
SET @iIdActionEntryCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_ads', 'delete entry', NULL, '_bx_ads_acl_action_delete_entry', '', 1, 3);
SET @iIdActionEntryDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_ads', 'view entry', NULL, '_bx_ads_acl_action_view_entry', '', 1, 0);
SET @iIdActionEntryView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_ads', 'set thumb', NULL, '_bx_ads_acl_action_set_thumb', '', 1, 3);
SET @iIdActionSetThumb = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_ads', 'edit any entry', NULL, '_bx_ads_acl_action_edit_any_entry', '', 1, 3);
SET @iIdActionEntryEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_ads', 'delete any entry', NULL, '_bx_ads_acl_action_delete_any_entry', '', 1, 3);
SET @iIdActionEntryDeleteAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_ads', 'make offer', NULL, '_bx_ads_acl_action_make_offer', '', 1, 3);
SET @iIdActionMakeOffer = LAST_INSERT_ID();

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

-- make offer
(@iStandard, @iIdActionMakeOffer),
(@iModerator, @iIdActionMakeOffer),
(@iAdministrator, @iIdActionMakeOffer),
(@iPremium, @iIdActionMakeOffer);


-- SEARCH
SET @iSearchOrder = (SELECT IFNULL(MAX(`Order`), 0) FROM `sys_objects_search`);
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('bx_ads', '_bx_ads', @iSearchOrder + 1, 'BxAdsSearchResult', 'modules/boonex/ads/classes/BxAdsSearchResult.php'),
('bx_ads_cmts', '_bx_ads_cmts', @iSearchOrder + 2, 'BxAdsCmtsSearchResult', 'modules/boonex/ads/classes/BxAdsCmtsSearchResult.php');


-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('bx_ads', 'bx_ads', 'bx_ads_meta_keywords', 'bx_ads_meta_locations', 'bx_ads_meta_mentions', '', '');


-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_ads', 'bx_ads', '_bx_ads', 'page.php?i=ads-home', 'ad', 'SELECT COUNT(*) FROM `bx_ads_entries` WHERE 1 AND `status` = ''active'' AND `status_admin` = ''active''', @iMaxOrderStats + 1);


-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_ads_growth', '_bx_ads_chart_growth', 'bx_ads_entries', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_ads_growth_speed', '_bx_ads_chart_growth_speed', 'bx_ads_entries', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', '');

INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_ads_promotion_growth', '_bx_ads_chart_promotion_growth', 'bx_ads_promo_tracker', 'date', '', '', 'SELECT {field_date_formatted} AS `period`, SUM(`impressions`) AS {object} FROM {table} WHERE 1 AND `entry_id`=''{content_id}'' {where_inteval} GROUP BY `period` ORDER BY {field_date} ASC', 0, 0, 'BxAdsChartGrowth', 'modules/boonex/ads/classes/BxAdsChartGrowth.php'),
('bx_ads_promotion_growth_speed', '_bx_ads_chart_promotion_growth_speed', 'bx_ads_promo_tracker', 'date', '', '', 'SELECT {field_date_formatted} AS `period`, SUM(`impressions`) AS {object} FROM {table} WHERE 1 AND `entry_id`=''{content_id}'' {where_inteval} GROUP BY `period` ORDER BY {field_date} ASC', 0, 0, 'BxAdsChartGrowthSpeed', 'modules/boonex/ads/classes/BxAdsChartGrowthSpeed.php');


-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_ads_administration', 'Sql', 'SELECT * FROM `bx_ads_entries` WHERE 1 ', 'bx_ads_entries', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'title,text', '', 'like', 'reports', '', 192, 'BxAdsGridAdministration', 'modules/boonex/ads/classes/BxAdsGridAdministration.php'),
('bx_ads_common', 'Sql', 'SELECT * FROM `bx_ads_entries` WHERE 1 ', 'bx_ads_entries', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'title,text', '', 'like', '', '', 2147483647, 'BxAdsGridCommon', 'modules/boonex/ads/classes/BxAdsGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_ads_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_ads_administration', 'switcher', '_bx_ads_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_ads_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_ads_administration', 'title', '_bx_ads_grid_column_title_adm_title', '25%', 0, '25', '', 4),
('bx_ads_administration', 'added', '_bx_ads_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_ads_administration', 'author', '_bx_ads_grid_column_title_adm_author', '20%', 0, '25', '', 6),
('bx_ads_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_ads_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_ads_common', 'switcher', '_bx_ads_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_ads_common', 'title', '_bx_ads_grid_column_title_adm_title', '40%', 0, '35', '', 3),
('bx_ads_common', 'added', '_bx_ads_grid_column_title_adm_added', '10%', 0, '25', '', 4),
('bx_ads_common', 'status_admin', '_bx_ads_grid_column_title_adm_status_admin', '10%', 0, '16', '', 5),
('bx_ads_common', 'actions', '', '30%', 0, '', '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_ads_administration', 'bulk', 'delete', '_bx_ads_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_ads_administration', 'single', 'edit', '_bx_ads_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_ads_administration', 'single', 'delete', '_bx_ads_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_ads_administration', 'single', 'settings', '_bx_ads_grid_action_title_adm_more_actions', 'cog', 1, 0, 3),
('bx_ads_administration', 'single', 'audit_content', '_bx_ads_grid_action_title_adm_audit_content', 'search', 1, 0, 4),

('bx_ads_common', 'bulk', 'delete', '_bx_ads_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_ads_common', 'single', 'promotion', '_bx_ads_grid_action_title_adm_promotion', 'chart-pie', 1, 0, 1),
('bx_ads_common', 'single', 'edit_budget', '_bx_ads_grid_action_title_adm_edit_budget', 'pencil-ruler', 1, 0, 2),
('bx_ads_common', 'single', 'edit', '_bx_ads_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 3),
('bx_ads_common', 'single', 'delete', '_bx_ads_grid_action_title_adm_delete', 'remove', 1, 1, 4),
('bx_ads_common', 'single', 'settings', '_bx_ads_grid_action_title_adm_more_actions', 'cog', 1, 0, 5);

-- GRIDS: licenses
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_ads_licenses_administration', 'Sql', 'SELECT `tl`.`id` AS `id`, `tl`.`profile_id` AS `profile_id`, `tl`.`entry_id` AS `entry_id`, `te`.`title` AS `entry`, `tl`.`count` AS `count`, `tl`.`order` AS `transaction`, `tl`.`license` AS `license`, `tl`.`added` AS `added` FROM `bx_ads_licenses` AS `tl` LEFT JOIN `bx_ads_entries` AS `te` ON `tl`.`entry_id`=`te`.`id` LEFT JOIN `sys_profiles` AS `tup` ON `tl`.`profile_id`=`tup`.`id` LEFT JOIN `sys_accounts` AS `tua` ON `tup`.`account_id`=`tua`.`id` WHERE 1 ', 'bx_ads_licenses', 'id', 'added', '', '', 20, NULL, 'start', '', 'te`.`title,tl`.`order,tl`.`license,tua`.`name,tua`.`email', '', 'like', '', '', 192, 'BxAdsGridLicensesAdministration', 'modules/boonex/ads/classes/BxAdsGridLicensesAdministration.php'),
('bx_ads_licenses', 'Sql', 'SELECT `tl`.`id` AS `id`, `tl`.`profile_id` AS `profile_id`, `tl`.`entry_id` AS `entry_id`, `te`.`title` AS `entry`, `tl`.`count` AS `count`, `tl`.`order` AS `transaction`, `tl`.`license` AS `license`, `tl`.`added` AS `added` FROM `bx_ads_licenses` AS `tl` LEFT JOIN `bx_ads_entries` AS `te` ON `tl`.`entry_id`=`te`.`id` WHERE 1 ', 'bx_ads_licenses', 'id', 'added', '', '', 20, NULL, 'start', '', 'te`.`title,tl`.`order,tl`.`license', '', 'like', '', '', 2147483647, 'BxAdsGridLicenses', 'modules/boonex/ads/classes/BxAdsGridLicenses.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_ads_licenses_administration', 'profile_id', '_bx_ads_grid_column_title_lcs_profile_id', '20%', 0, '0', '', 1),
('bx_ads_licenses_administration', 'entry', '_bx_ads_grid_column_title_lcs_entry', '20%', 0, '0', '', 2),
('bx_ads_licenses_administration', 'count', '_bx_ads_grid_column_title_lcs_count', '5%', 0, '0', '', 3),
('bx_ads_licenses_administration', 'transaction', '_bx_ads_grid_column_title_lcs_transaction', '20%', 0, '32', '', 4),
('bx_ads_licenses_administration', 'license', '_bx_ads_grid_column_title_lcs_license', '15%', 0, '8', '', 5),
('bx_ads_licenses_administration', 'added', '_bx_ads_grid_column_title_lcs_added', '10%', 1, '25', '', 6),
('bx_ads_licenses_administration', 'actions', '', '10%', 0, '0', '', 7),

('bx_ads_licenses', 'entry', '_bx_ads_grid_column_title_lcs_entry', '25%', 0, '0', '', 1),
('bx_ads_licenses', 'count', '_bx_ads_grid_column_title_lcs_count', '5%', 0, '0', '', 2),
('bx_ads_licenses', 'transaction', '_bx_ads_grid_column_title_lcs_transaction', '25%', 0, '32', '', 3),
('bx_ads_licenses', 'license', '_bx_ads_grid_column_title_lcs_license', '15%', 0, '8', '', 4),
('bx_ads_licenses', 'added', '_bx_ads_grid_column_title_lcs_added', '20%', 1, '25', '', 5),
('bx_ads_licenses', 'actions', '', '10%', 0, '0', '', 6);

-- GRIDS: offers
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('bx_ads_offers', 'Sql', 'SELECT * FROM `bx_ads_offers` WHERE 1 ', 'bx_ads_offers', 'id', 'added', '', '', 20, NULL, 'start', '', 'message', '', 'like', '', '', 2147483647, 1, 'BxAdsGridOffers', 'modules/boonex/ads/classes/BxAdsGridOffers.php'),
('bx_ads_offers_all', 'Sql', 'SELECT `to`.*, SUM(IF(`to`.`status`=''awaiting'', 1, 0)) AS `offers_awating`, COUNT(`to`.`id`) AS `offers_total`, `te`.`title` AS `content_title` FROM `bx_ads_offers` AS `to` LEFT JOIN `bx_ads_entries` AS `te` ON `to`.`content_id`=`te`.`id` WHERE 1 ', 'bx_ads_offers', 'id', 'added', '', '', 20, NULL, 'start', '', '', '', 'like', '', '', 2147483647, 0, 'BxAdsGridOffersAll', 'modules/boonex/ads/classes/BxAdsGridOffersAll.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_ads_offers', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('bx_ads_offers', 'author_id', '_bx_ads_grid_column_title_ofr_author_id', '20%', 0, 0, '', 2),
('bx_ads_offers', 'amount', '_bx_ads_grid_column_title_ofr_amount', '14%', 0, 0, '', 3),
('bx_ads_offers', 'quantity', '_bx_ads_grid_column_title_ofr_quantity', '5%', 0, 0, '', 4),
('bx_ads_offers', 'message', '_bx_ads_grid_column_title_ofr_message', '24%', 0, '32', '', 5),
('bx_ads_offers', 'added', '_bx_ads_grid_column_title_ofr_added', '10%', 0, 0, '', 6),
('bx_ads_offers', 'status', '_bx_ads_grid_column_title_ofr_status', '5%', 0, 8, '', 7),
('bx_ads_offers', 'actions', '', '20%', 0, '', '', 8),

('bx_ads_offers_all', 'content_id', '_bx_ads_grid_column_title_ofrs_content_id', '60%', 0, 0, '', 1),
('bx_ads_offers_all', 'offers_awating', '_bx_ads_grid_column_title_ofrs_offers_awating', '10%', 0, 0, '', 2),
('bx_ads_offers_all', 'offers_total', '_bx_ads_grid_column_title_ofrs_offers_total', '10%', 0, 0, '', 3),
('bx_ads_offers_all', 'actions', '', '20%', 0, '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_ads_offers', 'single', 'accept', '_bx_ads_grid_action_title_ofr_accept', 'check', 1, 1, 1),
('bx_ads_offers', 'single', 'decline', '_bx_ads_grid_action_title_ofr_decline', 'times', 1, 1, 2),

('bx_ads_offers_all', 'single', 'view', '_bx_ads_grid_action_title_ofr_view', 'share-square', 1, 0, 1);

-- GRIDS: categories manager
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_mode`, `sorting_fields`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_ads_categories', 'Sql', 'SELECT * FROM `bx_ads_categories` WHERE 1 ', 'bx_ads_categories', 'id', 'order', 'active', '', 20, NULL, 'start', '', 'title,text', 'auto', '', 128, 'BxAdsGridCategories', 'modules/boonex/ads/classes/BxAdsGridCategories.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_ads_categories', 'order', '', '1%', 0, '', '', 1),
('bx_ads_categories', 'checkbox', '_sys_select', '1%', 0, '', '', 2),
('bx_ads_categories', 'switcher', '', '8%', 0, '', '', 3),
('bx_ads_categories', 'icon', '_bx_ads_grid_column_title_icon', '5%', 0, '', '', 4),
('bx_ads_categories', 'title', '_bx_ads_grid_column_title_title', '50%', 1, '32', '', 5),
('bx_ads_categories', 'subcategories', '_bx_ads_grid_column_title_subcategories', '15%', 0, '16', '', 6),
('bx_ads_categories', 'actions', '', '20%', 0, '', '', 7);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_ads_categories', 'bulk', 'delete', '_bx_ads_grid_action_title_delete', '', 1, 1),
('bx_ads_categories', 'single', 'edit', '', 'pencil-alt', 0, 1),
('bx_ads_categories', 'single', 'delete', '', 'remove', 1, 2),
('bx_ads_categories', 'independent', 'back', '_bx_ads_grid_action_title_back', '', 0, 1),
('bx_ads_categories', 'independent', 'add', '_bx_ads_grid_action_title_add', '', 0, 2);


-- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_ads_html5', 1, 'BxAdsUploaderHTML5', 'modules/boonex/ads/classes/BxAdsUploaderHTML5.php'),
('bx_ads_record_video', 1, 'BxAdsUploaderRecordVideo', 'modules/boonex/ads/classes/BxAdsUploaderRecordVideo.php'),
('bx_ads_photos_html5', 1, 'BxAdsUploaderHTML5Attach', 'modules/boonex/ads/classes/BxAdsUploaderHTML5Attach.php'),
('bx_ads_videos_html5', 1, 'BxAdsUploaderHTML5Attach', 'modules/boonex/ads/classes/BxAdsUploaderHTML5Attach.php'),
('bx_ads_videos_record_video', 1, 'BxAdsUploaderRecordVideoAttach', 'modules/boonex/ads/classes/BxAdsUploaderRecordVideoAttach.php'),
('bx_ads_files_html5', 1, 'BxAdsUploaderHTML5Attach', 'modules/boonex/ads/classes/BxAdsUploaderHTML5Attach.php');


-- LIVE UPDATES
INSERT INTO `sys_objects_live_updates`(`name`, `frequency`, `service_call`, `active`) VALUES
('bx_ads', 1, 'a:3:{s:6:"module";s:6:"bx_ads";s:6:"method";s:16:"get_live_updates";s:6:"params";a:4:{i:0;s:8:"awaiting";i:1;a:2:{s:11:"menu_object";s:18:"sys_toolbar_member";s:9:"menu_item";s:7:"account";}i:2;a:2:{s:11:"menu_object";s:25:"sys_account_notifications";s:9:"menu_item";s:24:"notifications-ads-offers";}i:3;s:7:"{count}";}}', 1);


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_ads', 'BxAdsAlertsResponse', 'modules/boonex/ads/classes/BxAdsAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('profile', 'approve', @iHandler),
('profile', 'activate', @iHandler),
('profile', 'disapprove', @iHandler),
('profile', 'suspend', @iHandler),
('profile', 'delete', @iHandler),

('bx_ads_videos_mp4', 'transcoded', @iHandler),

('bx_timeline', 'get_view', @iHandler),
('bx_timeline', 'get_external_post', @iHandler);


-- CRON
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_ads_offers', '0 * * * *', 'BxAdsCronOffers', 'modules/boonex/ads/classes/BxAdsCronOffers.php', ''),
('bx_ads_pruning', '0 0 * * *', 'BxAdsCronPruning', 'modules/boonex/ads/classes/BxAdsCronPruning.php', '');


-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES 
('bx_ads', '_bx_ads_et_txt_name_interested', 'bx_ads_interested', '_bx_ads_et_txt_subject_interested', '_bx_ads_et_txt_body_interested'),
('bx_ads', '_bx_ads_et_txt_name_purchased', 'bx_ads_purchased', '_bx_ads_et_txt_subject_purchased', '_bx_ads_et_txt_body_purchased'),
('bx_ads', '_bx_ads_et_txt_name_shipped', 'bx_ads_shipped', '_bx_ads_et_txt_subject_shipped', '_bx_ads_et_txt_body_shipped'),
('bx_ads', '_bx_ads_et_txt_name_received', 'bx_ads_received', '_bx_ads_et_txt_subject_received', '_bx_ads_et_txt_body_received'),
('bx_ads', '_bx_ads_et_txt_name_offer_added', 'bx_ads_offer_added', '_bx_ads_et_txt_subject_offer_added', '_bx_ads_et_txt_body_offer_added'),
('bx_ads', '_bx_ads_et_txt_name_offer_accepted', 'bx_ads_offer_accepted', '_bx_ads_et_txt_subject_offer_accepted', '_bx_ads_et_txt_body_offer_accepted'),
('bx_ads', '_bx_ads_et_txt_name_offer_declined', 'bx_ads_offer_declined', '_bx_ads_et_txt_subject_offer_declined', '_bx_ads_et_txt_body_offer_declined'),
('bx_ads', '_bx_ads_et_txt_name_offer_canceled', 'bx_ads_offer_canceled', '_bx_ads_et_txt_subject_offer_canceled', '_bx_ads_et_txt_body_offer_canceled');

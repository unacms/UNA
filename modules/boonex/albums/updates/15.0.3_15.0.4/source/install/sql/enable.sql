
-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_albums', '_bx_albums', 'bx_albums@modules/boonex/albums/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_albums', '_bx_albums', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_albums_enable_auto_approve', 'on', @iCategId, '_bx_albums_option_enable_auto_approve', 'checkbox', '', '', '', 0),
('bx_albums_summary_chars', '700', @iCategId, '_bx_albums_option_summary_chars', 'digit', '', '', '', 1),
('bx_albums_plain_summary_chars', '200', @iCategId, '_bx_albums_option_plain_summary_chars', 'digit', '', '', '', 2),
('bx_albums_per_page_browse', '12', @iCategId, '_bx_albums_option_per_page_browse', 'digit', '', '', '', 10),
('bx_albums_per_page_profile', '6', @iCategId, '_bx_albums_option_per_page_profile', 'digit', '', '', '', 12),
('bx_albums_per_page_browse_showcase', '32', @iCategId, '_sys_option_per_page_browse_showcase', 'digit', '', '', '', 15),
('bx_albums_per_page_for_favorites_lists', '5', @iCategId, '_bx_albums_option_per_page_for_favorites_lists', 'digit', '', '', '', 17),
('bx_albums_album_browsing_unit', '10', @iCategId, '_bx_albums_option_album_browsing_unit', 'digit', '', '', '', 20),
('bx_albums_rss_num', '10', @iCategId, '_bx_albums_option_rss_num', 'digit', '', '', '', 20),
('bx_albums_searchable_fields', 'title,text', @iCategId, '_bx_albums_option_searchable_fields', 'list', '', '', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:21:"get_searchable_fields";}', 30);

-- PAGE: create entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_create_entry', '_bx_albums_page_title_sys_create_entry', '_bx_albums_page_title_create_entry', 'bx_albums', 5, 2147483647, 1, 'create-album', 'page.php?i=create-album', '', '', '', 0, 1, 0, 'BxAlbumsPageBrowse', 'modules/boonex/albums/classes/BxAlbumsPageBrowse.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_create_entry', 1, 'bx_albums', '_bx_albums_page_block_title_create_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:13:"entity_create";}', 0, 1, 1);

-- PAGE: add images
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_add_images', '_bx_albums_page_title_sys_add_images', '_bx_albums_page_title_add_images', 'bx_albums', 5, 2147483647, 1, 'add-images', '', '', '', '', 0, 1, 0, 'BxAlbumsPageEntry', 'modules/boonex/albums/classes/BxAlbumsPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_add_images', 1, 'bx_albums', '_bx_albums_page_block_title_add_images', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:16:"entity_add_files";}', 0, 0, 0);

-- PAGE: edit entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_edit_entry', '_bx_albums_page_title_sys_edit_entry', '_bx_albums_page_title_edit_entry', 'bx_albums', 5, 2147483647, 1, 'edit-album', '', '', '', '', 0, 1, 0, 'BxAlbumsPageEntry', 'modules/boonex/albums/classes/BxAlbumsPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_edit_entry', 1, 'bx_albums', '_bx_albums_page_block_title_edit_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:11:"entity_edit";}', 0, 0, 0);

-- PAGE: delete entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_delete_entry', '_bx_albums_page_title_sys_delete_entry', '_bx_albums_page_title_delete_entry', 'bx_albums', 5, 2147483647, 1, 'delete-album', '', '', '', '', 0, 1, 0, 'BxAlbumsPageEntry', 'modules/boonex/albums/classes/BxAlbumsPageEntry.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_delete_entry', 1, 'bx_albums', '_bx_albums_page_block_title_delete_entry', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:13:"entity_delete";}', 0, 0, 0);

-- PAGE: view entry
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_view_entry', '_bx_albums_page_title_sys_view_entry', '_bx_albums_page_title_view_entry', 'bx_albums', 12, 2147483647, 1, 'view-album', '', '', '', '', 0, 1, 0, 'BxAlbumsPageEntry', 'modules/boonex/albums/classes/BxAlbumsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_albums_view_entry', 2, 'bx_albums','' , '_bx_albums_page_block_title_entry_text', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:17:\"entity_text_block\";}', 0, 0, 1, 1),
('bx_albums_view_entry', 2, 'bx_albums','' , '_bx_albums_page_block_title_entry_attachments', 0, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:18:\"entity_attachments\";}', 0, 0, 1, 3),
('bx_albums_view_entry', 4, 'bx_albums','' , '_bx_albums_page_block_title_entry_social_sharing', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:21:\"entity_social_sharing\";}', 0, 0, 0, 0),
('bx_albums_view_entry', 2, 'bx_albums','' , '_bx_albums_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 1, 4),
('bx_albums_view_entry', 3, 'bx_albums','' , '_bx_albums_page_block_title_entry_location', 3, 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:13:\"locations_map\";s:6:\"params\";a:2:{i:0;s:9:\"bx_albums\";i:1;s:4:\"{id}\";}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', 0, 0, 1, 4),
('bx_albums_view_entry', 3, 'bx_albums','' , '_bx_albums_page_block_title_entry_author', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:13:\"entity_author\";}', 0, 0, 1, 2),
('bx_albums_view_entry', 3, 'bx_albums', '_bx_albums_page_block_title_sys_entry_context', '_bx_albums_page_block_title_entry_context', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:14:\"entity_context\";}', 0, 0, 1, 1),
('bx_albums_view_entry', 3, 'bx_albums','' , '_bx_albums_page_block_title_entry_info', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:11:\"entity_info\";}', 0, 0, 1, 3),
('bx_albums_view_entry', 3, 'bx_albums', '', '_bx_albums_page_block_title_entry_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:14:\"entity_actions\";}', 0, 0, 0, 0),
('bx_albums_view_entry', 2, 'bx_albums','' , '_bx_albums_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:18:\"entity_all_actions\";}', 0, 0, 1, 2),
('bx_albums_view_entry', 2, 'bx_albums', '', '_bx_albums_page_block_title_entry_reports', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:14:\"entity_reports\";}', 0, 0, 1, 6);

-- PAGE: view media
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `content_info`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_view_media', 'view-album-media', '_bx_albums_page_title_sys_view_media', '_bx_albums_page_title_view_media', 'bx_albums', 12, 2147483647, 1, '', 'bx_albums_media', '', '', '', 0, 1, 0, 'BxAlbumsPageMedia', 'modules/boonex/albums/classes/BxAlbumsPageMedia.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_albums_view_media', 2, 'bx_albums', '', '_bx_albums_page_block_title_entry_view_media', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:10:\"media_view\";}', 0, 0, 1, 1),
('bx_albums_view_media', 3, 'bx_albums', '', '_bx_albums_page_block_title_entry_author', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:12:\"media_author\";}', 0, 0, 1, 1),
('bx_albums_view_media', 3, 'bx_albums', '', '_bx_albums_page_block_title_entry_social_sharing', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:20:\"media_social_sharing\";}', 0, 0, 0, 0),
('bx_albums_view_media', 2, 'bx_albums', '', '_bx_albums_page_block_title_entry_comments', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:14:\"media_comments\";}', 0, 0, 1, 3),
('bx_albums_view_media', 3, 'bx_albums', '', '_bx_albums_page_block_title_entry_view_media_exif', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:10:\"media_exif\";}', 0, 0, 1, 2),
('bx_albums_view_media', 3, 'bx_albums', '', '_bx_albums_page_block_title_entry_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:13:\"media_actions\";}', 0, 0, 0, 0),
('bx_albums_view_media', 2, 'bx_albums', '', '_bx_albums_page_block_title_entry_all_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:17:\"media_all_actions\";}', 0, 0, 1, 2),
('bx_albums_view_media', 3, 'bx_albums', '', '_bx_albums_page_block_title_featured_entries_view_gallery_media', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:21:"browse_featured_media";s:6:"params";a:1:{i:0;s:7:"gallery";}}', 0, 1, 1, 3);

-- PAGE: edit media
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_edit_media', '_bx_albums_page_title_sys_edit_media', '_bx_albums_page_title_edit_media', 'bx_albums', 5, 2147483647, 1, 'edit-media', '', '', '', '', 0, 1, 0, 'BxAlbumsPageMedia', 'modules/boonex/albums/classes/BxAlbumsPageMedia.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_edit_media', 1, 'bx_albums', '_bx_albums_page_block_title_edit_media', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:10:"media_edit";}', 0, 0, 0);

-- PAGE: move media
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_move_media', '_bx_albums_page_title_sys_move_media', '_bx_albums_page_title_move_media', 'bx_albums', 5, 2147483647, 1, 'move-media', '', '', '', '', 0, 1, 0, 'BxAlbumsPageMedia', 'modules/boonex/albums/classes/BxAlbumsPageMedia.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_move_media', 1, 'bx_albums', '_bx_albums_page_block_title_move_media', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:10:"media_move";}', 0, 0, 0);

-- PAGE: delete media
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_delete_media', '_bx_albums_page_title_sys_delete_media', '_bx_albums_page_title_delete_media', 'bx_albums', 5, 2147483647, 1, 'delete-media', '', '', '', '', 0, 1, 0, 'BxAlbumsPageMedia', 'modules/boonex/albums/classes/BxAlbumsPageMedia.php');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_delete_media', 1, 'bx_albums', '_bx_albums_page_block_title_delete_media', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:12:"media_delete";}', 0, 0, 0);

-- PAGE: view entry comments
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_view_entry_comments', '_bx_albums_page_title_sys_view_entry_comments', '_bx_albums_page_title_view_entry_comments', 'bx_albums', 5, 2147483647, 1, 'view-album-comments', '', '', '', '', 0, 1, 0, 'BxAlbumsPageEntry', 'modules/boonex/albums/classes/BxAlbumsPageEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_albums_view_entry_comments', 1, 'bx_albums', '_bx_albums_page_block_title_entry_comments', '_bx_albums_page_block_title_entry_comments_link', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:15:\"entity_comments\";}', 0, 0, 1);

-- PAGE: popular albums
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_popular', '_bx_albums_page_title_sys_entries_popular', '_bx_albums_page_title_entries_popular', 'bx_albums', 5, 2147483647, 1, 'albums-popular', 'page.php?i=albums-popular', '', '', '', 0, 1, 0, 'BxAlbumsPageBrowse', 'modules/boonex/albums/classes/BxAlbumsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_albums_popular', 1, 'bx_albums', '_bx_albums_page_block_title_popular_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:14:"browse_popular";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);

-- PAGE: popular media
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_popular_media', '_bx_albums_page_title_sys_entries_popular_media', '_bx_albums_page_title_entries_popular_media', 'bx_albums', 5, 2147483647, 1, 'albums-popular-media', 'page.php?i=albums-popular-media', '', '', '', 0, 1, 0, 'BxAlbumsPageBrowseMedia', 'modules/boonex/albums/classes/BxAlbumsPageBrowseMedia.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_albums_popular_media', 1, 'bx_albums', '_bx_albums_page_block_title_popular_media', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:20:"browse_popular_media";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);

-- PAGE: top albums
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_top', '_bx_albums_page_title_sys_entries_top', '_bx_albums_page_title_entries_top', 'bx_albums', 5, 2147483647, 1, 'albums-top', 'page.php?i=albums-top', '', '', '', 0, 1, 0, 'BxAlbumsPageBrowse', 'modules/boonex/albums/classes/BxAlbumsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_albums_top', 1, 'bx_albums', '_bx_albums_page_block_title_top_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:10:"browse_top";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);

-- PAGE: top media
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_top_media', '_bx_albums_page_title_sys_entries_top_media', '_bx_albums_page_title_entries_top_media', 'bx_albums', 5, 2147483647, 1, 'albums-top-media', 'page.php?i=albums-top-media', '', '', '', 0, 1, 0, 'BxAlbumsPageBrowseMedia', 'modules/boonex/albums/classes/BxAlbumsPageBrowseMedia.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_albums_top_media', 1, 'bx_albums', '_bx_albums_page_block_title_top_media', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:16:"browse_top_media";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1);

-- PAGE: entries of author
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_author', 'albums-author', '_bx_albums_page_title_sys_entries_of_author', '_bx_albums_page_title_entries_of_author', 'bx_albums', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxAlbumsPageAuthor', 'modules/boonex/albums/classes/BxAlbumsPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_albums_author', 1, 'bx_albums', '', '_bx_albums_page_block_title_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:18:\"my_entries_actions\";}', 0, 0, 1, 1),
('bx_albums_author', 1, 'bx_albums', '_bx_albums_page_block_title_sys_favorites_of_author', '_bx_albums_page_block_title_favorites_of_author', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:21:"browse_favorite_lists";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1, 2),
('bx_albums_author', 1, 'bx_albums', '_bx_albums_page_block_title_sys_favorites_of_author_media', '_bx_albums_page_block_title_favorites_of_author_media', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:21:\"browse_favorite_media\";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 1, 1, 3),
('bx_albums_author', 1, 'bx_albums', '_bx_albums_page_block_title_sys_entries_of_author', '_bx_albums_page_block_title_entries_of_author', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:13:\"browse_author\";}', 0, 0, 1, 4),
('bx_albums_author', 1, 'bx_albums', '_bx_albums_page_block_title_sys_entries_in_context', '_bx_albums_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:14:"browse_context";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";i:0;a:1:{s:13:"empty_message";b:0;}}}', 0, 0, 1, 5);


-- PAGE: favorites by list
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_favorites', '_bx_albums_page_title_sys_entries_favorites', '_bx_albums_page_title_entries_favorites', 'bx_albums', 12, 2147483647, 1, 'albums-favorites', 'page.php?i=albums-favorites', '', '', '', 0, 1, 0, 'BxAlbumsPageListEntry', 'modules/boonex/albums/classes/BxAlbumsPageListEntry.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_albums_favorites', 2, 'bx_albums', '_bx_albums_page_block_title_sys_favorites_entries', '_bx_albums_page_block_title_favorites_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:15:"browse_favorite";s:6:"params";a:2:{s:10:"profile_id";s:12:"{profile_id}";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:0;s:13:"ajax_paginate";b:0;}}}', 0, 1, 1),
('bx_albums_favorites', 3, 'bx_albums', '', '_bx_albums_page_block_title_favorites_entries_info', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:19:"favorites_list_info";}', 0, 0, 0),
('bx_albums_favorites', 3, 'bx_albums', '', '_bx_albums_page_block_title_favorites_entries_actions', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:22:"favorites_list_actions";}', 0, 0, 1);



-- PAGE: entries in context
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_context', 'albums-context', '_bx_albums_page_title_sys_entries_in_context', '_bx_albums_page_title_entries_in_context', 'bx_albums', 5, 2147483647, 1, '', '', '', '', 0, 1, 0, 'BxAlbumsPageAuthor', 'modules/boonex/albums/classes/BxAlbumsPageAuthor.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_albums_context', 1, 'bx_albums', '_bx_albums_page_block_title_sys_entries_in_context', '_bx_albums_page_block_title_entries_in_context', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:14:\"browse_context\";}', 0, 0, 1, 1);

-- PAGE: module home
INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_home', 'albums-home', '_bx_albums_page_title_sys_home', '_bx_albums_page_title_home', 'bx_albums', 2, 2147483647, 1, 'page.php?i=albums-home', '', '', '', 0, 1, 0, 'BxAlbumsPageBrowse', 'modules/boonex/albums/classes/BxAlbumsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_albums_home', 1, 'bx_albums', '', '_bx_albums_page_block_title_featured_entries_view_extended', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:15:"browse_featured";s:6:"params";a:1:{i:0;s:8:"extended";}}', 0, 1, 1, 0),
('bx_albums_home', 1, 'bx_albums', '', '_bx_albums_page_block_title_featured_entries_view_gallery_media', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:21:"browse_featured_media";s:6:"params";a:1:{i:0;s:7:"gallery";}}', 0, 1, 1, 1),
('bx_albums_home', 1, 'bx_albums', '', '_bx_albums_page_block_title_updated_entries', 11, 2147483647, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:14:\"browse_updated\";s:6:\"params\";a:3:{s:9:\"unit_view\";s:8:\"extended\";s:13:\"empty_message\";b:1;s:13:\"ajax_paginate\";b:0;}}', 0, 1, 1, 2),
('bx_albums_home', 2, 'bx_albums', '', '_bx_albums_page_block_title_popular_keywords_albums', 11, 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:14:\"keywords_cloud\";s:6:\"params\";a:3:{i:0;s:9:\"bx_albums\";i:1;s:9:\"bx_albums\";i:2;a:1:{s:10:\"show_empty\";b:1;}}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', 1, 0, 1, 0),
('bx_albums_home', 2, 'bx_albums', '', '_bx_albums_page_block_title_popular_keywords_media', 11, 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:14:\"keywords_cloud\";s:6:\"params\";a:2:{i:0;s:15:\"bx_albums_media\";i:1;s:15:\"bx_albums_media\";}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', 1, 0, 1, 1),
('bx_albums_home', 2, 'bx_albums', '', '_bx_albums_page_block_title_popular_keywords_media_camera', 11, 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:14:\"keywords_cloud\";s:6:\"params\";a:2:{i:0;s:22:\"bx_albums_media_camera\";i:1;s:22:\"bx_albums_media_camera\";}s:5:\"class\";s:20:\"TemplServiceMetatags\";}', 1, 0, 1, 2);

-- PAGE: search for entries
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_search', '_bx_albums_page_title_sys_entries_search', '_bx_albums_page_title_entries_search', 'bx_albums', 11, 2147483647, 1, 'albums-search', 'page.php?i=albums-search', '', '', '', 0, 1, 0, 'BxAlbumsPageBrowse', 'modules/boonex/albums/classes/BxAlbumsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_albums_search', 2, 'bx_albums', '_bx_albums_page_block_title_search_form', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:9:"bx_albums";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_albums_search', 1, 'bx_albums', '_bx_albums_page_block_title_search_results', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:9:"bx_albums";s:10:"show_empty";b:0;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_albums_search', 3, 'bx_albums', '_bx_albums_page_block_title_search_form_media', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:15:"bx_albums_media";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 1),
('bx_albums_search', 1, 'bx_albums', '_bx_albums_page_block_title_search_results_media', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:15:"bx_albums_media";s:10:"show_empty";b:0;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 1, 2),
('bx_albums_search', 2, 'bx_albums', '_bx_albums_page_block_title_search_form_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:14:"bx_albums_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 2),
('bx_albums_search', 1, 'bx_albums', '_bx_albums_page_block_title_search_results_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:14:"bx_albums_cmts";s:10:"show_empty";b:0;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 3),
('bx_albums_search', 3, 'bx_albums', '_bx_albums_page_block_title_search_form_media_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:8:"get_form";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:20:"bx_albums_media_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 2),
('bx_albums_search', 1, 'bx_albums', '_bx_albums_page_block_title_search_results_media_cmts', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:2:{s:6:"object";s:20:"bx_albums_media_cmts";s:10:"show_empty";b:0;}}s:5:"class";s:27:"TemplSearchExtendedServices";}', 0, 1, 0, 4);

-- PAGE: module manage own
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_manage', '_bx_albums_page_title_sys_manage', '_bx_albums_page_title_manage', 'bx_albums', 5, 2147483647, 1, 'albums-manage', 'page.php?i=albums-manage', '', '', '', 0, 1, 0, 'BxAlbumsPageBrowse', 'modules/boonex/albums/classes/BxAlbumsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_albums_manage', 1, 'bx_albums', '_bx_albums_page_block_title_system_manage', '_bx_albums_page_block_title_manage', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:12:\"manage_tools\";}}', 0, 1, 0);

-- PAGE: module manage all
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_administration', '_bx_albums_page_title_sys_manage_administration', '_bx_albums_page_title_manage', 'bx_albums', 5, 192, 1, 'albums-administration', 'page.php?i=albums-administration', '', '', '', 0, 1, 0, 'BxAlbumsPageBrowse', 'modules/boonex/albums/classes/BxAlbumsPageBrowse.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_albums_administration', 1, 'bx_albums', '_bx_albums_page_block_title_system_manage_administration', '_bx_albums_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:\"module\";s:9:\"bx_albums\";s:6:\"method\";s:12:\"manage_tools\";s:6:\"params\";a:1:{i:0;s:14:\"administration\";}}', 0, 1, 0);

-- PAGE: add block to homepage
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', 1, 'bx_albums', '_bx_albums_page_block_title_recent_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:13:"browse_public";s:6:"params";a:2:{i:0;b:0;i:1;b:0;}}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 1),
('sys_home', 1, 'bx_albums', '_bx_albums_page_block_title_updated_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:14:"browse_updated";s:6:"params";a:2:{i:0;b:0;i:1;b:0;}}', 1, 0, 0, IFNULL(@iBlockOrder, 0) + 2);

-- PAGES: add page block to profiles modules (trigger* page objects are processed separately upon modules enable/disable)
SET @iPBCellProfile = 3;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('trigger_page_profile_view_entry', @iPBCellProfile, 'bx_albums', '_bx_albums_page_block_title_sys_my_entries', '_bx_albums_page_block_title_my_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:13:"browse_author";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:2:{s:8:"per_page";s:26:"bx_albums_per_page_profile";s:13:"empty_message";b:0;}}}', 0, 0, 0);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('', 0, 'bx_albums', '', '_bx_albums_page_block_title_recent_media', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:19:"browse_recent_media";s:6:"params";a:3:{s:9:"unit_view";s:7:"gallery";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:1;}}', 0, 1, 1, @iBlockOrder + 1),
('', 0, 'bx_albums', '', '_bx_albums_page_block_title_popular_keywords_albums', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"keywords_cloud";s:6:"params";a:2:{i:0;s:9:"bx_albums";i:1;s:9:"bx_albums";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 1, 1, @iBlockOrder + 2),
('', 0, 'bx_albums', '', '_bx_albums_page_block_title_popular_keywords_media', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"keywords_cloud";s:6:"params";a:2:{i:0;s:15:"bx_albums_media";i:1;s:15:"bx_albums_media";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 1, 1, @iBlockOrder + 3),
('', 0, 'bx_albums', '', '_bx_albums_page_block_title_popular_keywords_media_camera', 11, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"keywords_cloud";s:6:"params";a:2:{i:0;s:22:"bx_albums_media_camera";i:1;s:22:"bx_albums_media_camera";}s:5:"class";s:20:"TemplServiceMetatags";}', 0, 1, 1, @iBlockOrder + 4),
('', 0, 'bx_albums', '', '_bx_albums_page_block_title_recent_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:13:"browse_public";s:6:"params";a:3:{s:9:"unit_view";s:8:"extended";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1, @iBlockOrder + 5),
('', 0, 'bx_albums', '_bx_albums_page_block_title_sys_recent_media_view_showcase', '_bx_albums_page_block_title_recent_media_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:19:"browse_recent_media";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1, @iBlockOrder + 6),
('', 0, 'bx_albums', '_bx_albums_page_block_title_sys_popular_media_view_showcase', '_bx_albums_page_block_title_popular_media_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:20:"browse_popular_media";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1,@iBlockOrder + 7),
('', 0, 'bx_albums', '_bx_albums_page_block_title_sys_featured_media_view_showcase', '_bx_albums_page_block_title_featured_media_view_showcase', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_albums";s:6:"method";s:21:"browse_featured_media";s:6:"params";a:3:{s:9:"unit_view";s:8:"showcase";s:13:"empty_message";b:1;s:13:"ajax_paginate";b:0;}}', 0, 1, 1,@iBlockOrder + 8);

-- MENU: add to site menu
SET @iSiteMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `active` = 1 AND `order` < 9999 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_site', 'bx_albums', 'albums-home', '_bx_albums_menu_item_title_system_entries_home', '_bx_albums_menu_item_title_entries_home', 'page.php?i=albums-home', '', '', 'far image', 'bx_albums_submenu', 2147483647, 1, 1, IFNULL(@iSiteMenuOrder, 0) + 1);

-- MENU: add to homepage menu
SET @iHomepageMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_homepage' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_homepage', 'bx_albums', 'albums-home', '_bx_albums_menu_item_title_system_entries_home', '_bx_albums_menu_item_title_entries_home', 'page.php?i=albums-home', '', '', 'far image', 'bx_albums_submenu', 2147483647, 1, 1, IFNULL(@iHomepageMenuOrder, 0) + 1);

-- MENU: add to "add content" menu
SET @iAddMenuOrder = (SELECT `order` FROM `sys_menu_items` WHERE `set_name` = 'sys_add_content_links' AND `active` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_add_content_links', 'bx_albums', 'create-album', '_bx_albums_menu_item_title_system_create_entry', '_bx_albums_menu_item_title_create_entry', 'page.php?i=create-album', '', '', 'far image', '', 2147483647, 1, 1, IFNULL(@iAddMenuOrder, 0) + 1);

-- MENU: actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_view', '_bx_albums_menu_title_view_entry', 'bx_albums_view', 'bx_albums', 9, 0, 1, 'BxAlbumsMenuView', 'modules/boonex/albums/classes/BxAlbumsMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_view', 'bx_albums', '_bx_albums_menu_set_title_view_entry', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_albums_view', 'bx_albums', 'add-images-to-album', '_bx_albums_menu_item_title_system_add_images', '_bx_albums_menu_item_title_add_images', 'page.php?i=add-images&id={content_id}', '', '', 'plus', '', 2147483647, 1, 0, 10),
('bx_albums_view', 'bx_albums', 'edit-album', '_bx_albums_menu_item_title_system_edit_entry', '_bx_albums_menu_item_title_edit_entry', 'page.php?i=edit-album&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 1, 0, 20),
('bx_albums_view', 'bx_albums', 'delete-album', '_bx_albums_menu_item_title_system_delete_entry', '_bx_albums_menu_item_title_delete_entry', 'page.php?i=delete-album&id={content_id}', '', '', 'remove', '', 2147483647, 1, 0, 30),
('bx_albums_view', 'bx_albums', 'approve', '_sys_menu_item_title_system_va_approve', '_sys_menu_item_title_va_approve', 'javascript:void(0)', 'javascript:bx_approve(this, ''{module_uri}'', {content_id});', '', 'check', '', 2147483647, 1, 0, 40);

-- MENU: all actions menu for view entry 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_view_actions', '_sys_menu_title_view_actions', 'bx_albums_view_actions', 'bx_albums', 15, 0, 1, 'BxAlbumsMenuViewActions', 'modules/boonex/albums/classes/BxAlbumsMenuViewActions.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_view_actions', 'bx_albums', '_sys_menu_set_title_view_actions', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES 
('bx_albums_view_actions', 'bx_albums', 'add-images-to-album', '_bx_albums_menu_item_title_system_add_images', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 10),
('bx_albums_view_actions', 'bx_albums', 'edit-album', '_bx_albums_menu_item_title_system_edit_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 20),
('bx_albums_view_actions', 'bx_albums', 'delete-album', '_bx_albums_menu_item_title_system_delete_entry', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 30),
('bx_albums_view_actions', 'bx_albums', 'approve', '_sys_menu_item_title_system_va_approve', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 40),
('bx_albums_view_actions', 'bx_albums', 'set-badges', '_sys_menu_item_title_system_set_badges', '_sys_menu_item_title_set_badges', 'javascript:void(0)', 'bx_menu_popup(''sys_set_badges'', window, {}, {module: ''bx_albums'', content_id: {content_id}});', '', 'check-circle', '', '', 0, 2147483647, 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:19:"is_badges_avaliable";}', 1, 0, 50),
('bx_albums_view_actions', 'bx_albums', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 200),
('bx_albums_view_actions', 'bx_albums', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 210),
('bx_albums_view_actions', 'bx_albums', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, '', 0, 0, 220),
('bx_albums_view_actions', 'bx_albums', 'reaction', '_sys_menu_item_title_system_va_reaction', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 225),
('bx_albums_view_actions', 'bx_albums', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 230),
('bx_albums_view_actions', 'bx_albums', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 240),
('bx_albums_view_actions', 'bx_albums', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 250),
('bx_albums_view_actions', 'bx_albums', 'repost', '_sys_menu_item_title_system_va_repost', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 260),
('bx_albums_view_actions', 'bx_albums', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, '', 1, 0, 270),
('bx_albums_view_actions', 'bx_albums', 'notes', '_sys_menu_item_title_system_va_notes', '_sys_menu_item_title_va_notes', 'javascript:void(0)', 'javascript:bx_get_notes(this,  ''{module_uri}'', {content_id});', '', 'exclamation-triangle', '', '', 0, 2147483647, '', 1, 0, 280),
('bx_albums_view_actions', 'bx_albums', 'audit', '_sys_menu_item_title_system_va_audit', '_sys_menu_item_title_va_audit', 'page.php?i=dashboard-audit&module=bx_albums&content_id={content_id}', '', '', 'history', '', '', 0, 192, '', 1, 0, 290),
('bx_albums_view_actions', 'bx_albums', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, '', 1, 0, 300),
('bx_albums_view_actions', 'bx_albums', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, '', 1, 0, 9999);


-- MENU: actions menu for view media
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_view_media', '_bx_albums_menu_title_view_media', 'bx_albums_view_media', 'bx_albums', 9, 0, 1, 'BxAlbumsMenuView', 'modules/boonex/albums/classes/BxAlbumsMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_view_media', 'bx_albums', '_bx_albums_menu_set_title_view_media', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_albums_view_media', 'bx_albums', 'add-images-to-album', '_bx_albums_menu_item_title_system_add_images', '_bx_albums_menu_item_title_add_images', 'page.php?i=add-images&id={content_id}', '', '', 'plus', '', 2147483647, 1, 0, 10),
('bx_albums_view_media', 'bx_albums', 'edit-album', '_bx_albums_menu_item_title_system_edit_album', '_bx_albums_menu_item_title_edit_album', 'page.php?i=edit-album&id={content_id}', '', '', 'pencil-alt', '', 2147483647, 1, 0, 20),
('bx_albums_view_media', 'bx_albums', 'edit-image', '_bx_albums_menu_item_title_system_edit_image', '_bx_albums_menu_item_title_edit_image', 'javascript:void(0)', 'javascript:{js_object}.editMedia(this, {media_id});', '', 'pencil-alt', '', 2147483647, 1, 0, 30),
('bx_albums_view_media', 'bx_albums', 'delete-image', '_bx_albums_menu_item_title_system_delete_image', '_bx_albums_menu_item_title_delete_image', 'javascript:void(0)', 'javascript:{js_object}.deleteMedia(this, {media_id});', '', 'remove', '', 2147483647, 1, 0, 40),
('bx_albums_view_media', 'bx_albums', 'move-image', '_bx_albums_menu_item_title_system_move_image', '_bx_albums_menu_item_title_move_image', 'javascript:void(0)', 'javascript:{js_object}.moveMedia(this, {media_id});', '', 'exchange-alt', '', 2147483647, 1, 0, 50);


-- MENU: all actions menu for view media page 
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_view_actions_media', '_bx_albums_menu_title_view_actions_media', 'bx_albums_view_actions_media', 'bx_albums', 15, 0, 1, 'BxAlbumsMenuViewActionsMedia', 'modules/boonex/albums/classes/BxAlbumsMenuViewActionsMedia.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_view_actions_media', 'bx_albums', '_bx_albums_menu_set_title_view_actions_media', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_albums_view_actions_media', 'bx_albums', 'add-images-to-album', '_bx_albums_menu_item_title_system_add_images', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 10),
('bx_albums_view_actions_media', 'bx_albums', 'edit-album', '_bx_albums_menu_item_title_system_edit_album', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 20),
('bx_albums_view_actions_media', 'bx_albums', 'edit-image', '_bx_albums_menu_item_title_system_edit_image', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 30),
('bx_albums_view_actions_media', 'bx_albums', 'delete-image', '_bx_albums_menu_item_title_system_delete_image', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 40),
('bx_albums_view_actions_media', 'bx_albums', 'move-image', '_bx_albums_menu_item_title_system_move_image', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 50),
('bx_albums_view_actions_media', 'bx_albums', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, 0, 0, 200),
('bx_albums_view_actions_media', 'bx_albums', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 210),
('bx_albums_view_actions_media', 'bx_albums', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 220),
('bx_albums_view_actions_media', 'bx_albums', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 230),
('bx_albums_view_actions_media', 'bx_albums', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 240),
('bx_albums_view_actions_media', 'bx_albums', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 250),
('bx_albums_view_actions_media', 'bx_albums', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 260),
('bx_albums_view_actions_media', 'bx_albums', 'social-sharing', '_sys_menu_item_title_system_social_sharing', '_sys_menu_item_title_social_sharing', 'javascript:void(0)', 'oBxDolPage.share(this, \'{url_encoded}\')', '', 'share', '', '', 0, 2147483647, 1, 0, 300),
('bx_albums_view_actions_media', 'bx_albums', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, 1, 0, 9999);

-- MENU: actions menu for media unit
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_view_actions_media_unit', '_bx_albums_menu_title_view_actions_media_unit', 'bx_albums_view_actions_media_unit', 'bx_albums', 15, 0, 1, 'BxAlbumsMenuViewActionsMedia', 'modules/boonex/albums/classes/BxAlbumsMenuViewActionsMedia.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_view_actions_media_unit', 'bx_albums', '_bx_albums_menu_set_title_view_actions_media_unit', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_albums_view_actions_media_unit', 'bx_albums', 'comment', '_sys_menu_item_title_system_va_comment', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 200),
('bx_albums_view_actions_media_unit', 'bx_albums', 'view', '_sys_menu_item_title_system_va_view', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 210),
('bx_albums_view_actions_media_unit', 'bx_albums', 'vote', '_sys_menu_item_title_system_va_vote', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 220),
('bx_albums_view_actions_media_unit', 'bx_albums', 'score', '_sys_menu_item_title_system_va_score', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 230),
('bx_albums_view_actions_media_unit', 'bx_albums', 'favorite', '_sys_menu_item_title_system_va_favorite', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 240),
('bx_albums_view_actions_media_unit', 'bx_albums', 'feature', '_sys_menu_item_title_system_va_feature', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 250),
('bx_albums_view_actions_media_unit', 'bx_albums', 'report', '_sys_menu_item_title_system_va_report', '', '', '', '', '', '', '', 0, 2147483647, 1, 0, 260),
('bx_albums_view_actions_media_unit', 'bx_albums', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', '', 0, 2147483647, 1, 0, 9999);

-- MENU: actions menu for my entries
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_my', '_bx_albums_menu_title_entries_my', 'bx_albums_my', 'bx_albums', 9, 0, 1, 'BxAlbumsMenu', 'modules/boonex/albums/classes/BxAlbumsMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_my', 'bx_albums', '_bx_albums_menu_set_title_entries_my', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_albums_my', 'bx_albums', 'create-album', '_bx_albums_menu_item_title_system_create_entry', '_bx_albums_menu_item_title_create_entry', 'page.php?i=create-album', '', '', 'plus', '', 2147483647, 1, 0, 0);

-- MENU: module sub-menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_submenu', '_bx_albums_menu_title_submenu', 'bx_albums_submenu', 'bx_albums', 8, 0, 1, '', '');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_submenu', 'bx_albums', '_bx_albums_menu_set_title_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_albums_submenu', 'bx_albums', 'albums-home', '_bx_albums_menu_item_title_system_entries_recent', '_bx_albums_menu_item_title_entries_recent', 'page.php?i=albums-home', '', '', '', '', 2147483647, 1, 1, 1),
('bx_albums_submenu', 'bx_albums', 'albums-popular', '_bx_albums_menu_item_title_system_entries_popular', '_bx_albums_menu_item_title_entries_popular', 'page.php?i=albums-popular', '', '', '', '', 2147483647, 1, 1, 2),
('bx_albums_submenu', 'bx_albums', 'albums-top', '_bx_albums_menu_item_title_system_entries_top', '_bx_albums_menu_item_title_entries_top', 'page.php?i=albums-top', '', '', '', '', 2147483647, 1, 1, 3),
('bx_albums_submenu', 'bx_albums', 'albums-popular-media', '_bx_albums_menu_item_title_system_entries_popular_media', '_bx_albums_menu_item_title_entries_popular_media', 'page.php?i=albums-popular-media', '', '', '', '', 2147483647, 1, 1, 4),
('bx_albums_submenu', 'bx_albums', 'albums-top-media', '_bx_albums_menu_item_title_system_entries_top_media', '_bx_albums_menu_item_title_entries_top_media', 'page.php?i=albums-top-media', '', '', '', '', 2147483647, 1, 1, 5),
('bx_albums_submenu', 'bx_albums', 'albums-search', '_bx_albums_menu_item_title_system_entries_search', '_bx_albums_menu_item_title_entries_search', 'page.php?i=albums-search', '', '', '', '', 2147483647, 1, 1, 6),
('bx_albums_submenu', 'bx_albums', 'albums-manage', '_bx_albums_menu_item_title_system_entries_manage', '_bx_albums_menu_item_title_entries_manage', 'page.php?i=albums-manage', '', '', '', '', 2147483646, 1, 1, 7);

-- MENU: sub-menu for view entry
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_view_submenu', '_bx_albums_menu_title_view_entry_submenu', 'bx_albums_view_submenu', 'bx_albums', 8, 0, 1, 'BxAlbumsMenuView', 'modules/boonex/albums/classes/BxAlbumsMenuView.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_view_submenu', 'bx_albums', '_bx_albums_menu_set_title_view_entry_submenu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_albums_view_submenu', 'bx_albums', 'view-album', '_bx_albums_menu_item_title_system_view_entry', '_bx_albums_menu_item_title_view_entry_submenu_entry', 'page.php?i=view-album&id={content_id}', '', '', '', '', 2147483647, 1, 0, 1),
('bx_albums_view_submenu', 'bx_albums', 'view-album-comments', '_bx_albums_menu_item_title_system_view_entry_comments', '_bx_albums_menu_item_title_view_entry_submenu_comments', 'page.php?i=view-album-comments&id={content_id}', '', '', '', '', 2147483647, 1, 0, 2);

-- MENU: custom menu for snippet meta info
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_snippet_meta', '_sys_menu_title_snippet_meta', 'bx_albums_snippet_meta', 'bx_albums', 15, 0, 1, 'BxAlbumsMenuSnippetMeta', 'modules/boonex/albums/classes/BxAlbumsMenuSnippetMeta.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_snippet_meta', 'bx_albums', '_sys_menu_set_title_snippet_meta', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('bx_albums_snippet_meta', 'bx_albums', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', 2147483647, 1, 0, 1, 1),
('bx_albums_snippet_meta', 'bx_albums', 'author', '_sys_menu_item_title_system_sm_author', '_sys_menu_item_title_sm_author', '', '', '', '', '', 2147483647, 1, 0, 1, 2),
('bx_albums_snippet_meta', 'bx_albums', 'tags', '_sys_menu_item_title_system_sm_tags', '_sys_menu_item_title_sm_tags', '', '', '', '', '', 2147483647, 0, 0, 1, 3),
('bx_albums_snippet_meta', 'bx_albums', 'views', '_sys_menu_item_title_system_sm_views', '_sys_menu_item_title_sm_views', '', '', '', '', '', 2147483647, 0, 0, 1, 4),
('bx_albums_snippet_meta', 'bx_albums', 'comments', '_sys_menu_item_title_system_sm_comments', '_sys_menu_item_title_sm_comments', '', '', '', '', '', 2147483647, 0, 0, 1, 5),
('bx_albums_snippet_meta', 'bx_albums', 'items', '_bx_albums_menu_item_title_system_sm_items', '_bx_albums_menu_item_title_sm_items', '', '', '', '', '', 2147483647, 0, 0, 1, 6);

-- MENU: profile stats
SET @iNotifMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name` = 'sys_profile_stats' AND `active` = 1 LIMIT 1);
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'bx_albums', 'profile-stats-my-albums', '_bx_albums_menu_item_title_system_manage_my_albums', '_bx_albums_menu_item_title_manage_my_albums', 'page.php?i=albums-author&profile_id={member_id}', '', '_self', 'far image', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:41:"get_menu_addon_manage_tools_profile_stats";}', '', 2147483646, 1, 0, @iNotifMenuOrder + 1);

-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_menu_manage_tools', '_bx_albums_menu_title_manage_tools', 'bx_albums_menu_manage_tools', 'bx_albums', 6, 0, 1, 'BxAlbumsMenuManageTools', 'modules/boonex/albums/classes/BxAlbumsMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_albums_menu_manage_tools', 'bx_albums', '_bx_albums_menu_set_title_manage_tools', 0);

--INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
--('bx_albums_menu_manage_tools', 'bx_albums', 'delete-with-content', '_bx_albums_menu_item_title_system_delete_with_content', '_bx_albums_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id});', '_self', 'far trash-alt', '', 128, 1, 0, 0);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'bx_albums', 'albums-administration', '_bx_albums_menu_item_title_system_admt_albums', '_bx_albums_menu_item_title_admt_albums', 'page.php?i=albums-administration', '', '_self', 'far image', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);

-- MENU: add menu item to profiles modules (trigger* menu sets are processed separately upon modules enable/disable)
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('trigger_profile_view_submenu', 'bx_albums', 'albums-author', '_bx_albums_menu_item_title_system_view_entries_author', '_bx_albums_menu_item_title_view_entries_author', 'page.php?i=albums-author&profile_id={profile_id}', '', '', 'far image', '', 2147483647, 1, 0, 0),
('trigger_group_view_submenu', 'bx_albums', 'albums-context', '_bx_albums_menu_item_title_system_view_entries_in_context', '_bx_albums_menu_item_title_view_entries_in_context', 'page.php?i=albums-context&profile_id={profile_id}', '', '', 'far image', '', 2147483647, 1, 0, 0);


-- PRIVACY 
INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('bx_albums_allow_view_to', 'bx_albums', 'view', '_bx_albums_form_entry_input_allow_view_to', '3', 'bx_albums_albums', 'id', 'author', '', ''),
('bx_albums_allow_view_favorite_list', 'bx_albums', 'view_favorite_list', '_bx_albums_form_entry_input_allow_view_favorite_list', '3', 'bx_albums_favorites_lists', 'id', 'author_id', '', '');


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_albums', 'create entry', NULL, '_bx_albums_acl_action_create_entry', '', 1, 3);
SET @iIdActionEntryCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_albums', 'delete entry', NULL, '_bx_albums_acl_action_delete_entry', '', 1, 3);
SET @iIdActionEntryDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_albums', 'view entry', NULL, '_bx_albums_acl_action_view_entry', '', 1, 0);
SET @iIdActionEntryView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_albums', 'set thumb', NULL, '_bx_albums_acl_action_set_thumb', '', 1, 3);
SET @iIdActionSetThumb = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_albums', 'edit any entry', NULL, '_bx_albums_acl_action_edit_any_entry', '', 1, 3);
SET @iIdActionEntryEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_albums', 'delete any entry', NULL, '_bx_albums_acl_action_delete_any_entry', '', 1, 3);
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
INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `GlobalSearch`, `ClassName`, `ClassPath`) VALUES
('bx_albums', '_bx_albums', @iSearchOrder + 1, 1, 'BxAlbumsSearchResult', 'modules/boonex/albums/classes/BxAlbumsSearchResult.php'),
('bx_albums_cmts', '_bx_albums_cmts', @iSearchOrder + 2, 1, 'BxAlbumsCmtsSearchResult', 'modules/boonex/albums/classes/BxAlbumsCmtsSearchResult.php'),
('bx_albums_media', '_bx_albums_media', @iSearchOrder + 3, 1, 'BxAlbumsSearchResultMedia', 'modules/boonex/albums/classes/BxAlbumsSearchResultMedia.php'),
('bx_albums_media_cmts', '_bx_albums_media_cmts', @iSearchOrder + 4, 1, 'BxAlbumsCmtsSearchResultMedia', 'modules/boonex/albums/classes/BxAlbumsCmtsSearchResultMedia.php'),
('bx_albums_media_camera', '_bx_albums_media', @iSearchOrder + 5, 0, 'BxAlbumsSearchResultMediaCamera', 'modules/boonex/albums/classes/BxAlbumsSearchResultMediaCamera.php');


-- METATAGS
INSERT INTO `sys_objects_metatags` (`object`, `module`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('bx_albums', 'bx_albums', 'bx_albums_meta_keywords', 'bx_albums_meta_locations', 'bx_albums_meta_mentions', '', ''),
('bx_albums_media', 'bx_albums', 'bx_albums_meta_keywords_media', '', '', '', ''),
('bx_albums_media_camera', 'bx_albums', 'bx_albums_meta_keywords_media_camera', '', '', '', '');


-- STATS
SET @iMaxOrderStats = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_statistics`);
INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES 
('bx_albums', 'bx_albums', '_bx_albums', 'page.php?i=albums-home', 'far image', 'SELECT COUNT(*) FROM `bx_albums_albums` WHERE 1 AND `status` = ''active'' AND `status_admin` = ''active''', @iMaxOrderStats + 1),
('bx_albums', 'bx_albums_media', '_bx_albums_media', '', 'far image', 'SELECT COUNT(*) FROM `bx_albums_files` WHERE 1', @iMaxOrderStats + 2);


-- CHARTS
SET @iMaxOrderCharts = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_objects_chart`);
INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('bx_albums_growth', '_bx_albums_chart_growth', 'bx_albums_albums', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 1, 'BxDolChartGrowth', ''),
('bx_albums_growth_speed', '_bx_albums_chart_growth_speed', 'bx_albums_albums', 'added', '', 'status,status_admin', '', 1, @iMaxOrderCharts + 2, 'BxDolChartGrowthSpeed', ''),
('bx_albums_growth_media', '_bx_albums_chart_growth_media', 'bx_albums_files', 'added', '', '', '', 1, @iMaxOrderCharts + 3, 'BxDolChartGrowth', ''),
('bx_albums_growth_speed_media', '_bx_albums_chart_growth_speed_media', 'bx_albums_files', 'added', '', '', '', 1, @iMaxOrderCharts + 4, 'BxDolChartGrowthSpeed', '');


-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_albums_administration', 'Sql', 'SELECT * FROM `bx_albums_albums` WHERE 1 ', 'bx_albums_albums', 'id', 'added', 'status_admin', '', 20, NULL, 'start', '', 'title,text', '', 'like', 'reports', '', 192, 'BxAlbumsGridAdministration', 'modules/boonex/albums/classes/BxAlbumsGridAdministration.php'),
('bx_albums_common', 'Sql', 'SELECT * FROM `bx_albums_albums` WHERE 1 ', 'bx_albums_albums', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'title,text', '', 'like', '', '', 2147483647, 'BxAlbumsGridCommon', 'modules/boonex/albums/classes/BxAlbumsGridCommon.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_albums_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_albums_administration', 'switcher', '_bx_albums_grid_column_title_adm_active', '8%', 0, '', '', 2),
('bx_albums_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '', '', 3),
('bx_albums_administration', 'title', '_bx_albums_grid_column_title_adm_title', '25%', 0, '', '', 4),
('bx_albums_administration', 'added', '_bx_albums_grid_column_title_adm_added', '20%', 1, '25', '', 5),
('bx_albums_administration', 'author', '_bx_albums_grid_column_title_adm_author', '20%', 0, '25', '', 6),
('bx_albums_administration', 'actions', '', '20%', 0, '', '', 7),

('bx_albums_common', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_albums_common', 'switcher', '', '8%', 0, '', '', 2),
('bx_albums_common', 'title', '_bx_albums_grid_column_title_adm_title', '40%', 0, '', '', 3),
('bx_albums_common', 'added', '_bx_albums_grid_column_title_adm_added', '15%', 1, '25', '', 4),
('bx_albums_common', 'status_admin', '_bx_albums_grid_column_title_adm_status_admin', '15%', 0, '16', '', 5),
('bx_albums_common', 'actions', '', '20%', 0, '', '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_albums_administration', 'bulk', 'delete', '_bx_albums_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_albums_administration', 'bulk', 'clear_reports', '_bx_albums_grid_action_title_adm_clear_reports', '', 0, 1, 2),
('bx_albums_administration', 'single', 'edit', '_bx_albums_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_albums_administration', 'single', 'delete', '_bx_albums_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_albums_administration', 'single', 'settings', '_bx_albums_grid_action_title_adm_more_actions', 'cog', 1, 0, 3),
('bx_albums_administration', 'single', 'audit_content', '_bx_albums_grid_action_title_adm_audit_content', 'search', 1, 0, 4),
('bx_albums_administration', 'single', 'clear_reports', '_bx_albums_grid_action_title_adm_clear_reports', 'eraser', 1, 0, 5),
('bx_albums_common', 'bulk', 'delete', '_bx_albums_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_albums_common', 'single', 'edit', '_bx_albums_grid_action_title_adm_edit', 'pencil-alt', 1, 0, 1),
('bx_albums_common', 'single', 'delete', '_bx_albums_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_albums_common', 'single', 'settings', '_bx_albums_grid_action_title_adm_more_actions', 'cog', 1, 0, 3);


-- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_albums_html5', 1, 'BxAlbumsUploaderHTML5', 'modules/boonex/albums/classes/BxAlbumsUploaderHTML5.php'),
('bx_albums_record_video', 1, 'BxAlbumsUploaderRecordVideo', 'modules/boonex/albums/classes/BxAlbumsUploaderRecordVideo.php'),
('bx_albums_crop', 1, 'BxAlbumsUploaderCrop', 'modules/boonex/albums/classes/BxAlbumsUploaderCrop.php');


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_albums', 'BxAlbumsAlertsResponse', 'modules/boonex/albums/classes/BxAlbumsAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler),
('profile', 'delete', @iHandler),

('bx_albums_files', 'file_deleted', @iHandler),
('bx_albums_video_mp4', 'transcoded', @iHandler);

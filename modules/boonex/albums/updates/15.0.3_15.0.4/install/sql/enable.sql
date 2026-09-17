-- PAGES
DELETE FROM `sys_objects_page` WHERE `object`='bx_albums_edit_media';
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_edit_media', '_bx_albums_page_title_sys_edit_media', '_bx_albums_page_title_edit_media', 'bx_albums', 5, 2147483647, 1, 'edit-media', '', '', '', '', 0, 1, 0, 'BxAlbumsPageMedia', 'modules/boonex/albums/classes/BxAlbumsPageMedia.php');

DELETE FROM `sys_pages_blocks` WHERE `object`='bx_albums_edit_media';
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_edit_media', 1, 'bx_albums', '_bx_albums_page_block_title_edit_media', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:10:"media_edit";}', 0, 0, 0);

DELETE FROM `sys_objects_page` WHERE `object`='bx_albums_move_media';
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_move_media', '_bx_albums_page_title_sys_move_media', '_bx_albums_page_title_move_media', 'bx_albums', 5, 2147483647, 1, 'move-media', '', '', '', '', 0, 1, 0, 'BxAlbumsPageMedia', 'modules/boonex/albums/classes/BxAlbumsPageMedia.php');

DELETE FROM `sys_pages_blocks` WHERE `object`='bx_albums_move_media';
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_move_media', 1, 'bx_albums', '_bx_albums_page_block_title_move_media', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:10:"media_move";}', 0, 0, 0);

DELETE FROM `sys_objects_page` WHERE `object`='bx_albums_delete_media';
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_albums_delete_media', '_bx_albums_page_title_sys_delete_media', '_bx_albums_page_title_delete_media', 'bx_albums', 5, 2147483647, 1, 'delete-media', '', '', '', '', 0, 1, 0, 'BxAlbumsPageMedia', 'modules/boonex/albums/classes/BxAlbumsPageMedia.php');

DELETE FROM `sys_pages_blocks` WHERE `object`='bx_albums_delete_media';
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_albums_delete_media', 1, 'bx_albums', '_bx_albums_page_block_title_delete_media', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:9:"bx_albums";s:6:"method";s:12:"media_delete";}', 0, 0, 0);

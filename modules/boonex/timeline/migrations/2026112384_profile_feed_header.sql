-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- A profile's feed has a title, with its menu in the block's header rather than floating above the posts.
UPDATE `sys_pages_blocks` SET `designbox_id` = 14 WHERE `module` = 'bx_timeline' AND `title` = '_bx_timeline_page_block_title_view_profile' AND `object` <> 'bx_timeline_view' AND `designbox_id` = 0;

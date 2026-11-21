-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The home page shows one empty state: the categories block hides while there are no categories.
UPDATE `sys_pages_blocks` SET `content` = REPLACE(`content`, 'show_empty";b:1;', 'show_empty";b:0;') WHERE `object` = 'bx_videos_home' AND `title` = '_bx_videos_page_block_title_cats' AND `content` LIKE '%categories_list%' AND `content` LIKE '%show_empty";b:1;%';

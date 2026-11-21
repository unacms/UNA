-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The home page shows one empty state: Popular discussions hides while there are none.
UPDATE `sys_pages_blocks` SET `content` = 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:14:"browse_popular";s:6:"params";a:2:{i:0;s:8:"extended";i:1;b:0;}}' WHERE `object` = 'bx_forum_home' AND `title` = '_bx_forum_page_block_title_popular_entries' AND `content` = 'a:3:{s:6:"module";s:8:"bx_forum";s:6:"method";s:14:"browse_popular";s:6:"params";a:1:{i:0;s:8:"extended";}}';

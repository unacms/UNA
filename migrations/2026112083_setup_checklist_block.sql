-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The "Set up your site" checklist for operators becomes a block of the home page (sys_home), on the site and in the apps.
-- sys_pages_blocks has no unique key on these columns, so the block is added only when the page has none of it.
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'sys_home', 1, 'system', '_sys_page_block_title_system_setup', '_sys_page_block_title_setup', 11, 0, 0, 2147483646, 'service', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_block_setup";s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_system_setup');

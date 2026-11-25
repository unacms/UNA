-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Explore, the apps' search page: the search window on top (system:get_block_search_window), for the site and the
-- apps. The page's other blocks show until a search is typed; the search's results stand in their place then.
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'sys_explore', 1, 'system', '_sys_page_block_title_system_search_window', '', 13, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:23:"get_block_search_window";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServicesSearch";}', 0, 1, 1, 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_explore' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_system_search_window');

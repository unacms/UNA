-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Explore lists the latest public photos of the module on the site and in the apps, rather than repeating the home cover.
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = 'sys_explore' AND `cell_id` = 1 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`)
SELECT 'sys_explore', 1, 'bx_photos', '', '_bx_photos_page_block_title_recent_entries', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:9:"bx_photos";s:6:"method";s:13:"browse_public";s:6:"params";a:2:{i:0;b:0;i:1;b:0;}}', 0, 1, 1, IFNULL(@iBlockOrder, 0) + 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_explore' AND `module` = 'bx_photos' AND `title` = '_bx_photos_page_block_title_recent_entries');
UPDATE `sys_pages_blocks` SET `active_api` = 1, `config_api` = '{"content_type":"browse_simple","header_more_url":"/photos-home","view":"row"}' WHERE `object` = 'sys_explore' AND `module` = 'bx_photos' AND `title` = '_bx_photos_page_block_title_recent_entries' AND `config_api` = '';

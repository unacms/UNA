-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Search page as on the apps: the search form in a left column, the results beside it (layout bar_left, as People's
-- search). Only while the page still has its shipped layout, so an operator's own arrangement stays.
UPDATE `sys_pages_blocks` AS `b` INNER JOIN `sys_objects_page` AS `p` ON `p`.`object` = `b`.`object`
SET `b`.`cell_id` = 1
WHERE `p`.`object` = 'bx_albums_search' AND `p`.`layout_id` = 11 AND `b`.`module` = 'bx_albums' AND `b`.`title` IN ('_bx_albums_page_block_title_search_form', '_bx_albums_page_block_title_search_form_media', '_bx_albums_page_block_title_search_form_cmts', '_bx_albums_page_block_title_search_form_media_cmts');
UPDATE `sys_pages_blocks` AS `b` INNER JOIN `sys_objects_page` AS `p` ON `p`.`object` = `b`.`object`
SET `b`.`cell_id` = 2
WHERE `p`.`object` = 'bx_albums_search' AND `p`.`layout_id` = 11 AND `b`.`module` = 'bx_albums' AND `b`.`title` IN ('_bx_albums_page_block_title_search_results', '_bx_albums_page_block_title_search_results_media', '_bx_albums_page_block_title_search_results_cmts', '_bx_albums_page_block_title_search_results_media_cmts');
UPDATE `sys_pages_blocks` AS `b` INNER JOIN `sys_objects_page` AS `p` ON `p`.`object` = `b`.`object`
SET `b`.`order` = CASE `b`.`title` WHEN '_bx_albums_page_block_title_search_form_media' THEN 2 WHEN '_bx_albums_page_block_title_search_form_cmts' THEN 3 ELSE 4 END
WHERE `p`.`object` = 'bx_albums_search' AND `p`.`layout_id` = 11 AND `b`.`module` = 'bx_albums' AND `b`.`title` IN ('_bx_albums_page_block_title_search_form_media', '_bx_albums_page_block_title_search_form_cmts', '_bx_albums_page_block_title_search_form_media_cmts');
UPDATE `sys_objects_page` SET `layout_id` = 1 WHERE `object` = 'bx_albums_search' AND `layout_id` = 11;

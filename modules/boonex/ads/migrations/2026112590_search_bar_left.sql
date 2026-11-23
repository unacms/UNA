-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Search page as on the apps: the search form in a left column, the results beside it (layout bar_left, as People's
-- search). Only while the page still has its shipped layout, so an operator's own arrangement stays: a page
-- that also holds other blocks (one in a cell layout 1 does not have would vanish) keeps its layout.
SET @bShipped = (SELECT COUNT(*) FROM `sys_pages_blocks` WHERE `object` = 'bx_ads_search' AND NOT (`module` = 'bx_ads' AND `title` IN ('_bx_ads_page_block_title_search_form', '_bx_ads_page_block_title_search_form_cmts', '_bx_ads_page_block_title_search_results', '_bx_ads_page_block_title_search_results_cmts'))) = 0;
UPDATE `sys_pages_blocks` AS `b` INNER JOIN `sys_objects_page` AS `p` ON `p`.`object` = `b`.`object`
SET `b`.`cell_id` = 1
WHERE `p`.`object` = 'bx_ads_search' AND `p`.`layout_id` = 5 AND @bShipped AND `b`.`module` = 'bx_ads' AND `b`.`title` IN ('_bx_ads_page_block_title_search_form', '_bx_ads_page_block_title_search_form_cmts');
UPDATE `sys_pages_blocks` AS `b` INNER JOIN `sys_objects_page` AS `p` ON `p`.`object` = `b`.`object`
SET `b`.`cell_id` = 2
WHERE `p`.`object` = 'bx_ads_search' AND `p`.`layout_id` = 5 AND @bShipped AND `b`.`module` = 'bx_ads' AND `b`.`title` IN ('_bx_ads_page_block_title_search_results', '_bx_ads_page_block_title_search_results_cmts');
UPDATE `sys_objects_page` SET `layout_id` = 1 WHERE `object` = 'bx_ads_search' AND `layout_id` = 5 AND @bShipped;

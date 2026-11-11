-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Groups' Search Results block had an app config that is not JSON (an old navigator layout in JS
-- syntax): the apps got it as a string and drew a blank Search tab. The other search pages have none.
UPDATE `sys_pages_blocks` SET `config_api`='' WHERE `object`='bx_groups_search' AND `module`='bx_groups' AND `title_system`='' AND `title`='_bx_groups_page_block_title_search_results' AND `config_api` LIKE '%layout: \'navigator\'%';

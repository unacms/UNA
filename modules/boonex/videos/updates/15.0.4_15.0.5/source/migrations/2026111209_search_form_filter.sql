-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- The search form drives the Search tab's results in the apps (a filter, as People's does).
UPDATE `sys_pages_blocks` SET `config_api`='{"use_as_filter":true}' WHERE `object`='bx_videos_search' AND `module`='bx_videos' AND `title_system`='' AND `title`='_bx_videos_page_block_title_search_form' AND (`config_api` IS NULL OR `config_api`='');

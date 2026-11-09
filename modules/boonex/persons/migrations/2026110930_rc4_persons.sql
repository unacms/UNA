-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable.sql of the update pack
-- PAGES & BLOCKS
UPDATE `sys_objects_page` SET `layout_id`='1' WHERE `object`='bx_persons_search';

UPDATE `sys_pages_blocks` SET `cell_id`='2', `order`='1', `content`='a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:10:"bx_persons";}}s:5:"class";s:27:"TemplSearchExtendedServices";}' WHERE `object`='bx_persons_search' AND `module`='bx_persons' AND `title`='_bx_persons_page_block_title_search_results';
UPDATE `sys_pages_blocks` SET `order`='2' WHERE `object`='bx_persons_search' AND `module`='bx_persons' AND `title`='_bx_persons_page_block_title_search_form_cmts';
UPDATE `sys_pages_blocks` SET `cell_id`='2', `order`='2', `content`='a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_results";s:6:"params";a:1:{i:0;a:1:{s:6:"object";s:15:"bx_persons_cmts";}}s:5:"class";s:27:"TemplSearchExtendedServices";}' WHERE `object`='bx_persons_search' AND `module`='bx_persons' AND `title`='_bx_persons_page_block_title_search_results_cmts';

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_pages_blocks` SET `config_api`='{"use_as_filter":true}' WHERE `object`='bx_persons_search' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_search_form';
UPDATE `sys_pages_blocks` SET `active_api`=0 WHERE `object`='bx_persons_home' AND `module`='bx_persons' AND `title_system`='' AND `title`='_bx_persons_page_block_title_featured_profiles';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_persons' AND `name`='persons-home';

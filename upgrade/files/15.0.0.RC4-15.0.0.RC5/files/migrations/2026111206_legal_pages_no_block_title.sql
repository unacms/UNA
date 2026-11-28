-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- About, Terms and Privacy: the main content block has no title of its own, the page title is enough.
UPDATE `sys_pages_blocks` SET `designbox_id`=13 WHERE `object`='sys_about' AND `module`='system' AND `title`='_sys_page_block_title_about' AND `designbox_id`=11;
UPDATE `sys_pages_blocks` SET `designbox_id`=13 WHERE `object`='sys_terms' AND `module`='system' AND `title`='_sys_page_block_title_terms' AND `designbox_id`=11;
UPDATE `sys_pages_blocks` SET `designbox_id`=13 WHERE `object`='sys_privacy' AND `module`='system' AND `title`='_sys_page_block_title_privacy' AND `designbox_id`=11;

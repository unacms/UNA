-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The sign-in and join blocks get an icon and a line under the title, where an operator set none.
UPDATE `sys_pages_blocks` SET `icon`='log-in' WHERE `object`='sys_login' AND `module`='system' AND `title`='_sys_page_block_title_login' AND `icon`='';
UPDATE `sys_pages_blocks` SET `description`='_sys_page_block_desc_login' WHERE `object`='sys_login' AND `module`='system' AND `title`='_sys_page_block_title_login' AND `description`='';
UPDATE `sys_pages_blocks` SET `icon`='user-plus' WHERE `object`='sys_create_account' AND `module`='system' AND `title`='_sys_page_block_title_create_account' AND `icon`='';
UPDATE `sys_pages_blocks` SET `description`='_sys_page_block_desc_create_account' WHERE `object`='sys_create_account' AND `module`='system' AND `title`='_sys_page_block_title_create_account' AND `description`='';

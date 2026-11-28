-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The sign-in and join blocks (on their pages and on the home page) get a title icon and a line under the title, where an operator set none.
UPDATE `sys_pages_blocks` SET `icon`='user-round-key' WHERE `object` IN ('sys_login', 'sys_home') AND `module`='system' AND `title`='_sys_page_block_title_login' AND `icon`='';
UPDATE `sys_pages_blocks` SET `description`='_sys_page_block_desc_login' WHERE `object` IN ('sys_login', 'sys_home') AND `module`='system' AND `title`='_sys_page_block_title_login' AND `description`='';
UPDATE `sys_pages_blocks` SET `icon`='user-plus' WHERE `object` IN ('sys_create_account', 'sys_home') AND `module`='system' AND `title`='_sys_page_block_title_create_account' AND `icon`='';
UPDATE `sys_pages_blocks` SET `description`='_sys_page_block_desc_create_account' WHERE `object` IN ('sys_create_account', 'sys_home') AND `module`='system' AND `title`='_sys_page_block_title_create_account' AND `description`='';

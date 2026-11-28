-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The OAuth2 consent page gets the narrow layout of the sign-in pages, and its block a title icon and a line under the title, where an operator set none.
UPDATE `sys_objects_page` SET `layout_id`=18 WHERE `object`='bx_oauth_authorization' AND `layout_id`=5;
UPDATE `sys_pages_blocks` SET `icon`='key-round' WHERE `object`='bx_oauth_authorization' AND `module`='bx_oauth' AND `title`='_bx_oauth_authorization' AND `icon`='';
UPDATE `sys_pages_blocks` SET `description`='_bx_oauth_authorization_desc' WHERE `object`='bx_oauth_authorization' AND `module`='bx_oauth' AND `title`='_bx_oauth_authorization' AND `description`='';

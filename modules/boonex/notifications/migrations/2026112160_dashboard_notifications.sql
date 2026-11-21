-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Dashboard: the notifications block is on, in the left column under "Get started" and "Create your profile", and in the apps.
UPDATE `sys_pages_blocks` SET `cell_id` = 2, `order` = 3, `active` = 1 WHERE `object` = 'sys_dashboard' AND `module` = 'bx_notifications' AND `title` = '_bx_ntfs_page_block_title_view' AND `cell_id` = 3 AND `active` = 0;
UPDATE `sys_pages_blocks` SET `active_api` = 1 WHERE `object` = 'sys_dashboard' AND `module` = 'bx_notifications' AND `title_system` = '' AND `title` = '_bx_ntfs_page_block_title_view';

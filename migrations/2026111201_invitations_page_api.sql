-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- The Activity tab's Invitations page block, for the apps (only the home page's copy was on).
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_ntfs_context_invitations' AND `module`='system' AND `title`='_sys_page_block_title_ntfs_context_invitations' AND `active_api`=0;

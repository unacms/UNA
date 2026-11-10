-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Invites: the invite by email form is shown in the apps, NEO opens it from the invite block.
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_invites_invite' AND `module`='bx_invites' AND `title`='_bx_invites_page_block_title_invite_form' AND `active_api`=0;

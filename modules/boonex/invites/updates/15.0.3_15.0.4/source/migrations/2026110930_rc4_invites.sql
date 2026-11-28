-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_invites_request' AND `module`='bx_invites' AND `title_system`='' AND `title`='_bx_invites_page_block_title_request_form';

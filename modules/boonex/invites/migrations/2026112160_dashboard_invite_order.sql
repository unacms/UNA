-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Dashboard: "Invite" comes after "Your membership" and "Your profiles" in the right column.
UPDATE `sys_pages_blocks` SET `order` = 3 WHERE `object` = 'sys_dashboard' AND `module` = 'bx_invites' AND `title` = '_bx_invites_page_block_title_invite' AND `cell_id` = 3 AND `order` = 2;

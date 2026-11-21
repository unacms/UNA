-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- A profile's membership level (the block and the item under the name) is for members, not guests.
UPDATE `sys_pages_blocks` SET `visible_for_levels` = 2147483646 WHERE `object` = 'bx_organizations_view_profile' AND `module` = 'bx_organizations' AND `title` = '_bx_orgs_page_block_title_profile_membership' AND `visible_for_levels` = 2147483647;
UPDATE `sys_menu_items` SET `visible_for_levels` = 2147483646 WHERE `set_name` = 'bx_organizations_view_meta' AND `module` = 'bx_organizations' AND `name` = 'membership' AND `visible_for_levels` = 2147483647;

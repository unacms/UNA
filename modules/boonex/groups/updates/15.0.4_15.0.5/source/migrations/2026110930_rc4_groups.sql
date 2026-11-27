-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_pages_blocks` SET `active_api`=0 WHERE `object`='bx_groups_home' AND `module`='bx_groups' AND `title_system`='' AND `title`='_bx_groups_page_block_title_featured_profiles';

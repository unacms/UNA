-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_pages_blocks` SET `active_api`=0 WHERE `object`='bx_files_home' AND `module`='bx_files' AND `title_system`='' AND `title`='_bx_files_page_block_title_featured_entries_view_extended';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_files' AND `name`='files-home';

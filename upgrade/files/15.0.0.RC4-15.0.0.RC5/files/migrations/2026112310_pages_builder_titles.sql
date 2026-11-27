-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Pages: the Homepage's apps-only Profile menu (cell 2) gets its own name in Studio, so it is not a second
-- "Profile menu" beside the one in the page's inactive blocks.
UPDATE `sys_pages_blocks` SET `title_system` = '_sys_page_block_title_system_profile_menu_apps'
WHERE `object` = 'sys_home' AND `cell_id` = 2 AND `module` = 'system' AND `title_system` = '' AND `title` = '_sys_page_block_title_profile_menu';

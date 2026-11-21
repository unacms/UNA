-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Pages: Artificer's Homepage splash gets its own name in Studio, so it is not a second "Splash" beside the system one.
UPDATE `sys_pages_blocks` SET `title_system` = '_bx_artificer_page_block_title_system_splash'
WHERE `object` = 'sys_home' AND `module` = 'bx_artificer' AND `title_system` = '' AND `title` = '_bx_artificer_page_block_title_splash';

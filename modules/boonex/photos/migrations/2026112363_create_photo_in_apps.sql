-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The apps' create menu lists New photo, as the site's does.
UPDATE `sys_menu_items` SET `active_api` = 1 WHERE `set_name` = 'sys_add_content_links' AND `module` = 'bx_photos' AND `name` = 'create-photo' AND `active_api` = 0;

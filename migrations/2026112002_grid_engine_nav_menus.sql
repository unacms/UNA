-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Grids: the Studio navigation menus grid renders with AG Grid.
-- Left alone once an admin has set another engine.

UPDATE `sys_objects_grid` SET `engine` = 'ag' WHERE `object` = 'sys_studio_nav_menus' AND `engine` = '';

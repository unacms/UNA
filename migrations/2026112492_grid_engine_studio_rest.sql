-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Grids: the last Studio grids are drawn by AG Grid too (permissions' and roles' actions, navigation's import), now that it
-- sends a switch's own id. Left alone once an admin has set another engine.

UPDATE `sys_objects_grid` SET `engine` = 'ag' WHERE `object` IN ('sys_studio_acl_actions', 'sys_studio_roles_actions', 'sys_studio_nav_import') AND `engine` = '';

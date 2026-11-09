-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable.sql changes since RC3: visibility of the apps and authorizations grids
UPDATE `sys_objects_grid` SET `visible_for_levels`=2147483646 WHERE `object` IN ('bx_github_apps', 'bx_github_authorizations') AND `visible_for_levels`=2147483647;

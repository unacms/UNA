-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The home menu in the apps lists the module as the site menu does.
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage' AND `module`='bx_files' AND `name`='files-home' AND `active_api`=0;

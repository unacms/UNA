-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_menu_items` SET `config_api`='{"group":"profile"}' WHERE `set_name`='sys_account_settings' AND `module`='bx_acl' AND `name`='acl-view';

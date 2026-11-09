-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_glossary' AND `name`='glossary-home';

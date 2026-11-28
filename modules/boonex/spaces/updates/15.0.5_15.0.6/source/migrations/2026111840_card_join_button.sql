-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- A space's card on the site has the two buttons the apps' card has: Join and Follow. Join was on for the apps
-- only.
UPDATE `sys_menu_items` SET `active`=1 WHERE `set_name`='bx_spaces_snippet_meta' AND `module`='bx_spaces' AND `name`='join' AND `active`=0;

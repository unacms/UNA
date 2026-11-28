-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- A group's card on the site has the two buttons the apps' card has: Join and Follow. Follow (subscribe) was on
-- for the apps only.
UPDATE `sys_menu_items` SET `active`=1 WHERE `set_name`='bx_groups_snippet_meta' AND `module`='bx_groups' AND `name`='subscribe' AND `active`=0;

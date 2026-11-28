-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- An event's card on the site has the two buttons the apps' card has: Attend and Follow. Follow (subscribe) was on
-- for the apps only.
UPDATE `sys_menu_items` SET `active`=1 WHERE `set_name`='bx_events_snippet_meta' AND `module`='bx_events' AND `name`='subscribe' AND `active`=0;

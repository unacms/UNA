-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Guests don't see the Joined and Following tabs, which can't apply to them.
UPDATE `sys_menu_items` SET `visible_for_levels` = 2147483646 WHERE `set_name` = 'bx_events_submenu' AND `module` = 'bx_events' AND `name` IN ('events-joined', 'events-followed') AND `visible_for_levels` = 2147483647;

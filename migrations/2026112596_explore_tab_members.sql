-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Explore, the apps' search page, is a tab for members too, second after Home (the tab bar's More takes what doesn't
-- fit). Only where the tab is still for guests only, as installed.
UPDATE `sys_menu_items` SET `visible_for_levels` = 2147483647 WHERE `set_name` = 'sys_tabbar' AND `module` = 'system' AND `name` = 'explore' AND `visible_for_levels` = 1;

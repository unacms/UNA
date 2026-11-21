-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Guests see the splash first. The home page's grid of links, which repeated the header menu, is off on the site and
-- in the apps, and Explore no longer repeats the home cover: it lists the latest public content (the modules'
-- 2026112383_explore_block migrations).
UPDATE `sys_pages_blocks` SET `active` = 0, `active_api` = 0 WHERE `object` = 'sys_home' AND `module` = 'system' AND `type` = 'menu' AND `content` = 'sys_homepage' AND `visible_for_levels` = 1;
UPDATE `sys_objects_page` SET `override_class_name` = '' WHERE `object` = 'sys_explore' AND `override_class_name` = 'BxTemplPageHome';

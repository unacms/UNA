-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The module's own add icon, on its add button (a section's + on the site and in the apps) and its create item: it was
-- the plus of the site's Add menu. Only where the item still has the plus, so an operator's own icon stays.
UPDATE `sys_menu_items` SET `icon` = 'clapperboard' WHERE `set_name` = 'bx_videos_my' AND `module` = 'bx_videos' AND `link` = 'page.php?i=create-video' AND `icon` = 'plus';

-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Pages: section cover and title settings that a section's pages take where they are NULL ("Same as section" in
-- Studio > Pages > page > Cover, Title). A section is the submenu of a main menu item, its tabs (People: Home, Active,
-- Online, Search, Manage). 2026112498_page_sections_seed.php fills it from the pages' current values.
CREATE TABLE IF NOT EXISTS `sys_pages_sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL DEFAULT '',
  `cover` tinyint(4) NOT NULL DEFAULT '1',
  `cover_image` int(11) NOT NULL DEFAULT '0',
  `cover_hidden_on` varchar(255) NOT NULL DEFAULT '',
  `title_show` tinyint(4) DEFAULT NULL,
  `title_hidden_on` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

-- NULL, now the default, is "Same as section": the pages modules add from now on take their section's settings, and
-- a page outside any section gets what it got before (cover on for everyone, no picture of its own, hidden nowhere).
ALTER TABLE `sys_objects_page` MODIFY `cover` tinyint(4) DEFAULT NULL;
ALTER TABLE `sys_objects_page` MODIFY `cover_image` int(11) DEFAULT NULL;
ALTER TABLE `sys_objects_page` MODIFY `cover_hidden_on` varchar(255) DEFAULT NULL;

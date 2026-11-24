-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- One search window: a section's Search can be turned off (Studio > Pages > a page > Edit section settings >
-- Search in this section); on by default, as a section without a row.
ALTER TABLE `sys_pages_sections` ADD COLUMN IF NOT EXISTS `search` tinyint(4) NOT NULL DEFAULT '1' AFTER `title_hidden_on`;

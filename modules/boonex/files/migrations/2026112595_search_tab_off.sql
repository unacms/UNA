-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- One search window: a section's Search (its title row, the search window with the section's scope) replaces the
-- section's "Search" tab. The tab's page stays (its URL, blocks and services) for projects that use it; the tab is off
-- on the site and in the apps where it is still as installed.
UPDATE `sys_menu_items` SET `active` = 0 WHERE `set_name` = 'bx_files_submenu' AND `module` = 'bx_files' AND `name` = 'files-search' AND `active` = 1;
UPDATE `sys_menu_items` SET `active_api` = 0 WHERE `set_name` = 'bx_files_submenu' AND `module` = 'bx_files' AND `name` = 'files-search' AND `active_api` = 1;

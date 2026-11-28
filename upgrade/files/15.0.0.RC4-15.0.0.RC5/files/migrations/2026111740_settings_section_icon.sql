-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The account's settings get a section icon in the apps (the gear: Lucide `settings`, as the account menu's Settings item is drawn), named in the
-- settings menu's app config next to the section's own page. A config a site has changed is left as it is.
UPDATE `sys_objects_menu` SET `config_api` = '{"hub":"settings","icon":"settings"}' WHERE `object` = 'sys_account_settings_submenu' AND `config_api` = '{"hub":"settings"}';

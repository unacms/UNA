-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Connectors in the apps (NEO): the page block and the account settings menu item, as enable-app-pages.sql and
-- enable-app-menus.sql set them. Only while they are off as added, so an admin's own choice stays.
UPDATE `sys_pages_blocks` SET `active_api` = 1 WHERE `object` = 'sys_account_settings_connectors' AND `module` = 'system' AND `title_system` = '' AND `title` = '_sys_page_block_title_account_settings_connectors' AND `active_api` = 0;
UPDATE `sys_menu_items` SET `active_api` = 1 WHERE `set_name` = 'sys_account_settings' AND `module` = 'system' AND `name` = 'account-settings-connectors' AND `active_api` = 0;

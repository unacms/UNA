-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The homepage tour is replaced by the setup checklist: the account menu's "Introduction Tour" item becomes
-- "Set up your site", which brings the checklist back (index.php?setup=1). Only a row still as installed is changed.
UPDATE `sys_menu_items` SET `title_system` = '_sys_menu_item_title_system_setup', `title` = '_sys_menu_item_title_setup', `link` = 'index.php?setup=1', `onclick` = '', `icon` = 'list-checks'
WHERE `set_name` = 'sys_account_notifications' AND `module` = 'system' AND `name` = 'tour' AND `title` = '_sys_menu_item_title_tour';

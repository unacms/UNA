-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Notifications: the bell with its count stays in the header on phones, and the account menu no longer repeats it.
UPDATE `sys_menu_items` SET `hidden_on` = 8 WHERE `set_name` = 'sys_toolbar_member' AND `module` = 'bx_notifications' AND `name` = 'notifications-preview' AND `hidden_on` = 9;
UPDATE `sys_menu_items` SET `hidden_on` = 7 WHERE `set_name` = 'sys_account_notifications' AND `module` = 'bx_notifications' AND `name` = 'notifications-notifications' AND `hidden_on` = 6;

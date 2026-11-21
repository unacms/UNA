-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Account menu: Sign out last. Modules add their items after the highest order below 9999, which the tour (9997) and
-- sounds (9998) items took, so Friends, Relations, Notifications and Messenger came after Sign out (9999).
-- The tour, sounds and sign out items move far down, and the modules' items go back above them.
UPDATE `sys_menu_items` SET `order` = 99997 WHERE `set_name` = 'sys_account_notifications' AND `module` = 'system' AND `name` = 'tour' AND `order` = 9997;
UPDATE `sys_menu_items` SET `order` = 99998 WHERE `set_name` = 'sys_account_notifications' AND `module` = 'system' AND `name` = 'sounds' AND `order` = 9998;
UPDATE `sys_menu_items` SET `order` = 99999 WHERE `set_name` = 'sys_account_notifications' AND `module` = 'system' AND `name` = 'logout' AND `order` = 9999;
UPDATE `sys_menu_items` SET `order` = `order` - 9900 WHERE `set_name` = 'sys_account_notifications' AND `module` != 'system' AND `order` BETWEEN 9997 AND 10050;

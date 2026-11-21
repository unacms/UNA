-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Messenger: Message comes right after the friend action on a profile, so it stays a visible button on phones
-- instead of being the first action to go under More.
UPDATE `sys_menu_items` SET `order` = 12 WHERE `set_name` = 'trigger_profile_view_actions' AND `module` = 'bx_messenger' AND `name` = 'messenger' AND `order` = 0;
UPDATE `sys_menu_items` SET `order` = 12 WHERE `set_name` LIKE '%\_view\_actions' AND `set_name` != 'trigger_profile_view_actions' AND `module` = 'bx_messenger' AND `name` = 'messenger' AND `order` > 12;
UPDATE `sys_menu_items` SET `order` = 12 WHERE `set_name` LIKE '%\_view\_actions\_all' AND `module` = 'bx_messenger' AND `name` = 'messenger' AND `order` > 12;

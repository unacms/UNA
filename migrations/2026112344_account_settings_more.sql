-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Account settings: on a phone the tabs that don't fit go under More, as a profile's tabs do.
UPDATE `sys_objects_menu` SET `template_id` = 18, `override_class_name` = 'BxTemplMenuMoreAuto' WHERE `object` = 'sys_account_settings_submenu' AND `template_id` = 8 AND `override_class_name` = '';

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`)
SELECT 'sys_account_settings', 'system', 'more-auto', '_sys_menu_item_title_system_va_more_auto', '_sys_menu_item_title_va_more_auto', 'javascript:void(0)', '', '', '', '', 2147483646, '', 1, 0, 99999 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `name` = 'more-auto');

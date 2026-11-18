-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Account settings: the item moves under the current profile's section (the system's migration of this number adds
-- it), which replaces its group. An item that is already under a parent is left as it is.
SET @iMiAccountSettingsProfile = (SELECT `id` FROM `sys_menu_items` WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-section-profile' LIMIT 1);
UPDATE `sys_menu_items` SET `parent_id`=@iMiAccountSettingsProfile WHERE `set_name`='sys_account_settings' AND `module`='bx_notifications' AND `name`='notifications-settings' AND `parent_id`=0 AND @iMiAccountSettingsProfile IS NOT NULL;

-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Notifications: a member's notification settings are a toggle per row, without a second column of checkboxes
-- and the Activate / Deactivate buttons for them.
DELETE FROM `sys_grid_fields` WHERE `object` = 'bx_notifications_settings_common' AND `name` = 'checkbox';
DELETE FROM `sys_grid_actions` WHERE `object` = 'bx_notifications_settings_common' AND `type` = 'bulk' AND `name` IN ('activate', 'deactivate');
UPDATE `sys_grid_fields` SET `width` = '90%' WHERE `object` = 'bx_notifications_settings_common' AND `name` = 'title' AND `width` = '89%';

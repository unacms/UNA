-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Notification emails show the text of the message or post below the notification: up to 500 characters
-- instead of 200, unless the site changed the length.
UPDATE `sys_options` SET `value` = '500' WHERE `name` = 'bx_notifications_summary_chars' AND `value` = '200';

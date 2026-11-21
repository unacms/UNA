-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Events: date and time formats match the site's (Nov 21, 2026, 2:30 PM) instead of 21/11/2026 and 24-hour time.
-- Only sites that still have the old defaults change.
UPDATE `sys_options` SET `value` = 'g:i A' WHERE `name` = 'bx_events_time_format' AND `value` = 'H:i';
UPDATE `sys_options` SET `value` = 'M j, Y' WHERE `name` = 'bx_events_short_date_format' AND `value` = 'j/n/Y';
UPDATE `sys_options` SET `value` = 'M j, Y g:i A' WHERE `name` = 'bx_events_datetime_format' AND `value` = 'j/n/Y H:i';

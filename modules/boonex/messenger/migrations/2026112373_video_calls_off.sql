-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Messenger: video calls are off until the operator sets a Jitsi server of their own. Sites that
-- still have both old defaults (calls on, public meet.jit.si) get calls turned off; the server
-- stays filled in, so ticking "Video calls" brings them back.
UPDATE `sys_options` SET `value` = '' WHERE `name` = 'bx_messenger_jitsi_enable' AND `value` = 'on'
AND EXISTS (SELECT 1 FROM (SELECT `value` FROM `sys_options` WHERE `name` = 'bx_messenger_jitsi_server') AS `s` WHERE `s`.`value` = 'meet.jit.si');

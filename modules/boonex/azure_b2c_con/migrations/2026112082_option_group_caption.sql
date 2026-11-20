-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The group option's caption had no leading underscore, so Studio showed the raw key instead of its string.
UPDATE `sys_options` SET `caption` = '_bx_azrb2c_option_group' WHERE `name` = 'bx_azrb2c_group' AND `caption` = 'bx_azrb2c_option_group';

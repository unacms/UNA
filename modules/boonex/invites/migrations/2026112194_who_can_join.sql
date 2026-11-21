-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- "Enable registration by invitation only" is "Who can join" in Studio > Settings > Account now (sys_account_join,
-- which took this option's value in migrations/2026112194_who_can_join.sql).
DELETE FROM `sys_options_mixes2options` WHERE `option` = 'bx_invites_enable_reg_by_inv';
DELETE FROM `sys_options` WHERE `name` = 'bx_invites_enable_reg_by_inv';

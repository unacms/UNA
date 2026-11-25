-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Audit > Studio log: no Agent column (the Actor names the agent); the others share its width.

DELETE FROM `sys_grid_fields` WHERE `object` = 'sys_admin_log_administration' AND `name` = 'agent_id';

UPDATE `sys_grid_fields` SET `width` = '18%' WHERE `object` = 'sys_admin_log_administration' AND `name` = 'profile_id' AND `width` = '16%';
UPDATE `sys_grid_fields` SET `width` = '10%' WHERE `object` = 'sys_admin_log_administration' AND `name` = 'source' AND `width` = '12%';
UPDATE `sys_grid_fields` SET `width` = '18%' WHERE `object` = 'sys_admin_log_administration' AND `name` = 'object_type' AND `width` = '16%';
UPDATE `sys_grid_fields` SET `width` = '24%' WHERE `object` = 'sys_admin_log_administration' AND `name` = 'object_id' AND `width` = '14%';

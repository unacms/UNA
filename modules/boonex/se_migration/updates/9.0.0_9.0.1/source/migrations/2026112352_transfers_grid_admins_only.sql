-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The transfers grid is for admins only (it was visible to every level).
UPDATE `sys_objects_grid` SET `visible_for_levels` = 128 WHERE `object` = 'bx_se_migration_transfers' AND `visible_for_levels` = 2147483647;

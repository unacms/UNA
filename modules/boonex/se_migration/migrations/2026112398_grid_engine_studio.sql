-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Grids: the module's Studio grid is drawn by AG Grid. Left alone once an admin has set another engine.

UPDATE `sys_objects_grid` SET `engine` = 'ag' WHERE `object` = 'bx_se_migration_transfers' AND `engine` = '';

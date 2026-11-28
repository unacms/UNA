-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Transfers: the search looks in the module name (there is no `path` column), with LIKE, as the table has no
-- full-text index.
UPDATE `sys_objects_grid` SET `filter_fields` = 'module', `filter_mode` = 'like' WHERE `object` = 'bx_se_migration_transfers' AND `filter_fields` = 'path';

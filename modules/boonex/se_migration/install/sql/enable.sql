SET @sName = 'bx_se_migration';

-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules',  @sName, '_bx_se_migration_wgt_cpt', 'bx_se_migration@modules/boonex/se_migration/|std-mi.png', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId,  @sName, '_bx_se_migration_wgt_cpt', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('se_migration_version', 'engine4', @iCategId, '_bx_se_migration_option_version', 'select', '', '', 'engine4', 1),
('se_migration_salt', '', 0, '_bx_se_migration_salt', 'digit', '', '', '', 0);

-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxSEMigAlertsResponse', 'modules/boonex/se_migration/classes/BxSEMigAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'encrypt_password_after', @iHandler),
('account', 'edit', @iHandler);

-- GRIDS:
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_se_migration_transfers', 'Sql', 'SELECT `id`, `module`, `number`, `status`, `status_text`, '''' as `datatype`  FROM `bx_semig_transfers`', 'bx_semig_transfers', 'module', 'id', '', '', 0, '', 'start', '', 'path', '', 'auto', 'module', '', 2147483647, 'BxSEMigTransfers', 'modules/boonex/se_migration/classes/BxSEMigTransfers.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_se_migration_transfers', 'checkbox', '', '1%', 0, 0, '', 1),
('bx_se_migration_transfers', 'module', '_bx_se_migration_modules_name', '30%', 0, 0, '', 2),
('bx_se_migration_transfers', 'number', '_bx_se_migration_modules_records_number', '10%', 0, 0, '', 3),
('bx_se_migration_transfers', 'status_text', '_bx_se_migration_modules_status', '59%', 0, 0, '', 4),
('bx_se_migration_transfers_path', 'title', '_bx_se_migration_modules_path', '100%', 0, 0, '', 0);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_se_migration_transfers', 'bulk', 'run', '_bx_se_migration_start_transfer', '', 0, 1, 1);

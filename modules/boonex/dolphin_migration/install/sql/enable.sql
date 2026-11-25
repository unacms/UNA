SET @sName = 'bx_dolphin_migration';

-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules',  @sName, '_bx_dolphin_migration_wgt_cpt', 'bx_dolphin_migration@modules/boonex/bx_dolphin_migration/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId,  @sName, '_bx_dolphin_migration_wgt_cpt', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_dolphin_migration_salt', '', 0, '_bx_dolphin_migration_salt', 'digit', '', '', '', 1),
('bx_dolphin_migration_overwrite', '', @iCategId, '_bx_dolphin_migration_cpt_overwrite', 'checkbox', '', '', '', 2),
('bx_dolphin_migration_use_nickname', '', @iCategId, '_bx_dolphin_migration_cpt_use_nickname', 'checkbox', '', '', '', 3),
('bx_dolphin_migration_empty_albums', '', @iCategId, '_bx_dolphin_migration_cpt_empty_albums', 'checkbox', '', '', '', 4),
('bx_dolphin_migration_default_privacy', '3', @iCategId, '_bx_dolphin_migration_cpt_default_privacy', 'select', '', '', 'a:2:{s:6:"module";s:20:"bx_dolphin_migration";s:6:"method";s:18:"get_privacy_groups";}', 5),
('bx_dolphin_migration_media_modules', '', @iCategId, '_bx_dolphin_migration_cpt_media_modules', 'checkbox', '', '', '', 6);

-- GRIDS:
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_dolphin_migration_transfers', 'Sql', 'SELECT `id`, `module`, `number`, `status`, `status_text`, '''' as `datatype` FROM `bx_dolphin_transfers`', 'bx_dolphin_transfers', 'module', 'id', '', '', 0, '', 'start', '', 'module', '', 'like', 'module', '', 128, 'BxDolMTransfers', 'modules/boonex/dolphin_migration/classes/BxDolMTransfers.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_dolphin_migration_transfers', 'checkbox', '', '1%', 0, 0, '', 1),
('bx_dolphin_migration_transfers', 'module', '_bx_dolphin_migration_modules_name', '30%', 0, 0, '', 2),
('bx_dolphin_migration_transfers', 'number', '_bx_dolphin_migration_modules_records_number', '10%', 0, 0, '', 3),
('bx_dolphin_migration_transfers', 'status_text', '_bx_dolphin_migration_modules_status', '45%', 0, 0, '', 4),
('bx_dolphin_migration_transfers', 'actions', '', '14%', 0, 0, '', 5),
('bx_dolphin_migration_transfers_path', 'title', '_bx_dolphin_migration_modules_path', '100%', 0, 0, '', 0);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_dolphin_migration_transfers', 'bulk', 'run', '_bx_dolphin_migration_start_transfer', '', 0, 1, 1),
('bx_dolphin_migration_transfers', 'single', 'remove', '_bx_dolphin_migration_remove_content', 'trash', 1, 1, 2),
('bx_dolphin_migration_transfers', 'single', 'clean', '_bx_dolphin_migration_clean', 'eraser ', 1, 1, 1);

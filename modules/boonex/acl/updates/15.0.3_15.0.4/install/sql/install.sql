SET @sName = 'bx_acl';


-- GRIDS
UPDATE `sys_objects_grid` SET `source`='SELECT `tlp`.*, `tl`.`ID` AS `level_id`, `tl`.`Name` AS `level_name`, `tl`.`Icon` AS `level_icon` FROM `bx_acl_level_prices` AS `tlp` LEFT JOIN `sys_acl_levels` AS `tl` ON `tlp`.`level_id`=`tl`.`ID` WHERE `tlp`.`active`<>''0'' && `tl`.`Active`=''yes'' ' WHERE `object`='bx_acl_view';

DELETE FROM `sys_grid_fields` WHERE `object`='bx_acl_view';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_acl_view', 'level_icon', '_bx_acl_grid_column_level_icon', '5%', 0, 0, '', 1),
('bx_acl_view', 'level_name', '_bx_acl_grid_column_level_name', '15%', 1, 16, '', 2),
('bx_acl_view', 'caption', '_bx_acl_grid_column_caption', '10%', 1, 16, '', 3),
('bx_acl_view', 'description', '_bx_acl_grid_column_description', '10%', 1, 8, '', 4),
('bx_acl_view', 'details', '_bx_acl_grid_column_details', '10%', 1, 8, '', 5),
('bx_acl_view', 'price', '_bx_acl_grid_column_price', '10%', 0, 16, '', 6),
('bx_acl_view', 'period', '_bx_acl_grid_column_period', '10%', 0, 16, '', 7),
('bx_acl_view', 'trial', '_bx_acl_grid_column_trial', '10%', 0, 16, '', 8),
('bx_acl_view', 'actions', '', '20%', 0, '', '', 9);

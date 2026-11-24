-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Audit > Administrators: a row opens its changes from a View button, not from a click on the row.

UPDATE `sys_grid_fields` SET `width` = '12%' WHERE `object` = 'sys_admin_log_administration' AND `name` = 'agent_id' AND `width` = '14%';
UPDATE `sys_grid_fields` SET `width` = '10%' WHERE `object` = 'sys_admin_log_administration' AND `name` = 'action' AND `width` = '14%';

INSERT IGNORE INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('sys_admin_log_administration', 'actions', '', '6%', 0, 0, '', 8);

INSERT IGNORE INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('sys_admin_log_administration', 'single', 'view', '', 'file-text', 0, 1);

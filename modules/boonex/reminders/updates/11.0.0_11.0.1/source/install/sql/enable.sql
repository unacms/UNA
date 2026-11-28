-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_reminders', '_bx_reminders', 'bx_reminders@modules/boonex/reminders/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_reminders', '_bx_reminders', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_reminders_delete_after', '1', @iCategId, '_bx_reminders_option_delete_after', 'digit', '', '', '', 1),
('bx_reminders_system_profile_id', '', @iCategId, '_bx_reminders_option_system_profile_id', 'select', '', '', 'a:2:{s:6:"module";s:12:"bx_reminders";s:6:"method";s:29:"get_options_system_profile_id";}', 2);


-- PAGES
-- PAGES: add page block on dashboard
SET @iPBCellDashboard = 3;
SET @iPBOrderDashboard = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `cell_id` = @iPBCellDashboard LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_dashboard', @iPBCellDashboard, 'bx_reminders', '_bx_reminders_page_block_title_sys_view', '_bx_reminders_page_block_title_view', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_reminders";s:6:"method";s:14:"get_block_view";}', 0, 1, 1, @iPBOrderDashboard);


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('bx_reminders', 'view', NULL, '_bx_reminders_acl_action_view', '', 0, 1);
SET @iIdActionBlockProfile = LAST_INSERT_ID();

SET @iUnauthenticated = 1;
SET @iAccount = 2;
SET @iStandard = 3;
SET @iUnconfirmed = 4;
SET @iPending = 5;
SET @iSuspended = 6;
SET @iModerator = 7;
SET @iAdministrator = 8;
SET @iPremium = 9;

INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES

-- view
(@iStandard, @iIdActionBlockProfile),
(@iModerator, @iIdActionBlockProfile),
(@iAdministrator, @iIdActionBlockProfile),
(@iPremium, @iIdActionBlockProfile);


-- CRON
INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_reminders', '0 0 * * *', 'BxRemindersCron', 'modules/boonex/reminders/classes/BxRemindersCron.php', '');

SET @sName = 'bx_invites';


-- PAGES & BLOCKS
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_invites_invite', '_bx_invites_page_title_sys_invite', '_bx_invites_page_title_invite', @sName, 5, 2147483647, 1, 'invites-invite', 'page.php?i=invites-invite', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_invites_invite', 1, @sName, '_bx_invites_page_block_title_system_invite_form', '_bx_invites_page_block_title_invite_form', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_invites";s:6:"method";s:21:"get_block_form_invite";}', 0, 1, 1);

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_invites_request', '_bx_invites_page_title_sys_request', '_bx_invites_page_title_request', @sName, 5, 2147483647, 1, 'invites-request', 'page.php?i=invites-request', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_invites_request', 1, @sName, '_bx_invites_page_block_title_request_form', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_invites";s:6:"method";s:22:"get_block_form_request";}', 0, 1, 1);

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_invites_requests', '_bx_invites_page_title_sys_requests', '_bx_invites_page_title_requests', @sName, 5, 192, 1, 'invites-requests', 'page.php?i=invites-requests', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_invites_requests', 1, @sName, '_bx_invites_page_block_title_requests', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_invites";s:6:"method";s:25:"get_block_manage_requests";}', 0, 1, 1);

INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_invites_invites', '_bx_invites_page_title_sys_invites', '_bx_invites_page_title_invites', @sName, 5, 2147483647, 1, 'invites-invites', 'page.php?i=invites-invites', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('bx_invites_invites', 1, @sName, '_bx_invites_page_block_title_invites', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_invites";s:6:"method";s:24:"get_block_manage_invites";}', 0, 1, 1);

-- PAGES: add page block on homepage
SET @iPBCellDashboard = 1;
SET @iPBOrderDashboard = 0;
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('sys_home', @iPBCellDashboard, @sName, '_bx_invites_page_block_title_request_form', 11, 1, 'service', 'a:2:{s:6:"module";s:10:"bx_invites";s:6:"method";s:22:"get_block_form_request";}', 0, 0, 0, 1, @iPBOrderDashboard);

-- PAGES: add page block on dashboard
SET @iPBCellDashboard = 3;
SET @iPBOrderDashboard = 2; --(SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `cell_id` = @iPBCellDashboard LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES
('sys_dashboard', @iPBCellDashboard, @sName, '_bx_invites_page_block_title_invite', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_invites";s:6:"method";s:16:"get_block_invite";}', 0, 1, @iPBOrderDashboard);

-- PAGE: service blocks
SET @iBlockOrder = (SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('', 0, @sName, '_bx_invites_page_block_title_system_invite_with_redirect', '_bx_invites_page_block_title_invite', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_invites";s:6:"method";s:16:"get_block_invite";s:6:"params";a:1:{i:0;b:1;}}', 0, 1, 1, @iBlockOrder + 1),
('', 0, @sName, '_bx_invites_page_block_title_system_invite_to_context', '_bx_invites_page_block_title_invite', 11, 2147483647, 'service', 'a:3:{s:6:"module";s:10:"bx_invites";s:6:"method";s:27:"get_block_invite_to_context";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}}', 0, 1, 1, @iBlockOrder + 2),
('', 0, @sName, '_bx_invites_page_block_title_system_accept_by_code', '_bx_invites_page_block_title_accept_by_code', 11, 2147483647, 'service', 'a:2:{s:6:"module";s:10:"bx_invites";s:6:"method";s:24:"get_block_accept_by_code";}', 0, 1, 1, @iBlockOrder + 3);


-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', @sName, 'invites-requests', '_bx_invites_menu_item_title_system_admt_requests', '_bx_invites_menu_item_title_admt_requests', 'page.php?i=invites-requests', '', '_self', 'envelope-open-text', 'a:2:{s:6:"module";s:10:"bx_invites";s:6:"method";s:23:"get_menu_addon_requests";}', '', 192, 1, 0, @iManageMenuOrder + 1);


-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', @sName, '_bx_invites', 'bx_invites@modules/boonex/invites/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, @sName, '_bx_invites', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_invites_key_lifetime', '7', @iCategId, '_bx_invites_option_key_lifetime', 'digit', '', '', '', 2),
('bx_invites_enable_request_invite', 'on', @iCategId, '_bx_invites_option_enable_request_invite', 'checkbox', '', '', '', 3),
('bx_invites_requests_email', '', @iCategId, '_bx_invites_option_requests_email', 'digit', '', '', '', 4),
('bx_invites_enable_reg_by_inv', '', @iCategId, '_bx_invites_option_enable_reg_by_inv', 'checkbox', '', '', '', 5),
('bx_invites_requests_notifications', 'on', @iCategId, '_bx_invites_option_requests_notifications', 'checkbox', '', '', '', 6),
('bx_invites_automatically_befriend', 'on', @iCategId, '_bx_invites_option_automatically_befriend', 'checkbox', '', '', '', 7),
('bx_invites_context_auto_join', '', @iCategId, '_bx_invites_option_context_auto_join', 'checkbox', '', '', '', 20),
('bx_invites_context_key_length', '0', @iCategId, '_bx_invites_option_context_key_length', 'digit', '', '', '', 22);

-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'request', NULL, '_bx_invites_acl_action_request', '', 0, 2147483646);
SET @iIdActionRequest = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'delete request', NULL, '_bx_invites_acl_action_delete_request', '', 0, 1);
SET @iIdActionDeleteRequest = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'delete invite', NULL, '_bx_invites_acl_action_delete_invite', '', 0, 1);
SET @iIdActionDeleteInvite = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'invite', NULL, '_bx_invites_acl_action_invite', '', 1, 1);
SET @iIdActionInvite = LAST_INSERT_ID();

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

-- request invite
(@iUnauthenticated, @iIdActionRequest),

-- delete request
(@iModerator, @iIdActionDeleteRequest),
(@iAdministrator, @iIdActionDeleteRequest),

-- delete invite
(@iModerator, @iIdActionDeleteInvite),
(@iAdministrator, @iIdActionDeleteInvite);

INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`, `AllowedCount`) VALUES
-- invite
(@iAccount, @iIdActionInvite, 5),
(@iStandard, @iIdActionInvite, 5),
(@iUnconfirmed, @iIdActionInvite, 5),
(@iPending, @iIdActionInvite, 5),
(@iSuspended, @iIdActionInvite, 5),
(@iModerator, @iIdActionInvite, 5),
(@iAdministrator, @iIdActionInvite, NULL),
(@iPremium, @iIdActionInvite, 5);

-- GRIDS
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_invites_requests', 'Sql', 'SELECT `bx_inv_requests`.* FROM `bx_inv_requests` WHERE 1', 'bx_inv_requests', 'id', 'status, date', '', '', 20, NULL, 'start', '', 'bx_inv_requests`.`name, bx_inv_requests`.`email', '', 'like', '', '', 192, 'BxInvGridRequests', 'modules/boonex/invites/classes/BxInvGridRequests.php'),
('bx_invites_invites', 'Sql', 'SELECT `bx_inv_invites`.* FROM `bx_inv_invites` WHERE 1', 'bx_inv_invites', 'id', 'date', '', '', 20, NULL, 'start', '', 'email', '', 'like', 'email,date,date_seen,date_joined', '', 192, 'BxInvGridInvites', 'modules/boonex/invites/classes/BxInvGridInvites.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_invites_requests', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_invites_requests', 'name', '_bx_invites_grid_column_title_name', '14%', 0, '', '', 2),
('bx_invites_requests', 'email', '_bx_invites_grid_column_title_email', '14%', 1, '25', '', 3),
('bx_invites_requests', 'nip', '_bx_invites_grid_column_title_nip', '10%', 0, '15', '', 4),
('bx_invites_requests', 'date', '_bx_invites_grid_column_title_date', '10%', 0, '20', '', 5),
('bx_invites_requests', 'joined_account', '_bx_invites_grid_column_title_joined_account', '20%', 0, '20', '', 6),
('bx_invites_requests', 'status', '_bx_invites_grid_column_title_status', '10%', 0, '15', '', 7),
('bx_invites_requests', 'actions', '', '20%', 0, '', '', 8),

('bx_invites_invites', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_invites_invites', 'who_send', '_bx_invites_grid_invites_column_title_who_sent', '12%', 0, '', '', 2),
('bx_invites_invites', 'multi', '_bx_invites_grid_invites_column_title_multi', '5%', 0, '16', '', 3),
('bx_invites_invites', 'email', '_bx_invites_grid_invites_column_title_email', '15%', 1, '25', '', 4),
('bx_invites_invites', 'aj', '_bx_invites_grid_invites_column_title_aj', '10%', 0, '16', '', 5),
('bx_invites_invites', 'date', '_bx_invites_grid_invites_column_title_date', '8%', 0, '20', '', 6),
('bx_invites_invites', 'date_seen', '_bx_invites_grid_invites_column_title_date_seen', '8%', 0, '20', '', 7),
('bx_invites_invites', 'joined_account', '_bx_invites_grid_invites_column_title_joined_account', '12%', 0, '20', '', 8),
('bx_invites_invites', 'date_joined', '_bx_invites_grid_invites_column_title_date_joined', '8%', 0, '20', '', 9),
('bx_invites_invites', 'request', '_bx_invites_grid_invites_column_title_request', '8%', 0, '20', '', 10),
('bx_invites_invites', 'actions', '', '12%', 0, '', '', 11);


INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_invites_requests', 'bulk', 'invite', '_bx_invites_grid_action_title_adm_invite', '', 0, 0, 1),
('bx_invites_requests', 'bulk', 'delete', '_bx_invites_grid_action_title_adm_delete', '', 0, 1, 2),
('bx_invites_requests', 'single', 'info', '_bx_invites_grid_action_title_adm_info', 'info-circle', 1, 0, 1),
('bx_invites_requests', 'single', 'invite', '_bx_invites_grid_action_title_adm_invite', 'envelope', 1, 0, 2),
('bx_invites_requests', 'single', 'delete', '_bx_invites_grid_action_title_adm_delete', 'remove', 1, 1, 3),
('bx_invites_requests', 'single', 'invite_info', '_bx_invites_grid_action_title_adm_invite_info', 'info-circle', 1, 0, 4),
('bx_invites_requests', 'independent', 'add', '_bx_invites_grid_action_title_adm_add', '', 0, 0, 5),

('bx_invites_invites', 'bulk', 'delete', '_bx_invites_grid_action_title_adm_delete', '', 0, 1, 1),
('bx_invites_invites', 'single', 'delete', '_bx_invites_grid_action_title_adm_delete', 'remove', 1, 1, 2),
('bx_invites_invites', 'independent', 'add', '_bx_invites_grid_action_title_adm_add', '', 0, 0, 3);



-- EMAIL TEMPLATES
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES 
(@sName, '_bx_invites_et_invite_form_message', 'bx_invites_invite_form_message', '_bx_invites_et_invite_form_message_subject', '_bx_invites_et_invite_form_message_body'),
(@sName, '_bx_invites_et_invite_by_request_message', 'bx_invites_invite_by_request_message', '_bx_invites_et_invite_by_request_message_subject', '_bx_invites_et_invite_by_request_message_body'),
(@sName, '_bx_invites_et_request_form_message', 'bx_invites_request_form_message', '_bx_invites_et_request_form_message_subject', '_bx_invites_et_request_form_message_body');


-- ALERTS
INSERT INTO `sys_alerts_handlers`(`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxInvResponse', 'modules/boonex/invites/classes/BxInvResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('account', 'add_form_check', @iHandler),
('account', 'add_form', @iHandler),
('account', 'added', @iHandler),
('account', 'delete', @iHandler),

('profile', 'delete', @iHandler),
('profile', 'add', @iHandler),

('bx_analytics', 'get_modules', @iHandler),
('bx_analytics', 'get_reports', @iHandler),
('bx_analytics', 'get_chart_data_line', @iHandler);

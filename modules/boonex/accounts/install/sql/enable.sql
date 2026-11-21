SET @sName = 'bx_accounts';


-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', @sName, '_bx_accounts', 'bx_accounts@modules/boonex/accounts/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, @sName, '_bx_accounts', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_accounts_last_active_sorting', '', @iCategId, '_bx_accounts_option_last_active_sorting', 'checkbox', '', '', '', 1),
('bx_accounts_export_to', 'csv', @iCategId, '_bx_accounts_option_export_to', 'select', '', '', 'a:2:{s:6:"module";s:11:"bx_accounts";s:6:"method";s:21:"get_options_export_to";}', 10),
('bx_accounts_export_fields', 'name,email', @iCategId, '_bx_accounts_option_export_fields', 'list', '', '', 'a:2:{s:6:"module";s:11:"bx_accounts";s:6:"method";s:25:"get_options_export_fields";}', 20);


-- PAGE: module administration
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_accounts_administration', '_bx_accnt_page_title_sys_manage_administration', '_bx_accnt_page_title_manage', @sName, 5, 192, 1, 'accounts-administration', 'page.php?i=accounts-administration', '', '', '', 0, 1, 0, '', '');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_accounts_administration', 1, @sName, '_bx_accnt_page_block_title_system_manage_administration', '_bx_accnt_page_block_title_manage', 11, 192, 'service', 'a:3:{s:6:\"module\";s:11:\"bx_accounts\";s:6:\"method\";s:12:\"manage_tools\";s:6:\"params\";a:1:{i:0;s:14:\"administration\";}}', 0, 1, 0);


-- MENU: manage tools submenu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_accounts_menu_manage_tools', '_bx_accnt_menu_title_manage_tools', 'bx_accounts_menu_manage_tools', @sName, 6, 0, 1, 'BxAccntMenuManageTools', 'modules/boonex/accounts/classes/BxAccntMenuManageTools.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES 
('bx_accounts_menu_manage_tools', @sName, '_bx_accnt_menu_set_title_manage_tools', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('bx_accounts_menu_manage_tools', @sName, 'edit-email', '_bx_accnt_menu_item_title_system_edit_email', '_bx_accnt_menu_item_title_edit_email', 'javascript:void(0)', 'javascript:{js_object}.onClickEditEmail({content_id}, this);', '_self', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM51.31,160,136,75.31,152.69,92,68,176.68ZM48,179.31,76.69,208H48Zm48,25.38L79.31,188,164,103.31,180.69,120Zm96-96L147.31,64l24-24L216,84.68Z"></path></svg>', '', 192, 1, 0, 1),
('bx_accounts_menu_manage_tools', @sName, 'resend-cemail', '_bx_accnt_menu_item_title_system_resend_cemail', '_bx_accnt_menu_item_title_resend_cemail', 'javascript:void(0)', 'javascript:{js_object}.onClickResendCemail({content_id}, this);', '_self', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M231.87,114l-168-95.89A16,16,0,0,0,40.92,37.34L71.55,128,40.92,218.67A16,16,0,0,0,56,240a16.15,16.15,0,0,0,7.93-2.1l167.92-96.05a16,16,0,0,0,.05-27.89ZM56,224a.56.56,0,0,0,0-.12L85.74,136H144a8,8,0,0,0,0-16H85.74L56.06,32.16A.46.46,0,0,0,56,32l168,95.83Z"></path></svg>', '', 192, 1, 0, 2),
('bx_accounts_menu_manage_tools', @sName, 'confirm', '_bx_accnt_menu_item_title_system_confirm', '_bx_accnt_menu_item_title_confirm', 'javascript:void(0)', 'javascript:{js_object}.onClickConfirm({content_id}, this);', '_self', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>', '', 192, 1, 0, 3),
('bx_accounts_menu_manage_tools', @sName, 'reset-password', '_bx_accnt_menu_item_title_system_reset_password', '_bx_accnt_menu_item_title_reset_password', 'javascript:void(0)', 'javascript:{js_object}.onClickResetPassword({content_id}, this);', '_self', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M48,56V200a8,8,0,0,1-16,0V56a8,8,0,0,1,16,0Zm92,54.5L120,117V96a8,8,0,0,0-16,0v21L84,110.5a8,8,0,0,0-5,15.22l20,6.49-12.34,17a8,8,0,1,0,12.94,9.4l12.34-17,12.34,17a8,8,0,1,0,12.94-9.4l-12.34-17,20-6.49A8,8,0,0,0,140,110.5ZM246,115.64A8,8,0,0,0,236,110.5L216,117V96a8,8,0,0,0-16,0v21l-20-6.49a8,8,0,0,0-4.95,15.22l20,6.49-12.34,17a8,8,0,1,0,12.94,9.4l12.34-17,12.34,17a8,8,0,1,0,12.94-9.4l-12.34-17,20-6.49A8,8,0,0,0,246,115.64Z"></path></svg>', '', 192, 1, 0, 4),
('bx_accounts_menu_manage_tools', @sName, 'resend-remail', '_bx_accnt_menu_item_title_system_resend_remail', '_bx_accnt_menu_item_title_resend_remail', 'javascript:void(0)', 'javascript:{js_object}.onClickResendRemail({content_id}, this);', '_self', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M184,104v32a8,8,0,0,1-8,8H99.31l10.35,10.34a8,8,0,0,1-11.32,11.32l-24-24a8,8,0,0,1,0-11.32l24-24a8,8,0,0,1,11.32,11.32L99.31,128H168V104a8,8,0,0,1,16,0Zm48-48V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM216,200V56H40V200H216Z"></path></svg>', '', 192, 1, 0, 5),
('bx_accounts_menu_manage_tools', @sName, 'unlock-account', '_bx_accnt_menu_item_title_system_unlock_account', '_bx_accnt_menu_item_title_unlock_account', 'javascript:void(0)', 'javascript:{js_object}.onClickUnlockAccount({content_id}, this);', '_self', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M208,80H96V56a32,32,0,0,1,32-32c15.37,0,29.2,11,32.16,25.59a8,8,0,0,0,15.68-3.18C171.32,24.15,151.2,8,128,8A48.05,48.05,0,0,0,80,56V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80Zm0,128H48V96H208V208Z"></path></svg>', '', 192, 1, 0, 6),
('bx_accounts_menu_manage_tools', @sName, 'delete', '_bx_accnt_menu_item_title_system_delete', '_bx_accnt_menu_item_title_delete', 'javascript:void(0)', 'javascript:{js_object}.onClickDelete({content_id}, this);', '_self', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>', '', 192, 1, 0, 7),
('bx_accounts_menu_manage_tools', @sName, 'delete-with-content', '_bx_accnt_menu_item_title_system_delete_with_content', '_bx_accnt_menu_item_title_delete_with_content', 'javascript:void(0)', 'javascript:{js_object}.onClickDeleteWithContent({content_id}, this);', '_self', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M225,80.4,183.6,39a24,24,0,0,0-33.94,0L31,157.66a24,24,0,0,0,0,33.94l30.06,30.06A8,8,0,0,0,66.74,224H216a8,8,0,0,0,0-16h-84.7L225,114.34A24,24,0,0,0,225,80.4ZM108.68,208H70.05L42.33,180.28a8,8,0,0,1,0-11.31L96,115.31,148.69,168Zm105-105L160,156.69,107.31,104,161,50.34a8,8,0,0,1,11.32,0l41.38,41.38a8,8,0,0,1,0,11.31Z"></path></svg>', '', 192, 1, 0, 8),
('bx_accounts_menu_manage_tools', @sName, 'make-operator', '_bx_accnt_menu_item_title_system_make_operator', '_bx_accnt_menu_item_title_make_operator', 'javascript:void(0)', 'javascript:{js_object}.onClickMakeOperator({content_id}, this);', '_self', 'wrench', '', 192, 0, 0, 9),
('bx_accounts_menu_manage_tools', @sName, 'unmake-operator', '_bx_accnt_menu_item_title_system_unmake_operator', '_bx_accnt_menu_item_title_unmake_operator', 'javascript:void(0)', 'javascript:{js_object}.onClickUnmakeOperator({content_id}, this);', '_self', 'wrench', '', 192, 0, 0, 10),
('bx_accounts_menu_manage_tools', @sName, 'set-operator-role', '_bx_accnt_menu_item_title_system_set_operator_role', '_bx_accnt_menu_item_title_set_operator_role', 'javascript:void(0)', 'javascript:{js_object}.onClickSetOperatorRole({content_id}, this);', '_self', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M75.19,198.4a8,8,0,0,0,11.21-1.6,52,52,0,0,1,83.2,0,8,8,0,1,0,12.8-9.6A67.88,67.88,0,0,0,155,165.51a40,40,0,1,0-53.94,0A67.88,67.88,0,0,0,73.6,187.2,8,8,0,0,0,75.19,198.4ZM128,112a24,24,0,1,1-24,24A24,24,0,0,1,128,112Zm72-88H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24Zm0,192H56V40H200ZM88,64a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H96A8,8,0,0,1,88,64Z"></path></svg>', '', 192, 1, 0, 11);

-- MENU: dashboard manage tools
SET @iManageMenuOrder = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`='sys_account_dashboard_manage_tools' LIMIT 1);
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', @sName, 'accounts-administration', '_bx_accnt_menu_item_title_system_admt_accounts', '_bx_accnt_menu_item_title_admt_accounts', 'page.php?i=accounts-administration', '', '_self', 'at-sign', 'a:2:{s:6:"module";s:11:"bx_accounts";s:6:"method";s:27:"get_menu_addon_manage_tools";}', '', 192, 1, 0, @iManageMenuOrder + 1);


-- ACL
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'edit any entry', NULL, '_bx_accnt_acl_action_edit_any_account', '', 1, 3);
SET @iIdActionProfileEditAny = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'delete any entry', NULL, '_bx_accnt_acl_action_delete_any_account', '', 1, 3);
SET @iIdActionProfileDeleteAny = LAST_INSERT_ID();

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

-- edit any entry 
(@iModerator, @iIdActionProfileEditAny),
(@iAdministrator, @iIdActionProfileEditAny),

-- delete any entry 
(@iAdministrator, @iIdActionProfileDeleteAny);


-- GRIDS: administration
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('bx_accounts_administration', 'Sql', 'SELECT `ta`.*, `tp`.`status` AS `status`, `ta`.`active` {select} FROM `sys_accounts` AS `ta` LEFT JOIN `sys_profiles` AS `tp` ON `ta`.`id`=`tp`.`account_id` AND `tp`.`type`=''system'' {join} WHERE 1 ', 'sys_accounts', 'id', 'logged', 'status', '', 20, NULL, 'start', '', 'name,email,ip,phone', '', 'like', 'email_confirmed,logged,added', '', 192, 1, 'BxAccntGridAdministration', 'modules/boonex/accounts/classes/BxAccntGridAdministration.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_accounts_administration', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_accounts_administration', 'switcher', '_bx_accnt_grid_column_title_adm_active', '6%', 0, '', '', 2),
('bx_accounts_administration', 'name', '_bx_accnt_grid_column_title_adm_name', '12%', 0, '16', '', 3),
('bx_accounts_administration', 'email', '_bx_accnt_grid_column_title_adm_email', '16%', 0, '16', '', 4),
('bx_accounts_administration', 'is_confirmed', '_bx_accnt_grid_column_title_adm_is_confirmed', '4%', 0, '', '', 5),
('bx_accounts_administration', 'profiles', '_bx_accnt_grid_column_title_adm_profiles', '24%', 0, '', '', 6),
('bx_accounts_administration', 'logged', '_bx_accnt_grid_column_title_adm_logged', '10%', 0, '15', '', 7),
('bx_accounts_administration', 'last_active', '_bx_accnt_grid_column_title_adm_last_active', '10%', 0, '15', '', 8),
('bx_accounts_administration', 'added', '_bx_accnt_grid_column_title_adm_added', '10%', 0, '15', '', 9),
('bx_accounts_administration', 'actions', '', '6%', 0, '', '', 10);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_accounts_administration', 'bulk', 'activate', '_bx_accnt_grid_action_title_adm_activate', '', 0, 0, 1),
('bx_accounts_administration', 'bulk', 'suspend', '_bx_accnt_grid_action_title_adm_suspend', '', 0, 0, 2),
('bx_accounts_administration', 'bulk', 'resend_cemail', '_bx_accnt_grid_action_title_adm_resend_cemail', '', 0, 0, 3),
('bx_accounts_administration', 'bulk', 'resend_remail', '_bx_accnt_grid_action_title_adm_resend_remail', '', 0, 0, 4),
('bx_accounts_administration', 'bulk', 'confirm', '_bx_accnt_grid_action_title_adm_confirm', '', 0, 0, 5),
('bx_accounts_administration', 'bulk', 'delete', '_bx_accnt_grid_action_title_adm_delete', '', 0, 1, 6),
('bx_accounts_administration', 'bulk', 'delete_with_content', '_bx_accnt_grid_action_title_adm_delete_with_content', '', 0, 1, 7),
('bx_accounts_administration', 'bulk', 'export', '_bx_accnt_grid_action_title_adm_export', '', 0, 0, 8),
('bx_accounts_administration', 'bulk', 'send_message', '_bx_accnt_grid_action_title_adm_send_message', '', 0, 0, 9),
('bx_accounts_administration', 'single', 'edit_email', '_bx_accnt_grid_action_title_adm_edit_email', '', 0, 0, 0),
('bx_accounts_administration', 'single', 'reset_password', '_bx_accnt_grid_action_title_adm_reset_password', '', 0, 0, 0),
('bx_accounts_administration', 'single', 'resend_remail', '_bx_accnt_grid_action_title_adm_resend_remail', '', 0, 0, 0),
('bx_accounts_administration', 'single', 'unlock_account', '_bx_accnt_grid_action_title_adm_unlock_account', '', 0, 0, 0),
('bx_accounts_administration', 'single', 'settings', '_bx_accnt_grid_action_title_adm_more_actions', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"></path></svg>', 1, 0, 2),
('bx_accounts_administration', 'independent', 'add', '_bx_accnt_grid_action_title_adm_more_add', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>', 0, 0, 0),
('bx_accounts_administration', 'independent', 'export', '_bx_accnt_grid_action_title_adm_export_all', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z"></path></svg>', 0, 0, 1);

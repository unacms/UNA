
-- EMAIL 

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_facebook', '_bx_facebook_conect_et_password_generated', 'bx_facebook_password_generated', '_bx_facebook_conect_et_password_generated_subject', '_bx_facebook_conect_et_password_generated_body');

-- OBJECTS: AUTH

INSERT INTO `sys_objects_auths` (`Name`, `Title`, `Link`, `Icon`, `Style`) VALUES
('bx_facebook', '_bx_facebook_auth_title', 'modules/?r=facebook_connect/login_form', 'fab facebook-square', 'a:1:{s:7:".bx-btn";a:1:{s:10:"background";s:18:"#3b5999 !important";}}');

-- ALERTS

INSERT INTO `sys_alerts_handlers` SET `name` = 'bx_facebook_connect', `class` = 'BxFaceBookConnectAlerts', `file` = 'modules/boonex/facebook_connect/classes/BxFaceBookConnectAlerts.php';

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers`  WHERE `name` = 'bx_facebook_connect');

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('account', 'logout', @iHandlerId),
('profile', 'delete', @iHandlerId),
('profile', 'add', @iHandlerId);

-- SETTINGS

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_facebook', '_bx_facebook_adm_stg_cpt_type', 'bx_facebook@modules/boonex/facebook_connect/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_facebook_general', '_sys_connect_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_facebook_connect_api_key', '', @iCategId, '_bx_facebook_option_app_id', 'digit', '', '', 10, ''),
('bx_facebook_connect_secret', '', @iCategId, '_bx_facebook_option_app_secret', 'secret', '', '', 20, ''),
('bx_facebook_connect_redirect_page', 'dashboard', @iCategId, '_sys_connect_option_redirect', 'select', '', '', 30, 'join,settings,dashboard,index'),
('bx_facebook_connect_module', 'bx_persons', @iCategId, '_sys_connect_option_module', 'select', '', '', 40, 'a:2:{s:6:"module";s:11:"bx_facebook";s:6:"method";s:20:"get_profiles_modules";}'),
('bx_facebook_connect_privacy', '3', @iCategId, '_sys_connect_option_privacy', 'select', '', '', 44, 'a:2:{s:6:"module";s:11:"bx_facebook";s:6:"method";s:18:"get_privacy_groups";}'),
('bx_facebook_connect_auto_friends', 'on', @iCategId, '_bx_facebook_option_auto_friends', 'checkbox', '', '', 50, ''),
('bx_facebook_connect_extended_info', '', @iCategId, '_bx_facebook_option_fetch_extended_info', 'checkbox', '', '', 60, ''),
('bx_facebook_connect_confirm_email', 'on', @iCategId, '_sys_connect_option_confirm_email', 'checkbox', '', '', 70, ''),
('bx_facebook_connect_approve', '', @iCategId, '_sys_connect_option_approve', 'checkbox', '', '', 80, '');

-- PAGE: error

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_facebook_error', 'facebook-error', '_bx_facebook_error', '_bx_facebook_error', 'bx_facebook', 5, 2147483647, 0, '', '', '', '', 0, 1, 0, 'BxFaceBookConnectPage', 'modules/boonex/facebook_connect/classes/BxFaceBookConnectPage.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_facebook_error', 1, 'bx_facebook', '_bx_facebook_error', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_facebook\";s:6:\"method\";s:10:\"last_error\";}', 0, 0, 1, 1);

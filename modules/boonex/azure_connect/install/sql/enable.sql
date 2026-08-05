
-- Email template

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_azrcon', '_bx_azrcon_et_password_generated', 'bx_azrcon_password_generated', '_bx_azrcon_et_password_generated_subject', '_bx_azrcon_et_password_generated_body');

-- Auth objects

INSERT INTO `sys_objects_auths` (`Name`, `Title`, `Link`, `Icon`, `Style`) VALUES
('bx_azrcon', '_bx_azrcon_auth_title', 'modules/?r=azrcon/start', 'fab microsoft', 'a:1:{s:7:".bx-btn";a:1:{s:10:"background";s:18:"#0078d4 !important";}}');

-- Alerts

INSERT INTO `sys_alerts_handlers` SET `name` = 'bx_azrcon', `class` = 'BxAzrConAlerts', `file` = 'modules/boonex/azure_connect/classes/BxAzrConAlerts.php';

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers`  WHERE `name` = 'bx_azrcon');

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('account', 'logout', @iHandlerId),
('profile', 'delete', @iHandlerId),
('profile', 'add', @iHandlerId);

-- Options

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_azrcon', '_bx_azrcon_adm_stg_cpt_type', 'bx_azrcon@modules/boonex/azure_connect/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_azrcon_general', '_sys_connect_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_azrcon_tenant_id', 'common', @iCategId, '_bx_azrcon_option_tenant_id', 'digit', '', '', 20, ''),
('bx_azrcon_client_id', '', @iCategId, '_bx_azrcon_option_client_id', 'digit', '', '', 22, ''),
('bx_azrcon_secret', '', @iCategId, '_bx_azrcon_option_secret', 'secret', '', '', 24, ''),
('bx_azrcon_redirect_page', 'index', @iCategId, '_sys_connect_option_redirect', 'select', '', '', 40, 'join,settings,dashboard,index'),
('bx_azrcon_module', 'bx_persons', @iCategId, '_sys_connect_option_module', 'select', '', '', 50, 'a:2:{s:6:"module";s:9:"bx_azrcon";s:6:"method";s:20:"get_profiles_modules";}'),
('bx_azrcon_privacy', '3', @iCategId, '_sys_connect_option_privacy', 'select', '', '', 54, 'a:2:{s:6:"module";s:12:"bx_azrcon";s:6:"method";s:18:"get_privacy_groups";}'),
('bx_azrcon_confirm_email', 'on', @iCategId, '_sys_connect_option_confirm_email', 'checkbox', '', '', 70, ''),
('bx_azrcon_approve', '', @iCategId, '_sys_connect_option_approve', 'checkbox', '', '', 80, '');


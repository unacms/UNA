
-- Email template

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_oktacon', '_bx_oktacon_et_password_generated', 'bx_oktacon_password_generated', '_bx_oktacon_et_password_generated_subject', '_bx_oktacon_et_password_generated_body');

-- Auth objects

INSERT INTO `sys_objects_auths` (`Name`, `Title`, `Link`, `Icon`, `Style`) VALUES
('bx_oktacon', '_bx_oktacon_auth_title', 'modules/?r=oktacon/start', 'far circle', 'a:1:{s:7:".bx-btn";a:1:{s:10:"background";s:18:"#0078d4 !important";}}');

-- Alerts

INSERT INTO `sys_alerts_handlers` SET `name` = 'bx_oktacon', `class` = 'BxOktaConAlerts', `file` = 'modules/boonex/okta_connect/classes/BxOktaConAlerts.php';

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers`  WHERE `name` = 'bx_oktacon');

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('account', 'logout', @iHandlerId),
('profile', 'delete', @iHandlerId),
('profile', 'add', @iHandlerId);

-- Options

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_oktacon', '_bx_oktacon_adm_stg_cpt_type', 'bx_oktacon@modules/boonex/okta_connect/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_oktacon_general', '_sys_connect_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_oktacon_domain', '', @iCategId, '_bx_oktacon_option_domain', 'digit', '', '', 20, ''),
('bx_oktacon_client_id', '', @iCategId, '_bx_oktacon_option_client_id', 'digit', '', '', 22, ''),
('bx_oktacon_secret', '', @iCategId, '_bx_oktacon_option_secret', 'secret', '', '', 24, ''),
('bx_oktacon_scope', 'openid profile email', @iCategId, '_bx_oktacon_option_scope', 'digit', '', '', 26, ''),
('bx_oktacon_redirect_page', 'index', @iCategId, '_sys_connect_option_redirect', 'select', '', '', 40, 'join,settings,dashboard,index,custom'),
('bx_oktacon_module', 'bx_persons', @iCategId, '_sys_connect_option_module', 'select', '', '', 50, 'a:2:{s:6:"module";s:10:"bx_oktacon";s:6:"method";s:20:"get_profiles_modules";}'),
('bx_oktacon_privacy', '3', @iCategId, '_sys_connect_option_privacy', 'select', '', '', 54, 'a:2:{s:6:"module";s:10:"bx_oktacon";s:6:"method";s:18:"get_privacy_groups";}'),
('bx_oktacon_confirm_email', 'on', @iCategId, '_sys_connect_option_confirm_email', 'checkbox', '', '', 70, ''),
('bx_oktacon_approve', '', @iCategId, '_sys_connect_option_approve', 'checkbox', '', '', 80, ''),
('bx_oktacon_remember_session', 'on', @iCategId, '_sys_connect_option_remember_session', 'checkbox', '', '', 100, '');


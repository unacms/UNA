
-- Email template

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_dolcon', '_bx_dolcon_et_password_generated', 'bx_dolcon_password_generated', '_bx_dolcon_et_password_generated_subject', '_bx_dolcon_et_password_generated_body');

-- Auth objects

INSERT INTO `sys_objects_auths` (`Name`, `Title`, `Link`, `Icon`, `Style`) VALUES
('bx_dolcon', '_bx_dolcon_auth_title', 'modules/?r=dolcon/start', 'sign-in-alt', 'a:1:{s:7:".bx-btn";a:1:{s:10:"background";s:18:"#3295f8 !important";}}');

-- Alerts

INSERT INTO `sys_alerts_handlers` SET `name` = 'bx_dolcon', `class` = 'BxDolConAlerts', `file` = 'modules/boonex/dolphin_connect/classes/BxDolConAlerts.php';

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers`  WHERE `name` = 'bx_dolcon');

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('account', 'logout', @iHandlerId),
('profile', 'delete', @iHandlerId),
('profile', 'add', @iHandlerId);

-- Options

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_dolcon', '_bx_dolcon_adm_stg_cpt_type', 'bx_dolcon@modules/boonex/dolphin_connect/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_dolcon_general', '_sys_connect_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_dolcon_api_key', '', @iCategId, '_bx_dolcon_option_app_id', 'digit', '', '', 10, ''),
('bx_dolcon_secret', '', @iCategId, '_bx_dolcon_option_app_secret', 'secret', '', '', 20, ''),
('bx_dolcon_url', '', @iCategId, '_bx_dolcon_option_app_url', 'digit', '', '', 30, ''),
('bx_dolcon_redirect_page', 'dashboard', @iCategId, '_sys_connect_option_redirect', 'select', '', '', 40, 'join,settings,dashboard,index'),
('bx_dolcon_module', 'bx_persons', @iCategId, '_sys_connect_option_module', 'select', '', '', 50, 'a:2:{s:6:"module";s:9:"bx_dolcon";s:6:"method";s:20:"get_profiles_modules";}'),
('bx_dolcon_privacy', '3', @iCategId, '_sys_connect_option_privacy', 'select', '', '', 54, 'a:2:{s:6:"module";s:9:"bx_dolcon";s:6:"method";s:18:"get_privacy_groups";}'),
('bx_dolcon_auto_friends', 'on', @iCategId, '_bx_dolcon_option_auto_friends', 'checkbox', '', '', 60, ''),
('bx_dolcon_confirm_email', 'on', @iCategId, '_sys_connect_option_confirm_email', 'checkbox', '', '', 70, ''),
('bx_dolcon_approve', '', @iCategId, '_sys_connect_option_approve', 'checkbox', '', '', 80, ''),
('bx_dolcon_url_rewrite', 'on', @iCategId, '_bx_dolcon_option_rewrite', 'checkbox', '', '', 90, '');

-- Pages

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_dolcon_error', 'dolcon-error', '_bx_dolcon_error', '_bx_dolcon_error', 'bx_dolcon', 5, 2147483647, 0, '', '', '', '', 0, 1, 0, 'BxDolConPage', 'modules/boonex/dolphin_connect/classes/BxDolConPage.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_dolcon_error', 1, 'bx_dolcon', '_bx_dolcon_error', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:9:\"bx_dolcon\";s:6:\"method\";s:10:\"last_error\";}', 0, 0, 1, 1);


-- Settings

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_intercom', '_bx_intercom_adm_stg_cpt_type', 'bx_intercom@modules/boonex/intercom/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_intercom_general', '_bx_intercom_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_intercom_option_app_id', '', @iCategId, '_bx_intercom_option_app_id', 'digit', '', '', 10, ''),
('bx_intercom_option_api_key', '', @iCategId, '_bx_intercom_option_api_key', 'secret', '', '', 20, ''),
('bx_intercom_option_hide_launcher', '', @iCategId, '_bx_intercom_option_hide_launcher', 'checkbox', '', '', 22, ''),
('bx_intercom_option_alignment', 'right', @iCategId, '_bx_intercom_option_alignment', 'select', '', '', 30, 'right,left'),
('bx_intercom_option_horizontal_padding', '20', @iCategId, '_bx_intercom_option_horizontal_padding', 'digit', '', '', 32, ''),
('bx_intercom_option_vertical_padding', '20', @iCategId, '_bx_intercom_option_vertical_padding', 'digit', '', '', 34, '');

-- Injections

INSERT INTO `sys_injections` (`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
('bx_intercom', 0, 'injection_footer', 'service', 'a:2:{s:6:"module";s:11:"bx_intercom";s:6:"method";s:16:"integration_code";}', 0, 1);

-- Alerts

INSERT INTO `sys_alerts_handlers` SET `name` = 'bx_intercom', `class` = 'BxIntercomAlerts', `file` = 'modules/boonex/intercom/classes/BxIntercomAlerts.php';

SET @iHandlerId := (SELECT `id` FROM `sys_alerts_handlers`  WHERE `name` = 'bx_intercom');

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('account', 'delete', @iHandlerId),
('bx_persons', 'deleted', @iHandlerId),
('bx_persons', 'edited', @iHandlerId),
('bx_persons', 'added', @iHandlerId),
('bx_organizations', 'deleted', @iHandlerId),
('bx_organizations', 'edited', @iHandlerId),
('bx_organizations', 'added', @iHandlerId);


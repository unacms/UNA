
-- settings

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_datafox', '_bx_datafox_adm_stg_cpt_type', 'bx_datafox@modules/boonex/datafox/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_datafox_general', '_bx_datafox_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_datafox_id', '', @iCategId, 'DataFox Client ID', 'digit', '', '', 10, ''),
('bx_datafox_secret', '', @iCategId, 'DataFox Client Secret', 'secret', '', '', 12, '');

-- alerts

INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_datafox', 'BxDataFoxAlertsResponse', 'modules/boonex/datafox/classes/BxDataFoxAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'clear_xss', @iHandler);

-- injections

INSERT INTO `sys_injections` (`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
('bx_datafox', 0, 'injection_head', 'service', 'a:2:{s:6:"module";s:10:"bx_datafox";s:6:"method";s:14:"include_css_js";}', 0, 1);


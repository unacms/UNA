SET @sName = 'bx_xero';


-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', @sName, '_bx_xero', 'bx_xero@modules/boonex/xero/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `hidden`, `order`)
VALUES (@iTypeId, 'bx_xero_hidden', '_bx_xero_options_category_hidden', 1, 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_xero_token', '', @iCategId, '_bx_xero_option_token', 'value', '', '', '', 1),
('bx_xero_expires', '', @iCategId, '_bx_xero_option_expires', 'value', '', '', '', 2),
('bx_xero_tenant_id', '', @iCategId, '_bx_xero_option_tenant_id', 'value', '', '', '', 3),
('bx_xero_refresh_token', '', @iCategId, '_bx_xero_option_refresh_token', 'value', '', '', '', 4),
('bx_xero_id_token', '', @iCategId, '_bx_xero_option_id_token', 'value', '', '', '', 5);


INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_xero_general', '_bx_xero_options_category_general', 10);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_xero_client_id', '', @iCategId, '_bx_xero_option_client_id', 'digit', '', '', '', 10),
('bx_xero_client_secret', '', @iCategId, '_bx_xero_option_client_secret', 'secret', '', '', '', 20),
('bx_xero_redirect_url', '{site_url}m/xero/callback', @iCategId, '_bx_xero_option_redirect_url', 'value', '', '', '', 30),
('bx_xero_webhook_url', '{site_url}m/xero/webhook', @iCategId, '_bx_xero_option_webhook_url', 'value', '', '', '', 40),
('bx_xero_webhook_key', '', @iCategId, '_bx_xero_option_webhook_key', 'digit', '', '', '', 42);

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_xero_invoice', '_bx_xero_options_category_invoice', 20);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
('bx_xero_invoice_send', 'on', @iCategId, '_bx_xero_option_invoice_send', 'checkbox', '', '', '', 10);


-- ALERTS
INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
(@sName, 'BxXeroAlertsResponse', 'modules/boonex/xero/classes/BxXeroAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler);


-- INJECTIONS
INSERT INTO `sys_injections` (`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
(@sName, 0, 'injection_head', 'service', 'a:2:{s:6:"module";s:7:"bx_xero";s:6:"method";s:14:"include_css_js";}', 0, 1);

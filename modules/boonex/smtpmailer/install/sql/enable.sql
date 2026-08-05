
-- settings

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_smtp', '_bx_smtp_adm_stg_cpt_type', 'bx_smtpmailer@modules/boonex/smtpmailer/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_smtp_general', '_bx_smtp_adm_stg_cpt_category_general', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_smtp_on', '', @iCategId, '_bx_smtp_option_on', 'checkbox', '', '', 10, ''),
('bx_smtp_auth', '', @iCategId, '_bx_smtp_option_auth', 'checkbox', '', '', 20, ''),
('bx_smtp_username', '', @iCategId, '_bx_smtp_option_username', 'digit', '', '', 30, ''),
('bx_smtp_password', '', @iCategId, '_bx_smtp_option_password', 'secret', '', '', 40, ''),
('bx_smtp_host', '', @iCategId, '_bx_smtp_option_host', 'digit', '', '', 50, ''),
('bx_smtp_port', '25', @iCategId, '_bx_smtp_option_port', 'digit', '', '', 60, ''),
('bx_smtp_secure', 'Not Secure', @iCategId, '_bx_smtp_option_secure', 'select', '', '', 70, 'Not Secure,SSL,TLS'), 
('bx_smtp_allow_selfsigned', '', @iCategId, '_bx_smtp_option_allow_selfsigned', 'checkbox', '', '', 74, ''),
('bx_smtp_from_name', '', @iCategId, '_bx_smtp_option_from_name', 'digit', '', '', 80, ''),
('bx_smtp_from_email', '', @iCategId, '_bx_smtp_option_from_email', 'digit', '', '', 90, ''),
('bx_smtp_test_mode', '', @iCategId, '_bx_smtp_option_test_mode', 'checkbox', '', '', 100, ''),
('bx_smtp_test_email', '', @iCategId, '_bx_smtp_option_test_email', 'digit', '', '', 102, ''),
('bx_smtp_test_subj', '[TEST] ', @iCategId, '_bx_smtp_option_test_subj', 'digit', '', '', 104, '');

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_smtp_oauth', '_bx_smtp_adm_stg_cpt_category_oauth', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `order`, `extra`) VALUES
('bx_smtp_oauth_on', '', @iCategId, '_bx_smtp_option_oauth_on', 'checkbox', '', '', 10, ''),
('bx_smtp_oauth_client_id', '', @iCategId, '_bx_smtp_oauth_client_id', 'digit', '', '', 20, ''),
('bx_smtp_oauth_tenant_id', '', @iCategId, '_bx_smtp_oauth_tenant_id', 'digit', '', '', 30, ''),
('bx_smtp_oauth_tenant_name', '', @iCategId, '_bx_smtp_oauth_tenant_name', 'digit', '', '', 40, ''),
('bx_smtp_oauth_cert_public', '', @iCategId, '_bx_smtp_oauth_cert_public', 'text', '', '', 50, ''),
('bx_smtp_oauth_cert_private', '', @iCategId, '_bx_smtp_oauth_cert_private', 'text', '', '', 60, '');


-- logs

INSERT INTO `sys_objects_logs` (`object`, `module`, `logs_storage`, `title`, `active`, `class_name`, `class_file`) VALUES
('bx_smtp_mailer', 'system', 'Auto', '_bx_smtp_mailer_log', 1, '', '');

-- alerts

INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_smtp', 'BxSMTPAlertsResponse', 'modules/boonex/smtpmailer/classes/BxSMTPAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'before_send_mail', @iHandler);

